import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { calculateBookingDisplayTotal } from '../../config';

export default function UserBookings() {
  const { id } = useParams();
  const [data, setData] = useState({
    success: true,
    user: null,
    bookings: [],
    totalPages: 1,
    currentPage: 1,
    totalSpent: 0,
    totalBookings: 0
  });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/users/${id}/bookings?status=${status}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (error) {
      console.error(error);
      setData((prev) => ({ ...prev, success: false }));
    } finally {
      setLoading(false);
    }
  }, [id, page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (value) => {
    if (!value) return 'N/A';
    if (Array.isArray(value)) {
      return `${String(value[2]).padStart(2, '0')}/${String(value[1]).padStart(2, '0')}/${value[0]} ${String(value[3] || 0).padStart(2, '0')}:${String(value[4] || 0).padStart(2, '0')}`;
    }
    return new Date(value).toLocaleString('vi-VN');
  };
  const getBookingStatusLabel = (value) => ({
    pending: 'Chờ duyệt',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn giữ chỗ',
  }[String(value || '').toLowerCase()] || value || 'pending');
  const getPaymentStatusLabel = (value) => ({
    unpaid: 'Chưa thanh toán',
    pending_payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán lỗi',
  }[String(value || '').toLowerCase()] || value || 'unpaid');

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  }

  if (!data.success) {
    return <div className="alert alert-danger">Không thể tải lịch sử booking của người dùng này.</div>;
  }

  return (
    <>
      <style>{`
        .stat-box { background: white; border-radius: 24px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); height: 100%; }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/admin/users" className="text-decoration-none small text-muted">← Quay lại danh sách user</Link>
          <h2 className="fw-bold mt-2 mb-1">Booking của {data.user?.fullName}</h2>
          <p className="text-muted mb-0">{data.user?.email} {data.user?.phone ? `· ${data.user.phone}` : ''}</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="stat-box">
            <div className="small text-muted mb-1 text-uppercase fw-bold">Tổng booking</div>
            <h3 className="fw-bold mb-0">{data.totalBookings}</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-box">
            <div className="small text-muted mb-1 text-uppercase fw-bold">Đã chi tiêu</div>
            <h3 className="fw-bold mb-0 text-primary">{Number(data.totalSpent || 0).toLocaleString('vi-VN')}đ</h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-box">
            <div className="small text-muted mb-1 text-uppercase fw-bold">Lọc trạng thái</div>
            <select className="form-select mt-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="expired">Hết hạn giữ chỗ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-table">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Phòng</th>
                <th>Thời gian</th>
                <th>Tổng tiền</th>
                <th>Booking</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings?.length > 0 ? data.bookings.map((booking) => {
                const detail = booking.details?.[0];
                const displayTotal = calculateBookingDisplayTotal(booking);
                return (
                  <tr key={booking.id}>
                    <td className="fw-bold">#{booking.id}</td>
                    <td>
                      <div className="fw-bold text-primary">Phòng {detail?.room?.roomNumber || 'N/A'}</div>
                      <small className="text-muted">{detail?.room?.roomType?.typeName || 'Không rõ loại phòng'}</small>
                    </td>
                    <td className="small">
                      <div>In: <b>{formatDate(detail?.checkIn)}</b></div>
                      <div>Out: <b>{formatDate(detail?.checkOut)}</b></div>
                    </td>
                    <td className="fw-bold">{displayTotal.toLocaleString('vi-VN')}đ</td>
                    <td><span className={`badge rounded-pill bg-light text-dark border text-uppercase`}>{getBookingStatusLabel(booking.status)}</span></td>
                    <td><span className={`badge rounded-pill bg-light text-dark border text-uppercase`}>{getPaymentStatusLabel(booking.paymentStatus)}</span></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" className="text-center py-5 text-muted">User này chưa có booking nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div className="p-4 d-flex justify-content-end border-top">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p - 1)}>‹</button>
                </li>
                {[...Array(data.totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= data.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p + 1)}>›</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
