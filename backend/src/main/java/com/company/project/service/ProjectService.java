package com.company.project.service;

import com.company.common.domain.ProjectStatus;
import com.company.common.entity.AuditLog;
import com.company.common.entity.Project;
import com.company.common.entity.ProjectSkill;
import com.company.common.entity.Skill;
import com.company.common.entity.User;
import com.company.common.repository.AuditLogRepository;
import com.company.common.repository.ProjectRepository;
import com.company.common.repository.ProjectSkillRepository;
import com.company.common.repository.SkillRepository;
import com.company.common.repository.UserRepository;
import com.company.slack.service.SlackService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final AuditLogRepository auditLogRepository;
    private final SlackService slackService;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          SkillRepository skillRepository,
                          ProjectSkillRepository projectSkillRepository,
                          AuditLogRepository auditLogRepository,
                          SlackService slackService,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.skillRepository = skillRepository;
        this.projectSkillRepository = projectSkillRepository;
        this.auditLogRepository = auditLogRepository;
        this.slackService = slackService;
        this.userRepository = userRepository;
    }

    public Project createProject(Map<String, Object> req, String managerIdStr) {
        Long managerId = Long.parseLong(managerIdStr);
        String title = (String) req.get("title");
        String description = (String) req.get("description");
        Integer openings = (Integer) req.get("openings");
        String deadlineStr = (String) req.get("deadline");
        LocalDate deadline = deadlineStr != null ? LocalDate.parse(deadlineStr) : LocalDate.now().plusDays(30);
        Integer durationMonths = (Integer) req.get("durationMonths");
        String targetSlackChannel = (String) req.get("targetSlackChannel");
        if (targetSlackChannel == null || targetSlackChannel.isEmpty()) {
            targetSlackChannel = "#general";
        }

        Project project = Project.builder()
                .title(title)
                .description(description)
                .managerId(managerId)
                .openings(openings)
                .deadline(deadline)
                .durationMonths(durationMonths)
                .status(ProjectStatus.OPEN)
                .targetSlackChannel(targetSlackChannel)
                .build();

        Project saved = projectRepository.save(project);

        // Process skills
        List<String> skillNames = new ArrayList<>();
        if (req.containsKey("skills")) {
            List<?> skillsObj = (List<?>) req.get("skills");
            for (Object skillObj : skillsObj) {
                if (skillObj instanceof String) {
                    String skillName = (String) skillObj;
                    Skill skill = skillRepository.findBySkillNameIgnoreCase(skillName)
                            .orElseGet(() -> skillRepository.save(Skill.builder().skillName(skillName).build()));
                    projectSkillRepository.save(ProjectSkill.builder()
                            .projectId(saved.getId())
                            .skillId(skill.getId())
                            .build());
                    skillNames.add(skill.getSkillName());
                } else if (skillObj instanceof Number) {
                    Long skillId = ((Number) skillObj).longValue();
                    skillRepository.findById(skillId).ifPresent(skill -> {
                        projectSkillRepository.save(ProjectSkill.builder()
                                .projectId(saved.getId())
                                .skillId(skill.getId())
                                .build());
                        skillNames.add(skill.getSkillName());
                    });
                }
            }
        }

        // Trigger Slack announcement asynchronously
        try {
            slackService.announceProject(
                    saved.getId(),
                    saved.getTitle(),
                    saved.getDescription(),
                    skillNames,
                    targetSlackChannel,
                    saved.getOpenings()
            );
        } catch (Exception e) {
            // Slack not configured or offline
        }

        // Send DMs to all employees on project creation
        try {
            slackService.notifyEmployeesAboutNewProject(saved, skillNames);
        } catch (Exception e) {
            // Ignore or log
        }

        // Save Audit Log
        auditLogRepository.save(AuditLog.builder()
                .userId(managerId)
                .action("CREATE_PROJECT")
                .entity("Project")
                .details("Created project: " + title + " (ID: " + saved.getId() + ")")
                .build());

        return saved;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));
    }

    public Project updateProject(Long id, Map<String, Object> updates, String managerIdStr) {
        Project project = getProjectById(id);
        if (updates.containsKey("title")) {
            project.setTitle((String) updates.get("title"));
        }
        if (updates.containsKey("description")) {
            project.setDescription((String) updates.get("description"));
        }
        if (updates.containsKey("openings")) {
            project.setOpenings((Integer) updates.get("openings"));
        }
        if (updates.containsKey("status")) {
            project.setStatus(ProjectStatus.valueOf((String) updates.get("status")));
        }
        Project saved = projectRepository.save(project);

        auditLogRepository.save(AuditLog.builder()
                .userId(Long.parseLong(managerIdStr))
                .action("UPDATE_PROJECT")
                .entity("Project")
                .details("Updated project: " + project.getTitle() + " (ID: " + saved.getId() + ")")
                .build());

        return saved;
    }

    public void deleteProject(Long id, String managerIdStr) {
        Project project = getProjectById(id);
        projectSkillRepository.deleteByProjectId(id);
        projectRepository.delete(project);

        auditLogRepository.save(AuditLog.builder()
                .userId(Long.parseLong(managerIdStr))
                .action("DELETE_PROJECT")
                .entity("Project")
                .details("Deleted project: " + project.getTitle() + " (ID: " + id + ")")
                .build());
    }

    // New methods from user specifications
    public List<Project> getProjectsByStatus(ProjectStatus status) {
        return projectRepository.findByStatus(status);
    }

    public List<Project> getProjectsByManager(Long managerId) {
        return projectRepository.findByManagerId(managerId);
    }

    public List<Project> getMatchingProjectsForUser(Long userId) {
        return projectRepository.findMatchingProjectsForUser(userId);
    }

    public Project createProject(Project project, Long managerId) {
        if (managerId != null) {
            User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found: " + managerId));
            project.setManager(manager);
            project.setManagerId(managerId);
        }
        return projectRepository.save(project);
    }

    public Project updateProject(Long id, Project updated) {
        Project existing = getProjectById(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setOpenings(updated.getOpenings());
        existing.setDeadline(updated.getDeadline());
        existing.setDurationMonths(updated.getDurationMonths());
        existing.setStatus(updated.getStatus());
        return projectRepository.save(existing);
    }

    public Project updateProjectStatus(Long id, ProjectStatus status) {
        Project project = getProjectById(id);
        project.setStatus(status);
        return projectRepository.save(project);
    }

    public ProjectSkill addSkillToProject(Long projectId, Long skillId) {
        Project project = getProjectById(projectId);
        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));

        ProjectSkill ps = ProjectSkill.builder()
            .project(project)
            .projectId(projectId)
            .skill(skill)
            .skillId(skillId)
            .build();
        return projectSkillRepository.save(ps);
    }

    public void deleteProject(Long id) {
        Project project = getProjectById(id);
        projectSkillRepository.deleteByProjectId(id);
        projectRepository.delete(project);
    }
}
