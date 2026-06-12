package com.company.common.repository;

import com.company.common.domain.ApplicationStatus;
import com.company.common.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByProjectIdOrderByMatchScoreDesc(Long projectId);

    List<Application> findByProjectId(Long projectId);

    List<Application> findByEmployeeId(Long employeeId);

    List<Application> findByStatus(ApplicationStatus status);

    Optional<Application> findByProjectIdAndEmployeeId(Long projectId, Long employeeId);

    boolean existsByProjectIdAndEmployeeId(Long projectId, Long employeeId);

    long countByStatus(ApplicationStatus status);

    long countByProjectIdAndStatus(Long projectId, ApplicationStatus status);

    @Query("SELECT d.name, COUNT(a.id) FROM Application a JOIN User u ON a.employeeId = u.id JOIN Department d ON u.departmentId = d.id GROUP BY d.name")
    List<Object[]> findHiringCountByDepartment();
}
