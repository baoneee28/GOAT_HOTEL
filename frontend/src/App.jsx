import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Scroll lên đầu trang mỗi khi chuyển route — fix chuẩn cho React Router SPA
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import History from './pages/History';
import OrderDetail from './pages/OrderDetail';
import NewsDetail from './pages/NewsDetail';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';
import RoomDetail from './pages/RoomDetail';
import AvailableRooms from './pages/AvailableRooms';
import BookingConfirmation from './pages/BookingConfirmation';
import VNPayLaunch from './pages/VNPayLaunch';
import VNPayReturn from './pages/VNPayReturn';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Rooms from './pages/admin/Rooms';
import RoomTypes from './pages/admin/RoomTypes';
import Items from './pages/admin/Items';
import Bookings from './pages/admin/Bookings';
import Users from './pages/admin/Users';
import News from './pages/admin/News';
import Inbox from './pages/admin/Inbox';
import UserBookings from './pages/admin/UserBookings';
import Collections from './pages/Collections';
import MainLayout from './components/MainLayout';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './auth/AuthContext';
import './App.css';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Frontend Public Routes - with shared Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/rooms/:id/available" element={<AvailableRooms />} />
            <Route path="/vnpay-return" element={<VNPayReturn />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/booking/confirmation" element={<BookingConfirmation />} />
              <Route path="/vnpay-launch" element={<VNPayLaunch />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
              <Route path="/booking/:id" element={<OrderDetail />} />
            </Route>
          </Route>

          {/* Standalone auth pages */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="room-types" element={<RoomTypes />} />
              <Route path="items" element={<Items />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:id/bookings" element={<UserBookings />} />
              <Route path="news" element={<News />} />
              <Route path="inbox" element={<Inbox />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
