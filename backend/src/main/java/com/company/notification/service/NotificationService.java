package com.company.notification.service;

import com.company.common.entity.Notification;
import com.company.common.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification sendNotification(Long userId, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .readStatus(false)
                .type(type)
                .createdDate(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);

        // Broadcast to user's real-time websocket topic
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, saved);
            log.info("Successfully broadcasted notification to {}", destination);
        } catch (Exception e) {
            log.error("Failed to broadcast notification: {}", e.getMessage());
        }

        return saved;
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedDateDesc(userId);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationId));
        notification.setReadStatus(true);
        return notificationRepository.save(notification);
    }

    // New specific methods from specifications
    public List<Notification> getAllNotificationsForUser(Long userId) {
        return getNotificationsForUser(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndReadStatus(userId, false);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadStatus(userId, false);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllReadForUser(userId);
    }

    public Notification sendNotification(Long userId, String message) {
        return sendNotification(userId, message, "SYSTEM");
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}
