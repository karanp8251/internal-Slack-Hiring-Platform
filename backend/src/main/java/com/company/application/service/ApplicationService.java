package com.company.application.service;

import com.company.notification.service.NotificationService;
import com.company.common.domain.ApplicationStatus;
import com.company.common.domain.AvailabilityStatus;
import com.company.common.entity.Application;
import com.company.common.entity.AuditLog;
import com.company.common.entity.User;
import com.company.common.repository.*;
import com.company.slack.service.SlackService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final UserSkillRepository userSkillRepository;
    private final AuditLogRepository auditLogRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MatchService matchService;
    private final NotificationService notificationService;
    private final SlackService slackService;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ProjectSkillRepository projectSkillRepository,
                              UserSkillRepository userSkillRepository,
                              AuditLogRepository auditLogRepository,
                              ProjectRepository projectRepository,
                              UserRepository userRepository,
                              MatchService matchService,
                              NotificationService notificationService,
                              @Lazy SlackService slackService) {
        this.applicationRepository = applicationRepository;
        this.projectSkillRepository = projectSkillRepository;
        this.userSkillRepository = userSkillRepository;
        this.auditLogRepository = auditLogRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.matchService = matchService;
        this.notificationService = notificationService;
        this.slackService = slackService;
    }

    public Application apply(Long projectId, String employeeIdStr) {
        Long employeeId = Long.parseLong(employeeIdStr);

        if (applicationRepository.existsByProjectIdAndEmployeeId(projectId, employeeId)) {
            throw new RuntimeException("Already applied to this project.");
        }

        // Call our advanced multi-weighted matching logic
        MatchService.MatchResult matchResult = matchService.calculateMatch(projectId, employeeId);

        Application application = Application.builder()
                .projectId(projectId)
                .employeeId(employeeId)
                .status(ApplicationStatus.PENDING)
                .matchScore(matchResult.getScore())
                .matchReason(matchResult.getReason())
                .appliedDate(LocalDateTime.now())
                .build();

        Application saved = applicationRepository.save(application);

        // Notify employee
        try {
            String projectTitle = projectRepository.findById(projectId)
                    .map(p -> p.getTitle())
                    .orElse("Project");
            notificationService.sendNotification(
                    employeeId,
                    "Your application for project '" + projectTitle + "' has been submitted successfully! (Match Score: " + saved.getMatchScore() + "%)",
                    "APPLIED"
            );
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }

        // Save Audit Log
        auditLogRepository.save(AuditLog.builder()
                .userId(employeeId)
                .action("APPLY_PROJECT")
                .entity("Application")
                .details("Applied to project ID: " + projectId + " (Application ID: " + saved.getId() + ")")
                .build());

        return saved;
    }

    public Application updateStatus(Long applicationId, String statusStr, String reviewerIdStr) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + applicationId));

        ApplicationStatus oldStatus = app.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.valueOf(statusStr.toUpperCase());
        app.setStatus(newStatus);
        app.setReviewedBy(Long.parseLong(reviewerIdStr));
        app.setReviewedAt(LocalDateTime.now());

        // Perform Conflict Detection & User updates when SELECTED or ACCEPTED
        String conflictWarning = "";
        if (newStatus == ApplicationStatus.SELECTED || newStatus == ApplicationStatus.ACCEPTED) {
            // Check availability status of the user
            User candidate = userRepository.findById(app.getEmployeeId()).orElse(null);
            if (candidate != null) {
                if (candidate.getAvailabilityStatus() == AvailabilityStatus.BUSY) {
                    conflictWarning = " [CONFLICT: Candidate Availability is BUSY]";
                } else if (candidate.getAvailabilityStatus() == AvailabilityStatus.ON_LEAVE) {
                    conflictWarning = " [CONFLICT: Candidate is ON LEAVE]";
                }
                
                // Set availability to BUSY
                candidate.setAvailabilityStatus(AvailabilityStatus.BUSY);
                userRepository.save(candidate);
            }

            // Check if selected on another active project
            List<Application> otherApps = applicationRepository.findByEmployeeId(app.getEmployeeId());
            boolean alreadySelected = otherApps.stream()
                    .anyMatch(a -> !a.getId().equals(applicationId) && (a.getStatus() == ApplicationStatus.SELECTED || a.getStatus() == ApplicationStatus.ACCEPTED));
            if (alreadySelected) {
                conflictWarning += " [CONFLICT: Already SELECTED for another project role]";
            }
        }

        Application saved = applicationRepository.save(app);

        // Fetch Project Title
        String projectTitle = projectRepository.findById(app.getProjectId())
                .map(p -> p.getTitle())
                .orElse("Project");

        // Trigger Google Calendar Interview Scheduling if Shortlisted
        if (newStatus == ApplicationStatus.SHORTLISTED) {
            try {
                slackService.sendSimulatedSchedulingDM(app.getId(), app.getEmployeeId(), projectTitle);
            } catch (Exception e) {
                log.error("Failed to trigger Slack scheduling bot DM: {}", e.getMessage());
            }
        }

        // Customize notification message based on status
        String messageText;
        switch (newStatus) {
            case SHORTLISTED:
                messageText = "Congratulations! You have been shortlisted for '" + projectTitle + "'. Please choose an interview slot in Slack.";
                break;
            case SELECTED:
            case ACCEPTED:
                messageText = "Congratulations! You have been selected/accepted for project '" + projectTitle + "'!" + (conflictWarning.isEmpty() ? "" : " Warning flags:" + conflictWarning);
                break;
            case REJECTED:
                messageText = "Your application for '" + projectTitle + "' was not selected this time.";
                break;
            case UNDER_REVIEW:
                messageText = "Your application for '" + projectTitle + "' is now under review.";
                break;
            default:
                messageText = "Your application status for '" + projectTitle + "' was updated to " + newStatus;
        }

        // Send notification to employee
        try {
            notificationService.sendNotification(
                    app.getEmployeeId(),
                    messageText + conflictWarning,
                    newStatus.name()
            );
        } catch (Exception e) {
            log.error("Failed to send status update notification: {}", e.getMessage());
        }

        // Save Audit Log
        auditLogRepository.save(AuditLog.builder()
                .userId(Long.parseLong(reviewerIdStr))
                .action("REVIEW_APPLICATION")
                .entity("Application")
                .details("Updated Application ID: " + applicationId + " status to " + newStatus + conflictWarning)
                .build());

        return saved;
    }

    public List<Application> getMyApplications(String employeeIdStr) {
        Long employeeId = Long.parseLong(employeeIdStr);
        return applicationRepository.findByEmployeeId(employeeId);
    }

    // New service methods from specification
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Application getApplicationById(Long id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Application not found: " + id));
    }

    public List<Application> getApplicationsByProject(Long projectId) {
        return applicationRepository.findByProjectId(projectId);
    }

    public List<Application> getApplicationsByEmployee(Long employeeId) {
        return applicationRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public Application applyForProject(Long employeeId, Long projectId) {
        return apply(projectId, String.valueOf(employeeId));
    }

    @Transactional
    public Application updateApplicationStatus(Long applicationId, ApplicationStatus newStatus) {
        return updateStatus(applicationId, newStatus.name(), "1");
    }

    public void deleteApplication(Long id) {
        applicationRepository.deleteById(id);
    }
}
