package com.company.common.repository;

import com.company.common.entity.Project;
import com.company.common.domain.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByManagerId(Long managerId);

    // Open projects matching employee's skills
    @Query("""
        SELECT DISTINCT p FROM Project p
        JOIN p.projectSkills ps
        WHERE p.status = com.company.common.domain.ProjectStatus.OPEN
          AND ps.skillId IN (
              SELECT us.skillId FROM UserSkill us
              WHERE us.userId = :userId
          )
        """)
    List<Project> findMatchingProjectsForUser(@Param("userId") Long userId);
}
