# Complete Frontend React Migration Plan

## Goal Description
The objective is to entirely replace the remaining `frontend-html` Thymeleaf templates with a modern React SPA using React Router, preserving 100% of the UI design and integrating with the existing `*ApiController.java` endpoints.

This will decouple the entire project frontend-to-backend.

## Proposed Changes

### 1. Reusable Layout Components
- **[NEW]** `frontend/src/components/Navbar.jsx`: Extract the navigation bar logic into a reusable component.
- **[NEW]** `frontend/src/components/Footer.jsx`: Extract the footer.
- **[NEW]** `frontend/src/components/AdminSidebar.jsx`: The side navigation for Admin pages.

### 2. Client Pages
- **[NEW]** `frontend/src/pages/Profile.jsx`: Replicates [profile.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/profile.html). Fetches from `/api/profile`. Allows users to update their details and password.
- **[NEW]** `frontend/src/pages/History.jsx`: Replicates [history.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/history.html). Fetches booking history from `/api/bookings/my-bookings`. Allows cancellation.
- **[NEW]** `frontend/src/pages/NewsDetail.jsx`: Replicates [news-detail.html](file:///d:/webProject/GOAT_HOTEL/frontend-html/templates/news-detail.html). Fetches detailed news content from `/api/news/{id}`.

### 3. Admin Pages
- **[NEW]** `frontend/src/pages/admin/AdminLayout.jsx`: A wrapper component containing the Sidebar and a content area (`<Outlet />`).
- **[NEW]** `frontend/src/pages/admin/Dashboard.jsx` (`admin/index.html`): Displays stats and charts.
- **[NEW]** `frontend/src/pages/admin/Rooms.jsx` (`admin/rooms.html`): CRUD for rooms via `/api/rooms/admin`.
- **[NEW]** `frontend/src/pages/admin/RoomTypes.jsx` (`admin/room-types.html`): CRUD for room categories.
- **[NEW]** `frontend/src/pages/admin/Items.jsx` (`admin/items.html`): CRUD for room amenities.
- **[NEW]** `frontend/src/pages/admin/Bookings.jsx` (`admin/bookings.html`): Manage all bookings.
- **[NEW]** `frontend/src/pages/admin/Users.jsx` (`admin/users.html`): Manage system users.
- **[NEW]** `frontend/src/pages/admin/News.jsx` (`admin/news.html`): Manage blog posts natively.

### 4. Routing Changes
- **[MODIFY]** [frontend/src/App.jsx](file:///d:/webProject/GOAT_HOTEL/frontend/src/App.jsx): Setup complete Nested Routing.

```jsx
<Routes>
  {/* Client Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login initialTab="login" />} />
  <Route path="/register" element={<Login initialTab="register" />} />
  <Route path="/profile" element={<Profile />} />
  <Route path="/history" element={<History />} />
  <Route path="/news/:id" element={<NewsDetail />} />

  {/* Admin Routes */}
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="rooms" element={<Rooms />} />
    <Route path="room-types" element={<RoomTypes />} />
    <Route path="items" element={<Items />} />
    <Route path="bookings" element={<Bookings />} />
    <Route path="users" element={<Users />} />
    <Route path="news" element={<News />} />
  </Route>
</Routes>
```

## Verification Plan
### Manual Verification
1. Each React component will be strictly compared frame-by-frame horizontally against the `frontend-html` equivalent UI layout.
2. The CRUD admin functionality and filtering will be triggered via Axios. Network calls will be monitored.
3. Protected routes (like `/admin/*` and `/profile`) will redirect to `/login` if `user_logged_in` is missing or insufficient role.
