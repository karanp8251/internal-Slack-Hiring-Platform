package com.company.common.repository;

import com.company.common.entity.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Long> {
    List<ProjectSkill> findByProjectId(Long projectId);
    void deleteByProjectId(Long projectId);

    @Query("SELECT s.skillName FROM ProjectSkill ps JOIN Skill s ON ps.skillId = s.id WHERE ps.projectId = :projectId")
    List<String> findSkillNamesByProjectId(Long projectId);
}
