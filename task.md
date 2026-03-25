# React Migration Checklist

## Foundation & Auth (Completed)
- [x] Integrate Vite and initial App structure.
- [x] Fix Backend Jackson Serialization on Hibernate Proxies.
- [x] Enable Controller CORS & `withCredentials`.
- [x] Fix Controller Parameter Null error (Spring Boot 3.2).
- [x] Rewrite Home, Login, Register in React.

## Phase 1: Sub-Components Refactoring
- [x] Create [Navbar](file:///d:/webProject/GOAT_HOTEL/frontend/src/components/Navbar.jsx#4-51), [Footer](file:///d:/webProject/GOAT_HOTEL/frontend/src/components/Footer.jsx#4-83) reusable elements to avoid copy-pasting code.
- [x] Refactor [Home.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/Home.jsx) to consume [Navbar](file:///d:/webProject/GOAT_HOTEL/frontend/src/components/Navbar.jsx#4-51) and [Footer](file:///d:/webProject/GOAT_HOTEL/frontend/src/components/Footer.jsx#4-83).

## Phase 2: Client Pages
- [x] Rewrite [Profile.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/Profile.jsx) referencing [profile.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/profile.html) & [ProfileApiController](file:///d:/webProject/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/ProfileApiController.java#14-88).
- [x] Rewrite [History.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/History.jsx) referencing [history.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/history.html) & [BookingApiController](file:///d:/webProject/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/BookingApiController.java#22-246).
- [x] Rewrite [NewsDetail.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/NewsDetail.jsx) referencing [news-detail.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/news-detail.html) & [NewsApiController](file:///d:/webProject/GOAT_HOTEL/backend/src/main/java/com/hotel/controller/api/NewsApiController.java#10-90).

## Phase 3: Admin Dashboard Layout
- [x] Create [AdminLayout.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/admin/AdminLayout.jsx) referencing [admin/index.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/admin/index.html) layout structure.
- [x] Create [Sidebar.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/components/AdminSidebar.jsx) with active link tracking logic.
- [x] Rewrite [Dashboard.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/admin/Dashboard.jsx) (Stats overview).

## Phase 4: Admin CRUD Pages
- [x] [Rooms.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/admin/Rooms.jsx) (List + Edit/Delete Modal).
- [x] [RoomTypes.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/admin/RoomTypes.jsx).
- [x] [Items.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/pages/admin/Items.jsx).
- [x] `Bookings.jsx` (Manage Status).
- [x] `Users.jsx` (Manage Roles).
- [x] `News.jsx` (Blog Management).
