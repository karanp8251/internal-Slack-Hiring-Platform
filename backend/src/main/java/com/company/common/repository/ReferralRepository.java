package com.company.common.repository;

import com.company.common.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, Long> {
    List<Referral> findByReferredEmployeeId(Long referredEmployeeId);
    List<Referral> findByProjectId(Long projectId);
}
