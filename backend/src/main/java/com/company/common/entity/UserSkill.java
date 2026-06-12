package com.company.common.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_skills",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_user_skill",
           columnNames = {"user_id", "skill_id"}
       ))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_userskills_user"),
                insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_userskills_skill"),
                insertable = false, updatable = false)
    @JsonIgnore
    private Skill skill;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;

    @Column(nullable = false)
    private Integer proficiency;  // 1–10, CHECK constraint DB mein hai
}
