import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import API_BASE, { calculateBookingDiscountAmount, calculateBookingDisplayTotal, calculateBookingSubtotal, calculateStayNights } from '../../config';
import { useAuth } from '../../auth/useAuth';
const Swal = window.Swal;

export default function Bookings() {
  const { isAdmin } = useAuth();
  const BOOKING_STATUS_LABELS = {
    pending: 'Chờ duyệt',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn giữ chỗ',
  };
  const [data, setData] = useState({ bookings: [], totalPages: 1, currentPage: 1 });
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [formData, setFormData] = useState({
    id: '', userId: '', roomId: '', roomTypeId: '', checkIn: '', checkOut: '', status: 'pending'
  });
  const focusedBookingId = String(searchParams.get('bookingId') || '').trim();

  const getErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const payload = error?.response?.data;
    if (typeof payload === 'string' && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    return error?.message || fallback;
  };

  const toDateTimeLocalValue = (value) => {
    if (!value) return '';

    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0] = value;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    const raw = String(value).trim();
    if (!raw) return '';

    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    return normalized.substring(0, 16);
  };

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (focusedBookingId) {
        params.set('bookingId', focusedBookingId);
      } else {
        if (status) params.set('status', status);
        params.set('page', page);
        if (fromDateTime && toDateTime) {
          params.set('fromDateTime', fromDateTime);
          params.set('toDateTime', toDateTime);
        }
      }
      const query = params.toString();
      const res = await axios.get(`${API_BASE}/api/admin/bookings${query ? `?${query}` : ''}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [focusedBookingId, fromDateTime, page, status, toDateTime]);

  const fetchRoomOptions = useCallback(async (checkIn = '', checkOut = '', bookingId = '') => {
    try {
      const params = new URLSearchParams();
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      if (bookingId) params.set('excludeBookingId', bookingId);
      const query = params.toString();
      const res = await axios.get(`${API_BASE}/api/rooms${query ? `?${query}` : ''}`, { withCredentials: true });
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      axios.get(`${API_BASE}/api/admin/users/all`, { withCredentials: true })
        .then(r => setUsers(r.data))
        .catch(err => {
          console.error(err);
          setUsers([]);
        });
      fetchRoomOptions();
      return;
    }
    setUsers([]);
    setRooms([]);
  }, [fetchData, fetchRoomOptions, isAdmin]);

  useEffect(() => {
    if (!showModal) return;
    if (formData.checkIn && formData.checkOut) {
      fetchRoomOptions(formData.checkIn, formData.checkOut, formData.id);
      return;
    }
    fetchRoomOptions();
  }, [showModal, formData.checkIn, formData.checkOut, formData.id, fetchRoomOptions]);

  const handleCheckout = (b) => {
    const detail = b.details?.[0] || {};
    const checkOutDate = new Date(detail.checkOut || Date.now());
    const now = new Date();
    const displayTotal = calculateBookingDisplayTotal(b);
    if (now < checkOutDate) {
      Swal.fire({
        title: 'Khách trả phòng sớm!',
        html: `
            <div class="text-start p-3 bg-light rounded-3 mb-3">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="radio" name="checkoutOpt" id="opt1" value="keep" checked>
                    <label class="form-check-label fw-bold" for="opt1">
                        Thanh toán theo giá đã đặt
                        <div class="text-primary">${displayTotal.toLocaleString('vi-VN')}đ</div>
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="checkoutOpt" id="opt2" value="recalc">
                    <label class="form-check-label fw-bold" for="opt2">Tính lại theo số đêm thực tế</label>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận trả phòng',
        confirmButtonColor: '#ea580c',
        preConfirm: () => {
          return document.querySelector('input[name="checkoutOpt"]:checked').value;
        }
      }).then((res) => {
        if (res.isConfirmed) { submitCheckout(b.id, res.value); }
      });
    } else {
      Swal.fire({
        title: 'Xác nhận trả phòng?', text: "Đơn hàng sẽ chuyển sang trạng thái hoàn thành.", icon: 'question',
        showCancelButton: true, confirmButtonText: 'Đồng ý', confirmButtonColor: '#16a34a'
      }).then((res) => {
        if (res.isConfirmed) { submitCheckout(b.id, 'normal'); }
      });
    }
  };

  const submitCheckout = async (id, type) => {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/bookings/${id}/checkout`, { checkoutType: type }, { withCredentials: true });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Đã hoàn tất checkout', timer: 1500, showConfirmButton: false });
        document.dispatchEvent(new Event('forceFetchNotifications'));
        fetchData();
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(e) });
    }
  };

  const handleCheckIn = (booking) => {
    Swal.fire({
      title: 'Xác nhận nhận phòng?',
      text: 'Demo admin: có thể check-in thủ công để chuyển phòng sang trạng thái Đang thuê.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Nhận phòng',
      confirmButtonColor: '#2563eb'
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        const result = await axios.post(`${API_BASE}/api/admin/bookings/${booking.id}/checkin`, {}, { withCredentials: true });
        if (result.data.success) {
          Swal.fire({ icon: 'success', title: 'Đã nhận phòng', timer: 1500, showConfirmButton: false });
          fetchData();
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(error) });
      }
    });
  };

  const handleApprove = (id) => {
    Swal.fire({
      title: 'Duyệt đơn này?', text: 'Đơn đặt phòng sẽ chuyển sang trạng thái Đã xác nhận.', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Đồng ý', confirmButtonColor: '#16a34a'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const result = await axios.post(`${API_BASE}/api/admin/bookings/${id}/approve`, {}, { withCredentials: true });
          if (result.data.success) {
            Swal.fire({ icon: 'success', title: 'Đã duyệt!', timer: 1500, showConfirmButton: false });
            fetchData();
          }
        } catch (e) {
            await fetchData();
            Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(e) });
        }
      }
    });
  };

  const handleCollectCash = (booking) => {
    Swal.fire({
      title: 'Ghi nhận tiền mặt?',
      text: 'Hệ thống sẽ tạo phiếu thu tiền mặt và cập nhật doanh thu từ thời điểm này.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Thu tiền mặt',
      confirmButtonColor: '#16a34a'
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        const result = await axios.post(`${API_BASE}/api/admin/bookings/${booking.id}/collect-cash-payment`, {}, { withCredentials: true });
        if (result.data.success) {
          Swal.fire({ icon: 'success', title: 'Đã ghi nhận tiền mặt', timer: 1500, showConfirmButton: false });
          fetchData();
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(error) });
      }
    });
  };

  const handleEdit = (b) => {
    if (!isAdmin) return;
    const detail = b.details?.[0] || {};
    setFormData({
      id: b.id, userId: b.user?.id || '', roomId: detail.room?.id || '', roomTypeId: detail.room?.roomType?.id || '',
      checkIn: toDateTimeLocalValue(detail.checkIn),
      checkOut: toDateTimeLocalValue(detail.checkOut),
      status: b.status
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    if (!isAdmin) return;
    setFormData({ id: '', userId: '', roomId: '', roomTypeId: '', checkIn: '', checkOut: '', status: 'pending' });
    setShowModal(true);
  };

  const clearFocusedBooking = () => {
    setSearchParams({}, { replace: true });
    setStatus('');
    setPage(1);
  };

  const handleStatusFilter = (nextStatus) => {
    if (focusedBookingId) {
      setSearchParams({}, { replace: true });
    }
    setStatus(nextStatus);
    setPage(1);
  };

  const clearDateFilter = () => {
    setFromDateTime('');
    setToDateTime('');
    setPage(1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const res = await axios.post(`${API_BASE}/api/admin/bookings`, formData, { withCredentials: true });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Lưu thành công', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(err) });
    }
  };

  const printInvoice = () => { window.print(); };

  const selectedRoom = rooms.find((room) => String(room?.id) === String(formData.roomId));
  const roomTypeOptions = rooms.reduce((acc, room) => {
    const type = room?.roomType;
    if (!type?.id || acc.some((entry) => String(entry.id) === String(type.id))) {
      return acc;
    }
    acc.push(type);
    return acc;
  }, []).sort((a, b) => String(a?.typeName || '').localeCompare(String(b?.typeName || ''), 'vi'));
  const isSameSelectedRoomType = (room) => !formData.roomTypeId || String(room?.roomType?.id) === String(formData.roomTypeId);
  const hasPinnedCurrentRoom = Boolean(formData.id && selectedRoom && isSameSelectedRoomType(selectedRoom));
  const selectableRooms = rooms.filter((room) =>
    String(room?.status || '').toLowerCase() !== 'maintenance'
    && isSameSelectedRoomType(room)
    && (!hasPinnedCurrentRoom || String(room?.id) !== String(formData.roomId))
  );
  const getPrimaryDetail = (booking) => booking?.details?.[0] || {};
  const formatBookingDate = (value) => {
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0] = value;
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    if (!value) return 'Chưa cập nhật';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString('vi-VN', { hour12: false });
  };
  const hasCheckedIn = (booking) => {
    const detail = getPrimaryDetail(booking);
    return Boolean(detail?.checkInActual) && !detail?.checkOutActual;
  };
  const hasCheckedOut = (booking) => {
    const detail = getPrimaryDetail(booking);
    return Boolean(detail?.checkOutActual);
  };
  const getStayNightsLabel = (checkIn, checkOut) => {
    const nights = calculateStayNights(checkIn, checkOut);
    return nights > 0 ? `${nights} đêm` : 'Chưa cập nhật';
  };
  const splitPoetryLines = (value, maxLines = 2) => {
    const normalized = String(value || '').trim();
    if (!normalized) return [];

    const words = normalized.split(/\s+/);
    if (words.length <= maxLines) return words;

    const remainingWords = [...words];
    const lines = [];

    for (let index = 0; index < maxLines - 1; index += 1) {
      const wordsForLine = Math.ceil(remainingWords.length / (maxLines - index));
      lines.push(remainingWords.splice(0, wordsForLine).join(' '));
    }

    lines.push(remainingWords.join(' '));
    return lines.filter(Boolean);
  };
  const isTerminalStatus = (value) => ['completed', 'cancelled', 'expired'].includes(String(value || '').toLowerCase());
  const canEditBooking = (value) => ['pending', 'confirmed'].includes(String(value || '').toLowerCase());
  const getBookingStatusLabel = (value) => BOOKING_STATUS_LABELS[String(value || '').toLowerCase()] || value || 'pending';
  const getPaymentStatusLabel = (value) => ({
    unpaid: 'Chưa thanh toán',
    pending_payment: 'Chờ thanh toán',
    deposit_paid: 'Đã đặt cọc',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán lỗi',
  }[String(value || '').toLowerCase()] || value || 'unpaid');
  const getAllowedStatusOptions = (bookingId, currentStatus) => {
    const normalizedStatus = String(currentStatus || 'pending').toLowerCase();
    if (!bookingId) {
      return ['pending', 'confirmed'];
    }
    if (normalizedStatus === 'pending') {
      return ['pending', 'confirmed', 'cancelled'];
    }
    if (normalizedStatus === 'confirmed') {
      return ['confirmed', 'cancelled'];
    }
    return [normalizedStatus];
  };
  const statusOptions = getAllowedStatusOptions(formData.id, formData.status);

  return (
    <>
      <style>{`
        .st-badge { padding: 3px 8px; border-radius: 8px; font-size: 0.58rem; font-weight: 700; text-transform: uppercase; white-space: normal; display: inline-block; text-align: center; line-height: 1.2; max-width: 92px; }
        .st-confirmed { background: #e0f2fe; color: #0369a1; }
        .st-pending { background: #fef3c7; color: #92400e; }
        .st-completed { background: #dcfce7; color: #166534; }
        .st-cancelled { background: #fee2e2; color: #991b1b; }
        .st-expired { background: #e5e7eb; color: #334155; }
        .st-pay-unpaid { background: #fef3c7; color: #92400e; }
        .st-pay-pending_payment { background: #e0f2fe; color: #075985; }
        .st-pay-deposit_paid { background: #ede9fe; color: #6d28d9; }
        .st-pay-paid { background: #dcfce7; color: #166534; }
        .st-pay-failed { background: #fee2e2; color: #991b1b; }
        .btn-check-action { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: none; transition: 0.2s; }
        .btn-check-early { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
        .btn-check-early:hover { background: #ea580c; color: white; }
        .booking-filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .booking-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .booking-table th {
          padding: 16px 22px;
          font-weight: 700;
          color: #64748b;
          vertical-align: middle;
          font-size: 0.9rem;
        }
        .booking-table td {
          padding: 20px 22px;
          vertical-align: middle;
          font-size: 0.88rem;
        }
        .booking-heading-stack,
        .booking-text-stack {
          display: inline-flex;
          flex-direction: column;
          gap: 2px;
          line-height: 1.18;
        }
        .booking-heading-stack {
          font-weight: 700;
        }
        .booking-customer-name {
          font-size: 0.86rem;
          color: #1f2937;
        }
        .booking-room-block {
          display: inline-flex;
          flex-direction: column;
          gap: 3px;
        }
        .booking-table th:first-child,
        .booking-table td:first-child {
          padding-left: 12px;
        }
        .booking-table th:last-child,
        .booking-table td:last-child {
          padding-right: 12px;
        }
        .booking-room-name {
          font-size: 0.86rem;
        }
        .booking-room-price,
        .booking-time-meta,
        .booking-stay-chip {
          font-size: 0.76rem;
        }
        .booking-total {
          font-size: 0.9rem;
        }
        .invoice-box { padding: 20px; border: 1px solid #eee; border-radius: 16px; background: #fff; }
        .invoice-header { border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .invoice-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
        .invoice-total { border-top: 2px solid #eee; padding-top: 15px; margin-top: 15px; font-size: 1.2rem; font-weight: 800; color: var(--primary-color); }
      `}</style>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý đặt phòng</h2>
              <p className="text-muted mb-0">
                {isAdmin
                  ? 'Hệ thống quản lý booking và lịch lưu trú theo giờ nhận, giờ trả phòng.'
                  : 'Nhân viên có thể duyệt đơn, nhận phòng, trả phòng và xác nhận thu tiền mặt.'}
              </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
                + Tạo đơn mới
            </button>
          )}
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom booking-filters">
              <div className="booking-filter-group">
                  <button className={`btn btn-sm ${!status ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('')}>Tất cả</button>
                  <button className={`btn btn-sm ${status === 'pending' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('pending')}>Chờ duyệt</button>
                  <button className={`btn btn-sm ${status === 'confirmed' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('confirmed')}>Đã xác nhận</button>
                  <button className={`btn btn-sm ${status === 'completed' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('completed')}>Hoàn thành</button>
                  <button className={`btn btn-sm ${status === 'cancelled' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('cancelled')}>Đã hủy</button>
                  <button className={`btn btn-sm ${status === 'expired' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => handleStatusFilter('expired')}>Hết hạn</button>
              </div>
              {!focusedBookingId && (
                <div className="booking-filter-group">
                  <div>
                    <label className="form-label small fw-bold text-uppercase text-muted mb-1">Có đơn từ</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm rounded-3"
                      value={fromDateTime}
                      onChange={(e) => {
                        setFromDateTime(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="form-label small fw-bold text-uppercase text-muted mb-1">Đến</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm rounded-3"
                      value={toDateTime}
                      onChange={(e) => {
                        setToDateTime(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  {(fromDateTime || toDateTime) && (
                    <button className="btn btn-sm btn-light border rounded-pill px-3" onClick={clearDateFilter}>
                      Xóa lọc lịch
                    </button>
                  )}
                </div>
              )}
              {focusedBookingId && (
                <button className="btn btn-sm btn-light border rounded-pill px-3" onClick={clearFocusedBooking}>
                    Xem tất cả
                </button>
              )}
          </div>

          <div className="p-0" style={{ width: '100%', overflowX: 'hidden' }}>
              <table className="table booking-table mb-0 align-middle table-hover" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead className="table-light">
                      <tr>
                          <th style={{ width: '20%' }}>
                            <span className="booking-heading-stack">
                              <span>Khách</span>
                              <span>hàng</span>
                            </span>
                          </th>
                          <th style={{ width: '15%' }}>
                            <span className="booking-heading-stack">
                              <span>Phòng</span>
                              <span>& giá</span>
                            </span>
                          </th>
                          <th style={{ width: '20%' }}>
                            <span className="booking-heading-stack">
                              <span>Thời</span>
                              <span>gian</span>
                            </span>
                          </th>
                          <th style={{ width: '14%' }}>
                            <span className="booking-heading-stack">
                              <span>Tổng</span>
                              <span>tiền</span>
                            </span>
                          </th>
                          <th style={{ width: '11%' }}>
                            <span className="booking-heading-stack">
                              <span>Đơn</span>
                              <span>đặt</span>
                            </span>
                          </th>
                          <th style={{ width: '12%' }}>
                            <span className="booking-heading-stack">
                              <span>Thanh</span>
                              <span>toán</span>
                            </span>
                          </th>
                          <th className="text-end" style={{ width: '8%' }}>
                            <span className="booking-heading-stack text-end">
                              <span>Hành</span>
                              <span>động</span>
                            </span>
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.bookings && data.bookings.length > 0 ? data.bookings.map(b => {
                          const checkedIn = hasCheckedIn(b);
                          const checkedOut = hasCheckedOut(b);
                          const displayTotal = calculateBookingDisplayTotal(b);
                          const normalizedStatus = String(b.status || '').toLowerCase();
                          const normalizedPaymentStatus = String(b.paymentStatus || '').toLowerCase();
                          return (
                          <tr key={b.id}>
                              <td>
                                <div className="booking-text-stack booking-customer-name fw-bold text-wrap text-break">
                                  {splitPoetryLines(b.user?.fullName || 'Chưa cập nhật').map((line, index) => (
                                    <span key={`${b.id}-customer-line-${index}`}>{line}</span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                  {b.details?.map((d, i) => (
                                    <div key={`rm-${i}`} className="mb-2">
                                      <div className="booking-room-block">
                                        <div className="fw-bold text-primary booking-text-stack booking-room-name">
                                          <span>Phòng</span>
                                          <span>{d.room?.roomNumber}</span>
                                        </div>
                                        <small className="text-muted booking-text-stack booking-room-price">
                                          <span>{d.room?.roomType?.pricePerNight.toLocaleString('vi-VN')}đ</span>
                                          <span>/ đêm</span>
                                        </small>
                                      </div>
                                    </div>
                                  ))}
                              </td>
                              <td className="small">
                                  {b.details?.map((d, i) => (
                                    <div key={`time-${i}`} className="mb-1 text-wrap booking-time-meta">
                                      <div className="text-muted">In: <b className="text-dark">{formatBookingDate(d.checkIn)}</b></div>
                                      <div className="text-muted">Out: <b className="text-dark">{formatBookingDate(d.checkOut)}</b></div>
                                      {d.checkInActual && <div className="text-success">Nhận phòng: <b>{formatBookingDate(d.checkInActual)}</b></div>}
                                      {d.checkOutActual && <div className="text-secondary">Trả phòng: <b>{formatBookingDate(d.checkOutActual)}</b></div>}
                                      {!d.checkInActual && b.status === 'confirmed' && <div className="text-warning">Chưa nhận phòng</div>}
                                    </div>
                                  ))}
                              </td>
                              <td>
                                  <div className="fw-bold text-primary booking-text-stack booking-total">
                                    <span>{displayTotal.toLocaleString('vi-VN')}đ</span>
                                    <span className="badge bg-light text-dark fw-normal border booking-stay-chip">
                                      {getStayNightsLabel(b.details?.[0]?.checkIn, b.details?.[0]?.checkOut)}
                                    </span>
                                  </div>
                              </td>
                              <td><span className={`st-badge st-${b.status}`}>{getBookingStatusLabel(b.status)}</span></td>
                              <td><span className={`st-badge st-pay-${b.paymentStatus || 'unpaid'}`}>{getPaymentStatusLabel(b.paymentStatus)}</span></td>
                              <td className="text-end">
                                  <div className="d-flex flex-wrap justify-content-end gap-1">
                                      {b.status === 'pending' && (
                                          <button className="btn btn-sm btn-light text-success border rounded-circle" style={{width:'32px', height:'32px'}} title="Duyệt đơn" onClick={() => handleApprove(b.id)}>✓</button>
                                      )}
                                      {normalizedStatus === 'confirmed' && normalizedPaymentStatus !== 'paid' && (
                                          <button className="btn btn-sm btn-light text-success border rounded-circle" style={{width:'32px', height:'32px'}} title="Thu tiền mặt" onClick={() => handleCollectCash(b)}>₫</button>
                                      )}
                                      {b.status === 'confirmed' && !checkedIn && !checkedOut && (
                                          <button className="btn btn-sm btn-light text-primary border rounded-circle" style={{width:'32px', height:'32px'}} title="Nhận phòng" onClick={() => handleCheckIn(b)}>⇢</button>
                                      )}
                                      {b.status === 'confirmed' && checkedIn && normalizedPaymentStatus === 'paid' && (
                                          <button className="btn btn-sm btn-light text-warning border rounded-circle" style={{width:'32px', height:'32px'}} title="Chấm trả phòng" onClick={() => handleCheckout(b)}>⚡</button>
                                      )}
                                      {b.status === 'completed' && (
                                          <button className="btn btn-sm btn-light text-info border rounded-circle" style={{width:'32px', height:'32px'}} title="Xem hóa đơn" onClick={() => {
                                              setInvoiceData(b);
                                              setShowInvoice(true);
                                          }}>👁</button>
                                      )}
                                      {isAdmin && canEditBooking(b.status) && (
                                          <button className="btn btn-sm btn-light text-primary border rounded-circle" style={{width:'32px', height:'32px'}} title="Sửa" onClick={() => handleEdit(b)}>✎</button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      )}) : (<tr><td colSpan="7" className="text-center py-5 text-muted">Không có đơn đặt phòng nào.</td></tr>)}
                  </tbody>
              </table>
          </div>

          {data.totalPages > 1 && (
            <div className="p-4 d-flex justify-content-end border-top">
                <nav><ul className="pagination mb-0">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button></li>
                    {[...Array(data.totalPages)].map((_, i) => (
                        <li key={i+1} className={`page-item ${i+1 === page ? 'active' : ''}`}><button className="page-link" onClick={() => setPage(i+1)}>{i+1}</button></li>
                    ))}
                    <li className={`page-item ${page >= data.totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(p => p + 1)}>›</button></li>
                </ul></nav>
            </div>
          )}
      </div>

      {showModal && isAdmin && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold">{formData.id ? 'Cập nhật đơn đặt phòng' : 'Tạo đơn mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="mb-3">
                                  <label className="form-label fw-bold small text-muted text-uppercase">Khách hàng</label>
                                  <select className="form-select rounded-3" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} required>
                                      <option value="">-- Chọn khách --</option>
                                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                                  </select>
                              </div>
                              <div className="mb-3">
                                  <label className="form-label fw-bold small text-muted text-uppercase">Loại phòng</label>
                                  <select
                                      className="form-select rounded-3"
                                      value={formData.roomTypeId}
                                      onChange={e => setFormData({ ...formData, roomTypeId: e.target.value, roomId: '' })}
                                      required
                                  >
                                      <option value="">-- Chọn loại phòng --</option>
                                      {roomTypeOptions.map(type => (
                                        <option key={type.id} value={type.id}>
                                          {type.typeName} {type.pricePerNight ? `- ${Number(type.pricePerNight).toLocaleString('vi-VN')}đ/đêm` : ''}
                                        </option>
                                      ))}
                                  </select>
                                  <small className="text-muted d-block mt-2">Chọn loại phòng trước để hệ thống chỉ hiện đúng các phòng thuộc hạng đó.</small>
                              </div>
                              <div className="mb-3">
                                   <label className="form-label fw-bold small text-muted text-uppercase">Phòng</label>
                                   <select
                                       className="form-select rounded-3"
                                       value={formData.roomId}
                                       onChange={e => setFormData({...formData, roomId: e.target.value})}
                                       required
                                       disabled={!formData.roomTypeId}
                                   >
                                       <option value="">{formData.roomTypeId ? '-- Chọn phòng --' : '-- Chọn loại phòng trước --'}</option>
                                       {hasPinnedCurrentRoom && (
                                           <option value={formData.roomId}>Phòng {selectedRoom?.roomNumber} (Hiện tại)</option>
                                       )}
                                       {selectableRooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber}</option>)}
                                   </select>
                                   <small className="text-muted d-block mt-2">Danh sách phòng được lọc theo khoảng ngày đang chọn, không còn dựa riêng vào trạng thái vật lý của phòng.</small>
                               </div>
                              <div className="row mb-3 g-3">
                                  <div className="col-6">
                                      <label className="form-label fw-bold small text-muted text-uppercase">Giờ Check-in</label>
                                      <input type="datetime-local" className="form-control" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} required />
                                  </div>
                                  <div className="col-6">
                                      <label className="form-label fw-bold small text-muted text-uppercase">Giờ Check-out</label>
                                      <input type="datetime-local" className="form-control" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} required />
                                  </div>
                              </div>
                               <div className="mb-4">
                                   <label className="form-label fw-bold small text-muted text-uppercase">Trạng thái</label>
                                   <select className="form-select rounded-3" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                      {statusOptions.map((value) => (
                                        <option key={value} value={value}>{BOOKING_STATUS_LABELS[value] || value}</option>
                                      ))}
                                   </select>
                                   {formData.id && isTerminalStatus(formData.status) && (
                                     <small className="text-muted d-block mt-2">Booking ở trạng thái cuối chỉ được xem lại, không được đổi trạng thái.</small>
                                   )}
                               </div>
                              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>Lưu thông tin</button>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showInvoice && invoiceData && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold text-uppercase text-primary">Chi tiết hóa đơn</h5>
                          <button type="button" className="btn-close" onClick={() => setShowInvoice(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <div className="invoice-box">
                              <div className="invoice-header text-center">
                                  <h3 className="fw-bold">GOAT HOTEL</h3>
                                  <div className="text-muted small">Mã đơn: #{invoiceData.id}</div>
                              </div>
                              <div className="invoice-row"><span className="text-muted">Khách hàng:</span> <span className="fw-bold">{invoiceData.user?.fullName}</span></div>
                              {invoiceData.details?.map((d, i) => (
                                <div key={i} className="mb-3 border rounded p-2 bg-light">
                                  <div className="invoice-row"><span className="text-muted">Phòng:</span> <span className="fw-bold">{d.room?.roomNumber} ({d.room?.roomType?.typeName})</span></div>
                                  <div className="invoice-row"><span className="text-muted">Nhận phòng:</span> <span>{d.checkIn}</span></div>
                                  <div className="invoice-row"><span className="text-muted">Trả phòng:</span> <span>{d.checkOut}</span></div>
                                  <div className="border-top mt-2 pt-2">
                                      <div className="invoice-row">
                                          <span>Đơn giá</span>
                                          <span>{d.priceAtBooking.toLocaleString('vi-VN')}đ /đêm</span>
                                      </div>
                                      <div className="invoice-row mb-0">
                                          <span>Thời gian lưu trú</span>
                                          <span>{getStayNightsLabel(d.checkIn, d.checkOut)}</span>
                                      </div>
                                  </div>
                                </div>
                              ))}

                              {Number(calculateBookingDiscountAmount(invoiceData) || 0) > 0 && (
                                <>
                                  <div className="invoice-row"><span className="text-muted">Tạm tính:</span> <span>{calculateBookingSubtotal(invoiceData).toLocaleString('vi-VN')}đ</span></div>
                                  <div className="invoice-row"><span className="text-muted">Mã giảm giá:</span> <span className="fw-bold">{invoiceData.couponCode}</span></div>
                                  <div className="invoice-row"><span className="text-muted">Giảm giá:</span> <span className="text-success">-{calculateBookingDiscountAmount(invoiceData).toLocaleString('vi-VN')}đ</span></div>
                                </>
                              )}

                              <div className="invoice-total d-flex justify-content-between">
                                  <span>TỔNG CỘNG</span>
                                  <span>{calculateBookingDisplayTotal(invoiceData).toLocaleString('vi-VN')} VNĐ</span>
                              </div>
                              <div className="text-center mt-3 fw-bold text-uppercase small border p-1 rounded bg-light">
                                  Thanh toán: {getPaymentStatusLabel(invoiceData.paymentStatus)}
                              </div>
                          </div>
                          <button className="btn btn-dark w-100 mt-3 rounded-pill" onClick={printInvoice}>🖨 In hóa đơn</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
