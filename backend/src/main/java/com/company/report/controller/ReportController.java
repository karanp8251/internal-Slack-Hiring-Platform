package com.company.report.controller;

import com.company.report.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/hiring")
    public ResponseEntity<Map<String, Object>> getHiringProgress() {
        return ResponseEntity.ok(reportService.getHiringProgress());
    }

    @GetMapping("/projects")
    public ResponseEntity<List<Map<String, Object>>> getApplicationsPerProject() {
        return ResponseEntity.ok(reportService.getApplicationsPerProject());
    }

    @GetMapping("/skills")
    public ResponseEntity<List<Map<String, Object>>> getSkillMatrix() {
        return ResponseEntity.ok(reportService.getSkillMatrix());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentHiring() {
        return ResponseEntity.ok(reportService.getDepartmentHiring());
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager em;

    @GetMapping("/fixenum")
    @org.springframework.transaction.annotation.Transactional
    public String fixEnum() {
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'APPLIED'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'UNDER_REVIEW'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'SHORTLISTED'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'SELECTED'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'REJECTED'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'WITHDRAWN'").executeUpdate(); } catch(Exception e) {}
        try { em.createNativeQuery("ALTER TYPE application_status ADD VALUE 'ACCEPTED'").executeUpdate(); } catch(Exception e) {}
        return "Done";
    }
}
