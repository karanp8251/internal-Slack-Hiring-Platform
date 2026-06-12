package com.company.user.service;

import com.company.common.entity.Skill;
import com.company.common.entity.User;
import com.company.common.entity.UserSkill;
import com.company.common.repository.SkillRepository;
import com.company.common.repository.UserRepository;
import com.company.common.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final UserRepository userRepository;

    public List<Skill> getAllSkills() {
        return skillRepository.findAll();
    }

    public Skill getSkillById(Long id) {
        return skillRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Skill not found: " + id));
    }

    public Skill createSkill(Skill skill) {
        return skillRepository.save(skill);
    }

    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }

    public UserSkill addSkillToUser(Long userId, Long skillId, Integer proficiency) {
        if (userSkillRepository.existsByUserIdAndSkillId(userId, skillId)) {
            throw new RuntimeException("User already has this skill");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Skill skill = skillRepository.findById(skillId)
            .orElseThrow(() -> new RuntimeException("Skill not found: " + skillId));

        UserSkill us = UserSkill.builder()
            .user(user)
            .userId(userId)
            .skill(skill)
            .skillId(skillId)
            .proficiency(proficiency)
            .build();
        return userSkillRepository.save(us);
    }

    public List<UserSkill> getSkillsByUser(Long userId) {
        return userSkillRepository.findByUserId(userId);
    }

    public void removeSkillFromUser(Long userSkillId) {
        userSkillRepository.deleteById(userSkillId);
    }
}
