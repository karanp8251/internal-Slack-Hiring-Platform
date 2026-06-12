package com.company.common.entity;

import com.company.common.domain.ProjectStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id",
                foreignKey = @ForeignKey(name = "fk_project_manager"),
                insertable = false, updatable = false)
    @JsonIgnore
    private User manager;

    @Column(name = "manager_id", nullable = false)
    private Long managerId;

    @Column(nullable = false)
    @Builder.Default
    private Integer openings = 1;

    private LocalDate deadline;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.OPEN;

    @Column(name = "target_slack_channel")
    private String targetSlackChannel;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ProjectSkill> projectSkills;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Application> applications;
}

