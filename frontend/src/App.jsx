import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import History from './pages/History';
import OrderDetail from './pages/OrderDetail';
import NewsDetail from './pages/NewsDetail';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';
import RoomDetail from './pages/RoomDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Rooms from './pages/admin/Rooms';
import RoomTypes from './pages/admin/RoomTypes';
import Items from './pages/admin/Items';
import Bookings from './pages/admin/Bookings';
import Users from './pages/admin/Users';
import News from './pages/admin/News';
import Collections from './pages/Collections';
import MainLayout from './components/MainLayout';
import './App.css';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Frontend Public Routes - with shared Navbar + Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/booking/confirmation" element={<BookingConfirmation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/booking/:id" element={<OrderDetail />} />
        </Route>

        {/* Standalone pages with their own custom navigation */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

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
    </BrowserRouter>
  );
}

export default App;
