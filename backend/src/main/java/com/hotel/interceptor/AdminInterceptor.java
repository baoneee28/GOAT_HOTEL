package com.hotel.interceptor;

import com.hotel.entity.User;
import com.hotel.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@SuppressWarnings("null")
public class AdminInterceptor implements HandlerInterceptor {

    private static final String[] ADMIN_ONLY_PREFIXES = {
            "/admin/users",
            "/admin/coupons",
            "/admin/news",
            "/admin/room-types",
            "/admin/items",
            "/api/admin/users",
            "/api/admin/coupons",
            "/api/news/admin",
            "/api/room-types/admin",
            "/api/admin/items",
            "/api/upload"
    };

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        String path = resolveRequestPath(request);
        boolean isApiRequest = path.startsWith("/api/");
        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("user") instanceof User user) {
            boolean requiresAdmin = requiresAdminRole(path);
            if ((requiresAdmin && authService.isAdmin(user))
                    || (!requiresAdmin && authService.isBackoffice(user))) {
                return true;
            }
        }

        if (isApiRequest) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Ban khong co quyen truy cap tai nguyen quan tri.\"}");
            return false;
        }

        response.sendRedirect(request.getContextPath() + "/login");
        return false;
    }

    private boolean requiresAdminRole(String path) {
        for (String prefix : ADMIN_ONLY_PREFIXES) {
            if (matchesPath(path, prefix)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesPath(String path, String prefix) {
        return prefix.equals(path) || path.startsWith(prefix + "/");
    }

    private String resolveRequestPath(HttpServletRequest request) {
        String contextPath = request.getContextPath();
        String requestUri = request.getRequestURI();
        if (contextPath != null && !contextPath.isBlank() && requestUri.startsWith(contextPath)) {
            return requestUri.substring(contextPath.length());
        }
        return requestUri;
    }
}
