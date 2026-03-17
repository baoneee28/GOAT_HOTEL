package com.hotel.controller;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Enumeration;

// @ControllerAdvice: Lớp bắt lỗi toàn cục. 
// Bất cứ khi nào có lỗi Java (Exception) văng ra ở bất kỳ Controller nào, nó sẽ bị tóm về đây
@ControllerAdvice
public class GlobalExceptionHandler {

    // Bắt tất cả các loại Exception
    @ExceptionHandler(Exception.class)
    public String handleException(Exception ex, HttpServletRequest request) {
        // Ghi lại lỗi vào file "error_debug.log" để lập trình viên dễ dàng tìm bug
        try (FileWriter fw = new FileWriter("error_debug.log", true);
             PrintWriter pw = new PrintWriter(fw)) {
            pw.println("--- EXCEPTION ---");
            pw.println("URL: " + request.getRequestURI());
            pw.println("Error: " + ex.getMessage());
            ex.printStackTrace(pw);
            
            pw.println("PARAMETERS:");
            Enumeration<String> params = request.getParameterNames();
            while (params.hasMoreElements()) {
                String paramName = params.nextElement();
                pw.println(paramName + " = " + request.getParameter(paramName));
            }
            pw.println("-----------------");
        } catch (IOException e) {
            e.printStackTrace();
        }
        // Văng ngược lỗi ra màn hình Spring Boot trắng (hoặc có thể setup trả về 1 trang 500 html tùy ý)
        throw new RuntimeException(ex);
    }
}
