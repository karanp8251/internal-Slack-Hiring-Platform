package com.company.common.repository;

import com.company.common.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedDateDesc(Long userId);

    List<Notification> findByUserIdAndReadStatus(Long userId, Boolean readStatus);

    long countByUserIdAndReadStatus(Long userId, Boolean readStatus);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.readStatus = true WHERE n.userId = :userId")
    int markAllReadForUser(@Param("userId") Long userId);
}
