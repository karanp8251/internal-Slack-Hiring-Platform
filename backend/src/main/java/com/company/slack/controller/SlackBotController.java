package com.company.slack.controller;

import com.company.common.entity.Notification;
import com.company.slack.service.SlackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/slack")
public class SlackBotController {

    private final SlackService slackService;

    public SlackBotController(SlackService slackService) {
        this.slackService = slackService;
    }

    @PostMapping("/announce")
    public ResponseEntity<Map<String, String>> announceProject(@RequestBody Map<String, Object> request) {
        Long projectId = ((Number) request.get("projectId")).longValue();
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        List<String> skillNames = (List<String>) request.get("skillNames");
        String targetChannel = (String) request.get("targetChannel");
        Integer openings = (Integer) request.get("openings");

        slackService.announceProject(projectId, title, description, skillNames, targetChannel, openings);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @PostMapping("/commands")
    public ResponseEntity<Map<String, Object>> handleSlashCommand(
            @RequestParam("command") String command,
            @RequestParam("user_id") String slackUserId,
            @RequestParam(value = "text", required = false) String text) {
        Map<String, Object> response = switch (command) {
            case "/openroles"  -> handleOpenRoles();
            case "/myapps"     -> handleMyApplications(slackUserId);
            case "/projects"   -> handleProjectList();
            case "/pstatus"    -> handleProjectStatus(text);
            default -> slackService.handleSlashCommand(command, slackUserId, text);
        };
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> handleOpenRoles() {
        return slackService.handleSlashCommand("/open-roles", "U_SLACK_MOCK_123", null);
    }

    private Map<String, Object> handleMyApplications(String slackUserId) {
        return slackService.handleSlashCommand("/my-applications", slackUserId, null);
    }

    private Map<String, Object> handleProjectList() {
        return slackService.handleSlashCommand("/project-list", "U_SLACK_MOCK_123", null);
    }

    private Map<String, Object> handleProjectStatus(String text) {
        return slackService.handleSlashCommand("/project-status", "U_SLACK_MOCK_123", text);
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<Notification>> getMockAnnouncements() {
        return ResponseEntity.ok(slackService.getMockAnnouncements());
    }

    @GetMapping("/dms")
    public ResponseEntity<List<Notification>> getMockDMs(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(slackService.getMockDMs(Long.parseLong(userId)));
    }

    @PostMapping("/interact")
    public ResponseEntity<Map<String, String>> handleSlackInteraction(@RequestBody Map<String, Object> payload) {
        Long applicationId = ((Number) payload.get("applicationId")).longValue();
        String slotText = (String) payload.get("slotText");
        slackService.confirmSlackBooking(applicationId, slotText);
        return ResponseEntity.ok(Map.of("status", "booked"));
    }
}
