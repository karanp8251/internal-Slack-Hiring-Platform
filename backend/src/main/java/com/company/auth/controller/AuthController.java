package com.company.auth.controller;

import com.company.auth.service.AuthService;
import com.company.auth.service.SlackOAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SlackOAuthService slackOAuthService;

    public AuthController(AuthService authService, SlackOAuthService slackOAuthService) {
        this.authService = authService;
        this.slackOAuthService = slackOAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        return ResponseEntity.ok(authService.authenticate(email, password));
    }

    @GetMapping("/slack/login")
    public ResponseEntity<Map<String, String>> getSlackLoginUrl() {
        String url = slackOAuthService.getOAuthUrl();
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/slack/callback")
    public Object slackCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "redirect", required = false) String redirect) {
        Map<String, Object> result = slackOAuthService.handleCallback(code);
        if ("false".equals(redirect) || (code != null && code.startsWith("mock_"))) {
            return ResponseEntity.ok(result);
        }
        try {
            String frontendUrl = "http://localhost:5173/?token=" + result.get("token")
                    + "&userId=" + result.get("userId")
                    + "&role=" + result.get("role")
                    + "&name=" + java.net.URLEncoder.encode(result.get("name").toString(), java.nio.charset.StandardCharsets.UTF_8.name())
                    + "&email=" + result.get("email");
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                    .header(org.springframework.http.HttpHeaders.LOCATION, frontendUrl)
                    .build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        // Simple endpoint echoing validation success (Gateway verifies the signature first)
        return ResponseEntity.ok(Map.of("valid", true));
    }
}
