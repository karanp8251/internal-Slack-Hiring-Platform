package com.company.auth.config;

import com.company.common.domain.AvailabilityStatus;
import com.company.common.domain.Role;
import com.company.common.entity.Department;
import com.company.common.entity.Skill;
import com.company.common.entity.User;
import com.company.common.entity.UserSkill;
import com.company.common.repository.DepartmentRepository;
import com.company.common.repository.SkillRepository;
import com.company.common.repository.UserRepository;
import com.company.common.repository.UserSkillRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SeedDataConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;

    public SeedDataConfig(UserRepository userRepository,
                          DepartmentRepository departmentRepository,
                          SkillRepository skillRepository,
                          UserSkillRepository userSkillRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.skillRepository = skillRepository;
        this.userSkillRepository = userSkillRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ensure Slack System user (ID 9999) exists for Slack simulation to prevent foreign key violations
        if (userRepository.findByEmail("slack.system@company.com").isEmpty()) {
            userRepository.save(User.builder()
                    .id(9999L)
                    .name("Slack System")
                    .email("slack.system@company.com")
                    .role(Role.ROLE_EMPLOYEE)
                    .availabilityStatus(AvailabilityStatus.AVAILABLE)
                    .build());
        }

        if (departmentRepository.count() > 0) {
            return; // Already seeded
        }

        System.out.println("=== Seeding Initial Hackathon Database Data ===");

        // 1. Seed Departments
        Department eng = departmentRepository.save(Department.builder().name("Engineering").build());
        Department prod = departmentRepository.save(Department.builder().name("Product").build());
        Department hrDept = departmentRepository.save(Department.builder().name("Human Resources").build());
        Department mktg = departmentRepository.save(Department.builder().name("Marketing").build());

        // 2. Seed Skills
        Skill java = skillRepository.save(Skill.builder().skillName("Java").build());
        Skill spring = skillRepository.save(Skill.builder().skillName("Spring Boot").build());
        Skill react = skillRepository.save(Skill.builder().skillName("React").build());
        Skill python = skillRepository.save(Skill.builder().skillName("Python").build());
        Skill aws = skillRepository.save(Skill.builder().skillName("AWS").build());
        Skill postgres = skillRepository.save(Skill.builder().skillName("PostgreSQL").build());
        Skill docker = skillRepository.save(Skill.builder().skillName("Docker").build());

        // 3. Seed Users with each role
        userRepository.save(User.builder()
                .name("Super Admin")
                .email("admin@company.com")
                .role(Role.ROLE_SUPER_ADMIN)
                .departmentId(eng.getId())
                .availabilityStatus(AvailabilityStatus.BUSY)
                .build());

        userRepository.save(User.builder()
                .name("System Admin")
                .email("admin_user@company.com")
                .role(Role.ROLE_ADMIN)
                .departmentId(eng.getId())
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build());

        userRepository.save(User.builder()
                .name("Sneha Sen")
                .email("hr@company.com")
                .role(Role.ROLE_HR)
                .departmentId(hrDept.getId())
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build());

        userRepository.save(User.builder()
                .name("Rahul Verma")
                .email("manager@company.com")
                .role(Role.ROLE_MANAGER)
                .departmentId(prod.getId())
                .availabilityStatus(AvailabilityStatus.PARTIALLY_AVAILABLE)
                .build());

        User karan = userRepository.save(User.builder()
                .name("Karan Patel")
                .email("karan@company.com")
                .role(Role.ROLE_EMPLOYEE)
                .departmentId(eng.getId())
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .slackId("U_SLACK_K_123")
                .build());

        User aditya = userRepository.save(User.builder()
                .name("Aditya Sharma")
                .email("aditya@company.com")
                .role(Role.ROLE_EMPLOYEE)
                .departmentId(eng.getId())
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build());

        // 4. Seed User Skills
        // Karan Patel: strong in Java, Spring Boot, React, AWS
        userSkillRepository.save(UserSkill.builder().userId(karan.getId()).skillId(java.getId()).proficiency(5).build());
        userSkillRepository.save(UserSkill.builder().userId(karan.getId()).skillId(spring.getId()).proficiency(5).build());
        userSkillRepository.save(UserSkill.builder().userId(karan.getId()).skillId(react.getId()).proficiency(4).build());
        userSkillRepository.save(UserSkill.builder().userId(karan.getId()).skillId(aws.getId()).proficiency(4).build());

        // Aditya Sharma: python focused
        userSkillRepository.save(UserSkill.builder().userId(aditya.getId()).skillId(python.getId()).proficiency(5).build());
        userSkillRepository.save(UserSkill.builder().userId(aditya.getId()).skillId(postgres.getId()).proficiency(4).build());
        userSkillRepository.save(UserSkill.builder().userId(aditya.getId()).skillId(docker.getId()).proficiency(3).build());

        System.out.println("=== Database Seeding Complete ===");
    }
}
