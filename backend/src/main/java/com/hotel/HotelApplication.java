package com.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication là mấu chốt của Spring Boot: 
// Nó kết hợp 3 annotation: @Configuration, @EnableAutoConfiguration, và @ComponentScan
@SpringBootApplication
public class HotelApplication {
    // Hàm main khởi chạy ứng dụng web
    public static void main(String[] args) {
        SpringApplication.run(HotelApplication.class, args);
    }
}
