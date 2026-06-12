package com.company.report.service;

import com.company.common.domain.ApplicationStatus;
import com.company.common.entity.Application;
import com.company.common.entity.Project;
import com.company.common.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final UserSkillRepository userSkillRepository;
    private final DepartmentRepository departmentRepository;

    public ReportService(ApplicationRepository applicationRepository,
                         ProjectRepository projectRepository,
                         UserSkillRepository userSkillRepository,
                         DepartmentRepository departmentRepository) {
        this.applicationRepository = applicationRepository;
        this.projectRepository = projectRepository;
        this.userSkillRepository = userSkillRepository;
        this.departmentRepository = departmentRepository;
    }

    public Map<String, Object> getHiringProgress() {
        List<Application> allApps = applicationRepository.findAll();
        long total = allApps.size();
        
        long pending = 0;
        long underReview = 0;
        long shortlisted = 0;
        long selected = 0;
        long rejected = 0;
        
        for (Application app : allApps) {
            if (app.getStatus() == ApplicationStatus.PENDING) pending++;
            else if (app.getStatus() == ApplicationStatus.UNDER_REVIEW) underReview++;
            else if (app.getStatus() == ApplicationStatus.SHORTLISTED) shortlisted++;
            else if (app.getStatus() == ApplicationStatus.SELECTED) selected++;
            else if (app.getStatus() == ApplicationStatus.REJECTED) rejected++;
            else if (app.getStatus() == ApplicationStatus.APPLIED) pending++;
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending + underReview); // pending review
        stats.put("shortlisted", shortlisted);
        stats.put("selected", selected);
        stats.put("rejected", rejected);

        return stats;
    }

    public List<Map<String, Object>> getApplicationsPerProject() {
        List<Project> projects = projectRepository.findAll();
        List<Application> applications = applicationRepository.findAll();
        
        // Count applications per project ID
        Map<Long, Integer> counts = new HashMap<>();
        for (Application app : applications) {
            counts.put(app.getProjectId(), counts.getOrDefault(app.getProjectId(), 0) + 1);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Project proj : projects) {
            Map<String, Object> map = new HashMap<>();
            map.put("projectName", proj.getTitle());
            map.put("applicationCount", counts.getOrDefault(proj.getId(), 0));
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getSkillMatrix() {
        List<Object[]> rawCounts = userSkillRepository.findSkillCounts();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rawCounts) {
            Map<String, Object> map = new HashMap<>();
            map.put("skillName", row[0]);
            map.put("count", row[1]);
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getDepartmentHiring() {
        List<Object[]> rawDeptStats = applicationRepository.findHiringCountByDepartment();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rawDeptStats) {
            Map<String, Object> map = new HashMap<>();
            map.put("departmentName", row[0]);
            map.put("count", row[1]);
            result.add(map);
        }
        return result;
    }
}
