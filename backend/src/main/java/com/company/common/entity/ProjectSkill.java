package com.company.common.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_skills",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_project_skill",
           columnNames = {"project_id", "skill_id"}
       ))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProjectSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_projectskills_project"),
                insertable = false, updatable = false)
    @JsonIgnore
    private Project project;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_projectskills_skill"),
                insertable = false, updatable = false)
    @JsonIgnore
    private Skill skill;

    @Column(name = "skill_id", nullable = false)
    private Long skillId;
}
