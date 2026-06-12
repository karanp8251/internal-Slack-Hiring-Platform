package com.company.user.controller;

import com.company.common.entity.User;
import com.company.common.entity.UserSkill;
import com.company.common.domain.AvailabilityStatus;
import com.company.common.domain.Role;
import com.company.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final com.company.common.repository.AuditLogRepository auditLogRepository;

    public UserController(UserService userService, com.company.common.repository.AuditLogRepository auditLogRepository) {
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.company.common.entity.AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(userService.getUserProfileMap(Long.parseLong(userId)));
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestHeader("X-User-Id") String userId,
                                              @RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(userService.updateProfile(Long.parseLong(userId), updates));
    }

    @PostMapping("/skills")
    public ResponseEntity<UserSkill> addSkill(@RequestHeader("X-User-Id") String userId,
                                              @RequestBody Map<String, Object> request) {
        String skillName = (String) request.get("skillName");
        Integer proficiency = (Integer) request.get("proficiency");
        return ResponseEntity.ok(userService.addSkill(Long.parseLong(userId), skillName, proficiency));
    }

    @PutMapping("/availability")
    public ResponseEntity<User> updateAvailability(@RequestHeader("X-User-Id") String userId,
                                                   @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return ResponseEntity.ok(userService.updateAvailability(Long.parseLong(userId), status));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchEmployees(@RequestParam("skill") String skillName) {
        return ResponseEntity.ok(userService.searchEmployees(skillName));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/entities")
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.getAllUsersList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/by-role")
    public ResponseEntity<List<User>> getByRole(@RequestParam Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @GetMapping("/by-availability")
    public ResponseEntity<List<User>> getByAvailability(@RequestParam AvailabilityStatus status) {
        return ResponseEntity.ok(userService.getUsersByAvailability(status));
    }

    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<List<User>> getByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(userService.getUsersByDepartment(departmentId));
    }

    @GetMapping("/available-by-skill/{skillId}")
    public ResponseEntity<List<User>> getAvailableBySkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(userService.getAvailableUsersBySkill(skillId));
    }

    @PostMapping("/create")
    public ResponseEntity<User> create(@RequestBody User user,
                                       @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(userService.createUser(user, departmentId));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String roleStr = request.get("role");
        String deptIdStr = request.get("departmentId");
        
        User.UserBuilder builder = User.builder()
                .name(name)
                .email(email)
                .role(com.company.common.domain.Role.valueOf(roleStr))
                .availabilityStatus(com.company.common.domain.AvailabilityStatus.AVAILABLE);
        if (deptIdStr != null && !deptIdStr.isEmpty()) {
            builder.departmentId(Long.parseLong(deptIdStr));
        }
        User newUser = userService.saveUser(builder.build());
        return ResponseEntity.ok(newUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
        User user = userService.getProfile(id);
        if (request.containsKey("name")) user.setName(request.get("name"));
        if (request.containsKey("role")) user.setRole(com.company.common.domain.Role.valueOf(request.get("role")));
        if (request.containsKey("departmentId")) {
            String deptIdStr = request.get("departmentId");
            user.setDepartmentId(deptIdStr != null && !deptIdStr.isEmpty() ? Long.parseLong(deptIdStr) : null);
        }
        return ResponseEntity.ok(userService.saveUser(user));
    }

    @PutMapping("/{id}/update")
    public ResponseEntity<User> updateUserEntity(@PathVariable Long id,
                                                 @RequestBody User user,
                                                 @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(userService.updateUser(id, user, departmentId));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<User> updateAvailabilityPatch(@PathVariable Long id,
                                                         @RequestParam AvailabilityStatus status) {
        return ResponseEntity.ok(userService.updateAvailability(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
