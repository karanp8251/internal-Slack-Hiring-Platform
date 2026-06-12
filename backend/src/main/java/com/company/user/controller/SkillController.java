package com.company.user.controller;

import com.company.common.entity.Skill;
import com.company.common.entity.UserSkill;
import com.company.user.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ResponseEntity<List<Skill>> getAll() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Skill> getById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getSkillById(id));
    }

    @PostMapping
    public ResponseEntity<Skill> create(@RequestBody Skill skill) {
        return ResponseEntity.ok(skillService.createSkill(skill));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    // User-Skill APIs
    @PostMapping("/user/{userId}/add/{skillId}")
    public ResponseEntity<UserSkill> addSkillToUser(@PathVariable Long userId,
                                                    @PathVariable Long skillId,
                                                    @RequestParam Integer proficiency) {
        return ResponseEntity.ok(skillService.addSkillToUser(userId, skillId, proficiency));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserSkill>> getUserSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByUser(userId));
    }

    @DeleteMapping("/user-skill/{userSkillId}")
    public ResponseEntity<Void> removeSkillFromUser(@PathVariable Long userSkillId) {
        skillService.removeSkillFromUser(userSkillId);
        return ResponseEntity.noContent().build();
    }
}
