package com.hotel.interceptor;

import com.hotel.entity.User;
import com.hotel.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@SuppressWarnings("null")
public class SessionConsistencyInterceptor implements HandlerInterceptor {

    private final AuthService authService;

    public SessionConsistencyInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        HttpSession session = request.getSession(false);
        Object userObj = session == null ? null : session.getAttribute(AuthService.SESSION_USER_KEY);
        if (!(userObj instanceof User)) {
            return true;
        }

        authService.getValidSessionUser(session);
        return true;
    }
}
