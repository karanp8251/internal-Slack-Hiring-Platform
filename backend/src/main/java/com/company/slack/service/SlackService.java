package com.company.slack.service;

import com.company.common.domain.ProjectStatus;
import com.company.common.entity.Application;
import com.company.common.entity.Notification;
import com.company.common.entity.Project;
import com.company.common.entity.User;
import com.company.common.repository.ApplicationRepository;
import com.company.common.repository.NotificationRepository;
import com.company.common.repository.ProjectRepository;
import com.company.common.repository.UserRepository;
import com.company.application.service.CalendarService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@Slf4j
public class SlackService {

    @Value("${slack.bot.token:mock_bot_token}")
    private String botToken;

    private final NotificationRepository notificationRepository;
    private final ProjectRepository projectRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CalendarService calendarService;
    private final com.company.application.service.ApplicationService applicationService;
    
    private final RestTemplate restTemplate = new RestTemplate();

    public SlackService(NotificationRepository notificationRepository,
                        ProjectRepository projectRepository,
                        ApplicationRepository applicationRepository,
                        UserRepository userRepository,
                        @Lazy CalendarService calendarService,
                        @Lazy com.company.application.service.ApplicationService applicationService) {
        this.notificationRepository = notificationRepository;
        this.projectRepository = projectRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.calendarService = calendarService;
        this.applicationService = applicationService;
    }

    public void announceProject(Long projectId, String title, String description, List<String> skillNames, String targetChannel, Integer openings) {
        String skillsText = String.join(", ", skillNames);
        String slackMessage = String.format(
                "🚀 *NEW PROJECT OPPORTUNITY* 🚀\n" +
                "*Title:* %s\n" +
                "*Description:* %s\n" +
                "*Required Skills:* %s\n" +
                "*Openings:* %d\n" +
                "*Channel:* %s\n" +
                "Click [Apply Now](http://localhost:5173/projects/%d) or type `/apply-project %d` in Slack to submit your application!",
                title, description, skillsText, openings, targetChannel, projectId, projectId
        );

        // 1. Post to actual Slack API if token is configured
        if (botToken != null && !botToken.isEmpty() && !"mock_bot_token".equals(botToken)) {
            try {
                postToSlackChannel(targetChannel, slackMessage);
            } catch (Exception e) {
                log.error("Failed to post message to real Slack: {}", e.getMessage());
            }
        }

        // 2. Persist in database as a public announcement so frontend's Slack Simulator can render it
        Long systemUserId = userRepository.findByEmail("slack.system@company.com")
                .map(User::getId)
                .orElse(1L);

        Notification announcement = Notification.builder()
                .userId(systemUserId)
                .message(slackMessage)
                .readStatus(false)
                .type("SLACK_ANNOUNCEMENT")
                .createdDate(LocalDateTime.now())
                .build();
        notificationRepository.save(announcement);
        log.info("Persisted Slack announcement for project ID: {}", projectId);
    }

    public void notifyEmployeesAboutNewProject(Project project, List<String> skillNames) {
        List<User> users = userRepository.findAll(); // Notify all users including SUPER_ADMIN
        String skillsText = String.join(", ", skillNames);
        String slackMessage = String.format(
                "📢 *NEW PROJECT ALERT* 📢\n" +
                "A new project role is open and might match your profile:\n" +
                "*Title:* %s\n" +
                "*Description:* %s\n" +
                "*Required Skills:* %s\n" +
                "*Openings:* %d\n" +
                "Apply here: http://localhost:5173/projects or type `/apply-project %d` directly in Slack!",
                project.getTitle(), project.getDescription(), skillsText, project.getOpenings(), project.getId()
        );

        for (User emp : users) {
            // 1. Post to actual Slack API if token is configured and user has a slack_id
            if (botToken != null && !botToken.isEmpty() && !"mock_bot_token".equals(botToken) 
                    && emp.getSlackId() != null && !emp.getSlackId().isEmpty()) {
                try {
                    postToSlackChannel(emp.getSlackId(), slackMessage);
                } catch (Exception e) {
                    log.error("Failed to post project DM to employee {}: {}", emp.getId(), e.getMessage());
                }
            }

            // 2. Persist in database as a DM notification for this employee so the Slack Simulator shows it
            Notification dm = Notification.builder()
                    .userId(emp.getId())
                    .message(slackMessage)
                    .readStatus(false)
                    .type("SLACK_NEW_PROJECT_DM")
                    .createdDate(LocalDateTime.now())
                    .build();
            notificationRepository.save(dm);
        }
        log.info("Notified {} employees about new project ID: {}", users.size(), project.getId());
    }

    public void sendSimulatedSchedulingDM(Long applicationId, Long employeeId, String projectTitle) {
        List<String> slots = calendarService.getAvailableSlots();
        
        StringBuilder sb = new StringBuilder();
        sb.append("📅 *INTERVIEW SCHEDULING REQUEST* 📅\n");
        sb.append("You have been shortlisted for project: *").append(projectTitle).append("*.\n");
        sb.append("Please select one of the following available slots from Google Calendar to book your interview:\n");
        for (String slot : slots) {
            sb.append("[BOOK:").append(applicationId).append("|").append(slot).append("]\n");
        }
        
        Notification dm = Notification.builder()
                .userId(employeeId)
                .message(sb.toString())
                .readStatus(false)
                .type("SLACK_SCHEDULING_DM")
                .createdDate(LocalDateTime.now())
                .build();
        notificationRepository.save(dm);
        log.info("Sent simulated scheduling Slack DM to user ID: {}", employeeId);
    }

    public void confirmSlackBooking(Long applicationId, String slotText) {
        com.company.common.entity.Interview interview = calendarService.confirmBooking(applicationId, slotText);
        
        // Find and update the scheduling message
        Optional<Application> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isPresent()) {
            Long employeeId = appOpt.get().getEmployeeId();
            List<Notification> dms = notificationRepository.findByUserIdOrderByCreatedDateDesc(employeeId);
            for (Notification dm : dms) {
                if ("SLACK_SCHEDULING_DM".equals(dm.getType()) && dm.getMessage().contains("[BOOK:" + applicationId + "|")) {
                    String newMsg = "✅ *INTERVIEW BOOKED SUCCESSFULLY!* ✅\n" +
                                    "Project Application ID: " + applicationId + "\n" +
                                    "Confirmed Slot: *" + slotText + "*\n" +
                                    "Google Event ID: `" + interview.getGoogleEventId() + "`\n" +
                                    "Google Calendar invite sent to candidate and interviewer.";
                    dm.setMessage(newMsg);
                    dm.setType("SLACK_SCHEDULING_CONFIRMED");
                    notificationRepository.save(dm);
                    break;
                }
            }
        }
    }

    private void postToSlackChannel(String channel, String text) {
        String url = "https://slack.com/api/chat.postMessage";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(botToken);

        Map<String, Object> body = new HashMap<>();
        body.put("channel", channel);
        body.put("text", text);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        Map<?, ?> response = restTemplate.postForObject(url, entity, Map.class);
        log.info("Slack API Response: {}", response);
    }

    public Map<String, Object> handleSlashCommand(String command, String slackUserId, String text) {
        log.info("Processing Slack slash command: {} by user: {}", command, slackUserId);
        
        Optional<User> userOpt = userRepository.findBySlackId(slackUserId);
        if (userOpt.isEmpty() && "U_SLACK_MOCK_123".equals(slackUserId)) {
            userOpt = userRepository.findByEmail("karan@company.com");
        }

        String responseText;
        switch (command) {
            case "/open-roles":
            case "/project-list":
                List<Project> openProjects = projectRepository.findAll().stream()
                        .filter(p -> p.getStatus() == ProjectStatus.OPEN)
                        .toList();
                if (openProjects.isEmpty()) {
                    responseText = "There are currently no open project roles.";
                } else {
                    StringBuilder sb = new StringBuilder("🔓 *Open Project Roles:*\n");
                    for (Project p : openProjects) {
                        sb.append(String.format("• *%s* (ID: %d) — %d openings left, deadline: %s\n", 
                                p.getTitle(), p.getId(), p.getOpenings(), p.getDeadline()));
                    }
                    responseText = sb.toString();
                }
                break;

            case "/my-applications":
                if (userOpt.isEmpty()) {
                    responseText = "⚠️ Your Slack account is not linked to any profile on the Talent Platform. Please log in first.";
                } else {
                    User user = userOpt.get();
                    List<Application> apps = applicationRepository.findByEmployeeId(user.getId());
                    if (apps.isEmpty()) {
                        responseText = "You have not applied to any projects yet.";
                    } else {
                        StringBuilder sb = new StringBuilder(String.format("📋 *Applications for %s:*\n", user.getName()));
                        for (Application app : apps) {
                            String projectTitle = projectRepository.findById(app.getProjectId())
                                    .map(Project::getTitle)
                                    .orElse("Unknown Project");
                            sb.append(String.format("• *%s* — Status: `%s` (AI Match Score: %d%%)\n", 
                                    projectTitle, app.getStatus(), app.getMatchScore()));
                        }
                        responseText = sb.toString();
                    }
                }
                break;

            case "/project-status":
                if (text == null || text.trim().isEmpty()) {
                    responseText = "⚠️ Please specify a project ID. Example: `/project-status 1`";
                } else {
                    try {
                        Long pId = Long.parseLong(text.trim());
                        Optional<Project> projOpt = projectRepository.findById(pId);
                        if (projOpt.isEmpty()) {
                            responseText = "❌ Project not found with ID: " + pId;
                        } else {
                            Project p = projOpt.get();
                            responseText = String.format("📊 *Project Status (ID: %d):*\n*Title:* %s\n*Status:* `%s`\n*Openings:* %d\n*Deadline:* %s",
                                     p.getId(), p.getTitle(), p.getStatus(), p.getOpenings(), p.getDeadline());
                        }
                    } catch (NumberFormatException e) {
                        responseText = "⚠️ Invalid project ID format. Please supply a numeric ID. Example: `/project-status 1`";
                    }
                }
                break;

            case "/apply-project":
                if (userOpt.isEmpty()) {
                    responseText = "⚠️ Your Slack account is not linked to any profile on the Talent Platform. Please log in first.";
                } else {
                    if (text == null || text.trim().isEmpty()) {
                        responseText = "⚠️ Please specify a project ID. Example: `/apply-project 1`";
                    } else {
                        try {
                            Long pId = Long.parseLong(text.trim());
                            User user = userOpt.get();
                            Application app = applicationService.applyForProject(user.getId(), pId);
                            responseText = String.format("✅ *Application Submitted!*\nYou have successfully applied to Project ID: %d.\nAI Match Score: %d%%.\nYou can check your applications with `/my-applications`.", pId, app.getMatchScore());
                        } catch (NumberFormatException e) {
                            responseText = "⚠️ Invalid project ID format. Please supply a numeric ID. Example: `/apply-project 1`";
                        } catch (Exception e) {
                            responseText = "❌ Failed to apply: " + e.getMessage();
                        }
                    }
                }
                break;

            default:
                responseText = "❓ Unknown command: " + command;
        }

        return Map.of(
                "response_type", "ephemeral",
                "text", responseText
        );
    }

    public List<Notification> getMockAnnouncements() {
        Long systemUserId = userRepository.findByEmail("slack.system@company.com")
                .map(User::getId)
                .orElse(1L);
        return notificationRepository.findByUserIdOrderByCreatedDateDesc(systemUserId);
    }
    
    public List<Notification> getMockDMs(Long employeeId) {
        return notificationRepository.findByUserIdOrderByCreatedDateDesc(employeeId);
    }
}
