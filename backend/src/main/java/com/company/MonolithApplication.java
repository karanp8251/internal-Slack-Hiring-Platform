package com.company;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.company.common.entity")
@EnableJpaRepositories("com.company.common.repository")
public class MonolithApplication {
    public static void main(String[] args) {
        try {
            // Start H2 TCP server on port 9092
            org.h2.tools.Server.createTcpServer("-tcp", "-tcpAllowOthers", "-tcpPort", "9092").start();
            System.out.println("=== H2 TCP Database Server started successfully on port 9092 ===");
        } catch (Exception e) {
            System.err.println("!!! Could not start H2 TCP Server: " + e.getMessage());
        }
        SpringApplication.run(MonolithApplication.class, args);
    }
}
