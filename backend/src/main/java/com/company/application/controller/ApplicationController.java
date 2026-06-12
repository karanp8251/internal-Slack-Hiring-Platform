package com.company.application.controller;

import com.company.common.entity.Application;
import com.company.common.domain.ApplicationStatus;
import com.company.application.service.ApplicationService;
import com.company.application.service.CalendarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CalendarService calendarService;

    public ApplicationController(ApplicationService applicationService, CalendarService calendarService) {
        this.applicationService = applicationService;
        this.calendarService = calendarService;
    }

    @PostMapping
    public ResponseEntity<Application> apply(@RequestHeader("X-User-Id") String userId,
                                             @RequestBody Map<String, Object> request) {
        Long projectId = ((Number) request.get("projectId")).longValue();
        return ResponseEntity.ok(applicationService.apply(projectId, userId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Application> updateStatus(@PathVariable("id") Long id,
                                                    @RequestHeader("X-User-Id") String userId,
                                                    @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(applicationService.updateStatus(id, status, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Application>> getMyApplications(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(applicationService.getMyApplications(userId));
    }

    @GetMapping("/{id}/interview")
    public ResponseEntity<?> getInterview(@PathVariable("id") Long id) {
        return calendarService.getInterviewByApplication(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // New specifications endpoints
    @GetMapping
    public ResponseEntity<List<Application>> getAll() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<Application>> getByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(applicationService.getApplicationsByProject(projectId));
    }

    @GetMapping("/by-employee/{employeeId}")
    public ResponseEntity<List<Application>> getByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(applicationService.getApplicationsByEmployee(employeeId));
    }

    @PostMapping("/apply")
    public ResponseEntity<Application> apply(@RequestParam Long employeeId,
                                             @RequestParam Long projectId) {
        return ResponseEntity.ok(applicationService.applyForProject(employeeId, projectId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Application> updateStatusPatch(@PathVariable Long id,
                                                         @RequestParam ApplicationStatus status) {
        return ResponseEntity.ok(applicationService.updateApplicationStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }
}
