package com.company.auth.service;

import com.company.auth.util.JwtUtil;
import com.company.common.domain.AvailabilityStatus;
import com.company.common.domain.Role;
import com.company.common.entity.User;
import com.company.common.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class SlackOAuthService {

    @Value("${slack.client.id}")
    private String clientId;

    @Value("${slack.client.secret}")
    private String clientSecret;

    @Value("${slack.redirect.uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public SlackOAuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public String getOAuthUrl() {
        return "https://slack.com/openid/connect/authorize" +
               "?response_type=code" +
               "&client_id=" + clientId +
               "&scope=openid%20email%20profile" +
               "&redirect_uri=" + redirectUri;
    }

    public Map<String, Object> handleCallback(String code) {
        log.info("Handling Slack OAuth callback with code: {}", code);
        
        String email;
        String name;
        String slackId;

        // Graceful mock fallback for hackathon demo flow
        if (code == null || code.startsWith("mock_") || "mock_code".equals(code) || "mock_client_id".equals(clientId)) {
            log.info("Mock Slack credentials detected, generating mock user profile.");
            email = "karan.patel@company.com";
            name = "Karan Patel (Slack Mock)";
            slackId = "U_SLACK_MOCK_123";
        } else {
            try {
                // Exchange code for token
                String tokenUrl = "https://slack.com/api/openid.connect.token";
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                
                MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
                params.add("code", code);
                params.add("client_id", clientId);
                params.add("client_secret", clientSecret);
                params.add("redirect_uri", redirectUri);

                HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
                Map<String, Object> tokenResponse = restTemplate.postForObject(tokenUrl, request, Map.class);

                if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                    throw new RuntimeException("Failed to obtain access token from Slack");
                }

                String accessToken = (String) tokenResponse.get("access_token");
                
                // Fetch user info
                HttpHeaders userHeaders = new HttpHeaders();
                userHeaders.setBearerAuth(accessToken);
                HttpEntity<Void> userEntity = new HttpEntity<>(userHeaders);
                
                ResponseEntity<Map> userResponse = restTemplate.exchange(
                    "https://slack.com/api/openid.connect.userInfo",
                    HttpMethod.GET, userEntity, Map.class
                );

                Map<String, Object> userInfo = userResponse.getBody();
                if (userInfo == null || !userInfo.containsKey("sub")) {
                    throw new RuntimeException("Failed to fetch user info from Slack");
                }

                slackId = (String) userInfo.get("sub");
                email = (String) userInfo.get("email");
                name = (String) userInfo.get("name");

            } catch (Exception e) {
                log.error("Slack OAuth failed: {}", e.getMessage());
                if ("mock_client_id".equals(clientId)) {
                    email = "karan.patel@company.com";
                    name = "Karan Patel (Slack Fallback)";
                    slackId = "U_SLACK_MOCK_123";
                } else {
                    throw new RuntimeException("Slack OAuth authentication failed: " + e.getMessage());
                }
            }
        }

        // Upsert user in DB
        User user = upsertUser(slackId, email, name);

        // Generate JWT
        String token = jwtUtil.generateToken(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole().name());
        response.put("name", user.getName());
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        
        return response;
    }

    private User upsertUser(String slackId, String email, String name) {
        return userRepository.findBySlackId(slackId)
            .orElseGet(() -> {
                // Check if user already exists by email and update slack ID
                return userRepository.findByEmail(email)
                    .map(existingUser -> {
                        existingUser.setSlackId(slackId);
                        if ("U0B9PVDJ5H6".equals(slackId) || "karanp825103@gmail.com".equals(email)) {
                            existingUser.setRole(Role.ROLE_SUPER_ADMIN);
                        }
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        Role assignRole = Role.ROLE_EMPLOYEE;
                        if ("U0B9PVDJ5H6".equals(slackId) || "karanp825103@gmail.com".equals(email)) {
                            assignRole = Role.ROLE_SUPER_ADMIN;
                        }
                        User newUser = User.builder()
                            .slackId(slackId)
                            .email(email)
                            .name(name)
                            .role(assignRole) // Default role
                            .availabilityStatus(AvailabilityStatus.AVAILABLE)
                            .departmentId(1L) // Default department
                            .build();
                        return userRepository.save(newUser);
                    });
            });
    }
}
