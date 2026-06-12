package com.company.application.service;

import com.company.common.entity.Application;
import com.company.common.entity.Interview;
import com.company.common.entity.Project;
import com.company.common.repository.ApplicationRepository;
import com.company.common.repository.InterviewRepository;
import com.company.common.repository.ProjectRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class CalendarService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;

    public CalendarService(InterviewRepository interviewRepository,
                           ApplicationRepository applicationRepository,
                           ProjectRepository projectRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
        this.projectRepository = projectRepository;
    }

    /**
     * Proposes a set of mock available calendar slots for an interviewer
     */
    public List<String> getAvailableSlots() {
        List<String> slots = new ArrayList<>();
        LocalDateTime base = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        slots.add(base.plusHours(1).format(formatter)); // Day 1 10:00 AM
        slots.add(base.plusHours(5).format(formatter)); // Day 1 2:00 PM
        slots.add(base.plusDays(1).plusHours(2).format(formatter)); // Day 2 11:00 AM
        slots.add(base.plusDays(1).plusHours(6).format(formatter)); // Day 2 3:00 PM
        slots.add(base.plusDays(2).plusHours(4).format(formatter)); // Day 3 1:00 PM
        
        return slots;
    }

    /**
     * Books a confirmed calendar event and stores in 'interviews' table.
     */
    public Interview confirmBooking(Long applicationId, String slotText) {
        log.info("Booking interview for application ID: {} at slot: {}", applicationId, slotText);
        
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
        
        Project project = projectRepository.findById(app.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + app.getProjectId()));

        // Parse slot text, fallback to now + 2 days if parsing fails
        LocalDateTime scheduledTime;
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            scheduledTime = LocalDateTime.parse(slotText.trim(), formatter);
        } catch (Exception e) {
            log.warn("Failed parsing date slot text '{}', defaulting time", slotText);
            scheduledTime = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);
        }

        // Delete any existing interview for this application to avoid duplicates
        interviewRepository.findByApplicationId(applicationId).ifPresent(interviewRepository::delete);

        Interview interview = Interview.builder()
                .applicationId(applicationId)
                .scheduledAt(scheduledTime)
                .googleEventId("gcal_evt_" + UUID.randomUUID().toString().substring(0, 8))
                .interviewerId(project.getManagerId())
                .status("CONFIRMED")
                .build();

        Interview saved = interviewRepository.save(interview);
        log.info("Successfully persisted confirmed interview: {}", saved);
        return saved;
    }
    
    public Optional<Interview> getInterviewByApplication(Long applicationId) {
        return interviewRepository.findByApplicationId(applicationId);
    }
}
