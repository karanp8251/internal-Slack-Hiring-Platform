package com.company.common.repository;

import com.company.common.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByUserId(Long userId);

    List<UserSkill> findBySkillId(Long skillId);

    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);

    boolean existsByUserIdAndSkillId(Long userId, Long skillId);

    @Query("SELECT s.skillName, COUNT(us.userId) FROM UserSkill us JOIN Skill s ON us.skillId = s.id GROUP BY s.skillName")
    List<Object[]> findSkillCounts();

    @Query("SELECT s.skillName FROM UserSkill us JOIN Skill s ON us.skillId = s.id WHERE us.userId = :userId")
    List<String> findSkillNamesByUserId(Long userId);
}
