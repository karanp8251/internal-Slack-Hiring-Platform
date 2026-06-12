package com.company.user.service;

import com.company.common.domain.AvailabilityStatus;
import com.company.common.domain.Role;
import com.company.common.entity.Department;
import com.company.common.entity.Skill;
import com.company.common.entity.User;
import com.company.common.entity.UserSkill;
import com.company.common.repository.DepartmentRepository;
import com.company.common.repository.SkillRepository;
import com.company.common.repository.UserRepository;
import com.company.common.repository.UserSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final DepartmentRepository departmentRepository;

    public UserService(UserRepository userRepository,
                       SkillRepository skillRepository,
                       UserSkillRepository userSkillRepository,
                       DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
        this.departmentRepository = departmentRepository;
    }

    public User getProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    }

    public Map<String, Object> getUserProfileMap(Long userId) {
        User u = getProfile(userId);
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("role", u.getRole().name());
        map.put("availabilityStatus", u.getAvailabilityStatus().name());
        map.put("slackId", u.getSlackId());
        map.put("departmentId", u.getDepartmentId());

        String deptName = "None";
        if (u.getDepartmentId() != null) {
            deptName = departmentRepository.findById(u.getDepartmentId())
                    .map(Department::getName)
                    .orElse("None");
        }
        map.put("departmentName", deptName);

        List<UserSkill> uSkills = userSkillRepository.findByUserId(u.getId());
        List<Map<String, Object>> skillList = new ArrayList<>();
        for (UserSkill us : uSkills) {
            skillRepository.findById(us.getSkillId()).ifPresent(sk -> {
                Map<String, Object> sMap = new HashMap<>();
                sMap.put("skillName", sk.getSkillName());
                sMap.put("proficiency", us.getProficiency());
                skillList.add(sMap);
            });
        }
        map.put("skills", skillList);
        return map;
    }

    public User updateProfile(Long userId, Map<String, String> updates) {
        User user = getProfile(userId);
        if (updates.containsKey("name")) {
            user.setName(updates.get("name"));
        }
        if (updates.containsKey("slackId")) {
            user.setSlackId(updates.get("slackId"));
        }
        return userRepository.save(user);
    }

    public UserSkill addSkill(Long userId, String skillName, Integer proficiency) {
        Skill skill = skillRepository.findBySkillNameIgnoreCase(skillName)
                .orElseGet(() -> skillRepository.save(Skill.builder().skillName(skillName).build()));

        return userSkillRepository.findByUserIdAndSkillId(userId, skill.getId())
                .map(existingSkill -> {
                    existingSkill.setProficiency(proficiency);
                    return userSkillRepository.save(existingSkill);
                })
                .orElseGet(() -> userSkillRepository.save(UserSkill.builder()
                        .userId(userId)
                        .skillId(skill.getId())
                        .proficiency(proficiency)
                        .build()));
    }

    public User updateAvailability(Long userId, String availabilityStatus) {
        User user = getProfile(userId);
        user.setAvailabilityStatus(AvailabilityStatus.valueOf(availabilityStatus.toUpperCase()));
        return userRepository.save(user);
    }

    public List<Map<String, Object>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("availabilityStatus", u.getAvailabilityStatus().name());
            map.put("slackId", u.getSlackId());
            
            String deptName = "None";
            if (u.getDepartmentId() != null) {
                deptName = departmentRepository.findById(u.getDepartmentId())
                        .map(Department::getName)
                        .orElse("None");
            }
            map.put("departmentName", deptName);
            
            List<UserSkill> uSkills = userSkillRepository.findByUserId(u.getId());
            List<Map<String, Object>> skillList = new ArrayList<>();
            for (UserSkill us : uSkills) {
                skillRepository.findById(us.getSkillId()).ifPresent(sk -> {
                    Map<String, Object> sMap = new HashMap<>();
                    sMap.put("skillName", sk.getSkillName());
                    sMap.put("proficiency", us.getProficiency());
                    skillList.add(sMap);
                });
            }
            map.put("skills", skillList);
            results.add(map);
        }
        return results;
    }

    public List<Map<String, Object>> searchEmployees(String skillName) {
        Skill skill = skillRepository.findBySkillNameIgnoreCase(skillName)
                .orElseThrow(() -> new RuntimeException("Skill not found: " + skillName));

        List<UserSkill> userSkills = userSkillRepository.findAll().stream()
                .filter(us -> us.getSkillId().equals(skill.getId()))
                .toList();

        List<Map<String, Object>> results = new ArrayList<>();
        for (UserSkill us : userSkills) {
            userRepository.findById(us.getUserId()).ifPresent(user -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", user.getId());
                map.put("name", user.getName());
                map.put("email", user.getEmail());
                map.put("role", user.getRole().name());
                map.put("availabilityStatus", user.getAvailabilityStatus().name());
                map.put("proficiency", us.getProficiency());
                map.put("skillName", skillName);
                results.add(map);
            });
        }
        return results;
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // New methods from user specification
    public List<User> getAllUsersList() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getUsersByAvailability(AvailabilityStatus status) {
        return userRepository.findByAvailabilityStatus(status);
    }

    public List<User> getUsersByDepartment(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId);
    }

    public List<User> getAvailableUsersBySkill(Long skillId) {
        return userRepository.findAvailableUsersBySkill(skillId);
    }

    public User createUser(User user, Long departmentId) {
        if (departmentId != null) {
            Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentId));
            user.setDepartment(dept);
            user.setDepartmentId(departmentId);
        }
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updated, Long departmentId) {
        User existing = getUserById(id);
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setSlackId(updated.getSlackId());
        existing.setRole(updated.getRole());
        existing.setAvailabilityStatus(updated.getAvailabilityStatus());

        if (departmentId != null) {
            Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentId));
            existing.setDepartment(dept);
            existing.setDepartmentId(departmentId);
        } else {
            existing.setDepartment(null);
            existing.setDepartmentId(null);
        }
        return userRepository.save(existing);
    }

    public User updateAvailability(Long id, AvailabilityStatus status) {
        User user = getUserById(id);
        user.setAvailabilityStatus(status);
        return userRepository.save(user);
    }
}
