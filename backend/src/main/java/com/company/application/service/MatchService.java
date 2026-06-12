package com.company.application.service;

import com.company.common.entity.*;
import com.company.common.repository.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MatchService {

    @Value("${gemini.api.key:mock_key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final UserSkillRepository userSkillRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final SkillRepository skillRepository;
    private final AuditLogRepository auditLogRepository;

    public MatchService(ProjectRepository projectRepository,
                        UserRepository userRepository,
                        ApplicationRepository applicationRepository,
                        UserSkillRepository userSkillRepository,
                        ProjectSkillRepository projectSkillRepository,
                        SkillRepository skillRepository,
                        AuditLogRepository auditLogRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.userSkillRepository = userSkillRepository;
        this.projectSkillRepository = projectSkillRepository;
        this.skillRepository = skillRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Advanced multi-weighted matching calculation based on PDR F.1 & F.5.
     */
    public MatchResult calculateMatch(Long projectId, Long employeeId) {
        // 1. Skill Overlap (40% Weight)
        List<String> reqSkills = projectSkillRepository.findSkillNamesByProjectId(projectId);
        List<UserSkill> userSkills = userSkillRepository.findByUserId(employeeId);
        
        Map<String, Integer> userSkillsMap = new HashMap<>();
        for (UserSkill us : userSkills) {
            skillRepository.findById(us.getSkillId()).ifPresent(sk -> {
                userSkillsMap.put(sk.getSkillName().toLowerCase(), us.getProficiency());
            });
        }

        double overlapSum = 0.0;
        if (reqSkills == null || reqSkills.isEmpty()) {
            overlapSum = 1.0;
        } else {
            for (String reqSkill : reqSkills) {
                Integer prof = userSkillsMap.get(reqSkill.toLowerCase());
                if (prof != null) {
                    if (prof >= 5) overlapSum += 1.0; // Expert
                    else if (prof == 4) overlapSum += 0.75; // Advanced
                    else if (prof == 3) overlapSum += 0.5; // Intermediate
                    else overlapSum += 0.25; // Beginner
                }
            }
            overlapSum = overlapSum / reqSkills.size();
        }
        int skillOverlapScore = (int) (overlapSum * 100);

        // 2. Historical Success Rate (25% Weight)
        List<Application> apps = applicationRepository.findByEmployeeId(employeeId);
        long totalApps = apps.size();
        long selectedApps = apps.stream()
                .filter(a -> a.getStatus() == com.company.common.domain.ApplicationStatus.SELECTED)
                .count();
        int successRateScore = 100; // default for new applicant
        if (totalApps > 0) {
            successRateScore = (int) (((double) selectedApps / totalApps) * 100);
        }

        // 3. Department Alignment (15% Weight)
        int deptAlignmentScore = 0;
        Optional<User> empOpt = userRepository.findById(employeeId);
        Optional<Project> projOpt = projectRepository.findById(projectId);
        if (empOpt.isPresent() && projOpt.isPresent()) {
            User emp = empOpt.get();
            Project proj = projOpt.get();
            Optional<User> mgrOpt = userRepository.findById(proj.getManagerId());
            if (mgrOpt.isPresent() && emp.getDepartmentId() != null && 
                emp.getDepartmentId().equals(mgrOpt.get().getDepartmentId())) {
                deptAlignmentScore = 100;
            }
        }

        // 4. Availability Status (10% Weight)
        int availabilityScore = 0;
        if (empOpt.isPresent()) {
            User emp = empOpt.get();
            if (emp.getAvailabilityStatus() == com.company.common.domain.AvailabilityStatus.AVAILABLE) {
                availabilityScore = 100;
            } else if (emp.getAvailabilityStatus() == com.company.common.domain.AvailabilityStatus.PARTIALLY_AVAILABLE) {
                availabilityScore = 40;
            }
        }

        // 5. Recency of Skill Development (10% Weight)
        int recencyScore = 50; // default moderate
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        boolean hasRecentUpdate = logs.stream()
                .anyMatch(log -> log.getUserId().equals(employeeId) && 
                          ("ADD_SKILL".equalsIgnoreCase(log.getAction()) || 
                           "UPDATE_PROFILE".equalsIgnoreCase(log.getAction())));
        if (hasRecentUpdate) {
            recencyScore = 100;
        }

        // Compute Weighted Score
        double weightedScore = (skillOverlapScore * 0.40) +
                              (successRateScore * 0.25) +
                              (deptAlignmentScore * 0.15) +
                              (availabilityScore * 0.10) +
                              (recencyScore * 0.10);
        int finalScore = (int) Math.round(weightedScore);

        String basicReason = String.format(
                "Match analysis: Skill Overlap (%d%%), Past Success (%d%%), Dept Alignment (%d%%), Availability (%d%%), skill recency (%d%%).",
                skillOverlapScore, successRateScore, deptAlignmentScore, availabilityScore, recencyScore
        );

        // Call Gemini for advanced reasoning if API key configured
        if (geminiApiKey != null && !geminiApiKey.isEmpty() && !"mock_key".equals(geminiApiKey)) {
            try {
                List<String> employeeSkills = userSkills.stream()
                        .map(us -> {
                            Skill sk = skillRepository.findById(us.getSkillId()).orElse(null);
                            return sk != null ? sk.getSkillName() : "";
                        })
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
                MatchResult geminiRes = callGemini(reqSkills, employeeSkills, finalScore, basicReason);
                return new MatchResult(finalScore, geminiRes.getReason());
            } catch (Exception e) {
                log.warn("Gemini reasoning failed: {}, falling back to local reasoning", e.getMessage());
            }
        }

        return new MatchResult(finalScore, basicReason);
    }

    /**
     * Backward-compatible simple local Jaccard match calculation
     */
    public MatchResult calculateMatch(List<String> projectSkills, List<String> employeeSkills) {
        if (projectSkills == null || projectSkills.isEmpty()) {
            return new MatchResult(100, "No specific skills required. Excellent fit!");
        }
        if (employeeSkills == null || employeeSkills.isEmpty()) {
            return new MatchResult(0, "Employee has not listed any skills.");
        }

        Set<String> projectSet = projectSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        Set<String> employeeSet = employeeSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());

        Set<String> intersection = new HashSet<>(projectSet);
        intersection.retainAll(employeeSet);

        Set<String> union = new HashSet<>(projectSet);
        union.addAll(employeeSet);

        int jaccardScore = (int) (((double) intersection.size() / union.size()) * 100);

        List<String> missing = projectSkills.stream()
                .filter(s -> !intersection.contains(s.toLowerCase()))
                .collect(Collectors.toList());

        String reason;
        if (jaccardScore >= 80) {
            reason = "Excellent match! Candidate has almost all core required skills (" + String.join(", ", intersection) + ").";
        } else if (jaccardScore >= 50) {
            reason = "Good match. Covers key competencies like " + String.join(", ", intersection) + ", but lacks: " + String.join(", ", missing) + ".";
        } else if (jaccardScore > 0) {
            reason = "Partial match. Only matches on: " + String.join(", ", intersection) + ". Missing critical skills: " + String.join(", ", missing) + ".";
        } else {
            reason = "No matching skills found. Required: " + String.join(", ", projectSkills) + ". Candidate has: " + String.join(", ", employeeSkills) + ".";
        }

        return new MatchResult(jaccardScore, reason);
    }

    private MatchResult callGemini(List<String> projectSkills, List<String> employeeSkills, int baseScore, String basicReason) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String prompt = String.format(
                "Project needs skills: %s. Employee has skills: %s. " +
                "Given a pre-calculated structural match score of %d%% based on factors: %s. " +
                "Provide a brief, professional matching summary reason (max 2 sentences) describing why this candidate is a good or partial fit.",
                projectSkills, employeeSkills, baseScore, basicReason
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of("contents", List.of(content));

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        Map<?, ?> response = restTemplate.postForObject(url, requestEntity, Map.class);

        if (response != null && response.containsKey("candidates")) {
            List<?> candidates = (List<?>) response.get("candidates");
            if (!candidates.isEmpty()) {
                Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                Map<?, ?> contentMap = (Map<?, ?>) candidate.get("content");
                List<?> parts = (List<?>) contentMap.get("parts");
                if (!parts.isEmpty()) {
                    Map<?, ?> partMap = (Map<?, ?>) parts.get(0);
                    String text = (String) partMap.get("text");
                    return new MatchResult(baseScore, text.trim());
                }
            }
        }
        return new MatchResult(baseScore, basicReason);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchResult {
        private int score;
        private String reason;
    }
}
