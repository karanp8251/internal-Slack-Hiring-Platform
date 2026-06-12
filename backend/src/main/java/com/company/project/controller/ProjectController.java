package com.company.project.controller;

import com.company.common.entity.Application;
import com.company.common.entity.Project;
import com.company.common.entity.ProjectSkill;
import com.company.common.domain.ProjectStatus;
import com.company.common.repository.ApplicationRepository;
import com.company.project.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final ApplicationRepository applicationRepository;

    public ProjectController(ProjectService projectService,
                             ApplicationRepository applicationRepository) {
        this.projectService = projectService;
        this.applicationRepository = applicationRepository;
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestHeader("X-User-Id") String userId,
                                                 @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(projectService.createProject(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable("id") Long id,
                                                 @RequestHeader("X-User-Id") String userId,
                                                 @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(projectService.updateProject(id, updates, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProject(@PathVariable("id") Long id,
                                                             @RequestHeader("X-User-Id") String userId) {
        projectService.deleteProject(id, userId);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }

    @GetMapping("/{id}/applicants")
    public ResponseEntity<List<Application>> getApplicants(@PathVariable("id") Long id) {
        return ResponseEntity.ok(applicationRepository.findByProjectIdOrderByMatchScoreDesc(id));
    }

    // New specific CRUD mappings from user specification
    @GetMapping("/by-status")
    public ResponseEntity<List<Project>> getByStatus(@RequestParam ProjectStatus status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }

    @GetMapping("/by-manager/{managerId}")
    public ResponseEntity<List<Project>> getByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(projectService.getProjectsByManager(managerId));
    }

    @GetMapping("/matching/{userId}")
    public ResponseEntity<List<Project>> getMatchingProjects(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getMatchingProjectsForUser(userId));
    }

    @PostMapping("/create")
    public ResponseEntity<Project> create(@RequestBody Project project,
                                          @RequestParam(required = false) Long managerId) {
        return ResponseEntity.ok(projectService.createProject(project, managerId));
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<Project> update(@PathVariable Long id,
                                          @RequestBody Project project) {
        return ResponseEntity.ok(projectService.updateProject(id, project));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Project> updateStatus(@PathVariable Long id,
                                                @RequestParam ProjectStatus status) {
        return ResponseEntity.ok(projectService.updateProjectStatus(id, status));
    }

    @PostMapping("/{projectId}/skills/{skillId}")
    public ResponseEntity<ProjectSkill> addSkill(@PathVariable Long projectId,
                                                 @PathVariable Long skillId) {
        return ResponseEntity.ok(projectService.addSkillToProject(projectId, skillId));
    }

    @DeleteMapping("/{id}/delete")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
