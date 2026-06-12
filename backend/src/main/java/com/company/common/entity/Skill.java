package com.company.common.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "skills")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "skill_name", nullable = false,
            unique = true, length = 100)
    private String skillName;

    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @JsonIgnore
    private List<UserSkill> userSkills;

    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ProjectSkill> projectSkills;
}

