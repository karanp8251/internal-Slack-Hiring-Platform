package com.company.common.repository;

import com.company.common.entity.User;
import com.company.common.domain.AvailabilityStatus;
import com.company.common.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findBySlackId(String slackId);

    List<User> findByRole(Role role);

    List<User> findByAvailabilityStatus(AvailabilityStatus status);

    List<User> findByDepartmentId(Long departmentId);

    // Users with a specific skill
    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN u.userSkills us
        WHERE us.skillId = :skillId
          AND u.availabilityStatus = com.company.common.domain.AvailabilityStatus.AVAILABLE
        ORDER BY us.proficiency DESC
        """)
    List<User> findAvailableUsersBySkill(@Param("skillId") Long skillId);
}
