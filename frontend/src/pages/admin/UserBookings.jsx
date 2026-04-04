import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { calculateBookingDisplayTotal, calculateStayNights } from '../../config';

const STATUS_META = {
  pending: { label: 'Cho xu ly', className: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' },
  confirmed: { label: 'Da xac nhan', className: 'bg-info-subtle text-info-emphasis border border-info-subtle' },
  completed: { label: 'Hoan thanh', className: 'bg-success-subtle text-success-emphasis border border-success-subtle' },
  cancelled: { label: 'Da huy', className: 'bg-danger-subtle text-danger-emphasis border border-danger-subtle' },
  expired: { label: 'Het han', className: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle' },
};

const PAYMENT_META = {
  unpaid: { label: 'Chua thanh toan', className: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' },
  pending_payment: { label: 'Cho thanh toan', className: 'bg-info-subtle text-info-emphasis border border-info-subtle' },
  deposit_paid: { label: 'Da dat coc', className: 'bg-primary-subtle text-primary-emphasis border border-primary-subtle' },
  paid: { label: 'Da thanh toan', className: 'bg-success-subtle text-success-emphasis border border-success-subtle' },
  failed: { label: 'Thanh toan loi', className: 'bg-danger-subtle text-danger-emphasis border border-danger-subtle' },
};

function parseDate(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleString('vi-VN', { hour12: false }) : 'Chua cap nhat';
}

async function fetchAllAdminBookings() {
  let page = 1;
  let totalPages = 1;
  const collected = [];

  while (page <= totalPages) {
    const res = await axios.get(`${API_BASE}/api/admin/bookings?page=${page}`, { withCredentials: true });
    collected.push(...(res.data?.bookings || []));
    totalPages = Math.max(Number(res.data?.totalPages || 1), 1);
    page += 1;
  }

  return collected;
}

export default function UserBookings() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, allBookings] = await Promise.all([
          axios.get(`${API_BASE}/api/admin/users/all`, { withCredentials: true }),
          fetchAllAdminBookings(),
        ]);

        if (!active) return;

        const matchedUser = (usersRes.data || []).find((entry) => String(entry.id) === String(id)) || null;
        const filteredBookings = allBookings
          .filter((booking) => String(booking.user?.id) === String(id))
          .sort((left, right) => (parseDate(right.createdAt)?.getTime() || 0) - (parseDate(left.createdAt)?.getTime() || 0));

        setUser(matchedUser);
        setBookings(filteredBookings);
      } catch (error) {
        console.error('Failed to load user bookings:', error);
        if (!active) return;
        setUser(null);
        setBookings([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [id]);

  const totalSpent = bookings.reduce((sum, booking) => sum + Number(calculateBookingDisplayTotal(booking) || 0), 0);
  const pendingCount = bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'pending').length;
  const confirmedCount = bookings.filter((booking) => String(booking.status || '').toLowerCase() === 'confirmed').length;

  return (
    <>
      <style>{`
        .summary-tile {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.14);
        }
        .booking-card {
          background: white;
          border-radius: 26px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.14);
        }
        .badge-lite {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      `}</style>

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-uppercase small text-muted fw-bold mb-2">Nguoi dung va booking</p>
          <h2 className="fw-bold mb-1">
            {user?.fullName || `Nguoi dung #${id}`}
          </h2>
          <p className="text-muted mb-0">
            {user?.email || 'Khong tim thay thong tin email trong danh sach nguoi dung.'}
          </p>
        </div>

        <Link to="/admin/users" className="btn btn-light border rounded-pill px-4 py-2 fw-bold">
          ← Quay lai quan ly nguoi dung
        </Link>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="summary-tile h-100">
                <div className="small text-muted text-uppercase fw-bold mb-2">Tong so booking</div>
                <div className="display-6 fw-bold text-primary">{bookings.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary-tile h-100">
                <div className="small text-muted text-uppercase fw-bold mb-2">Dang cho xu ly / da xac nhan</div>
                <div className="display-6 fw-bold text-primary">{pendingCount} / {confirmedCount}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary-tile h-100">
                <div className="small text-muted text-uppercase fw-bold mb-2">Tong gia tri booking</div>
                <div className="display-6 fw-bold text-primary">{totalSpent.toLocaleString('vi-VN')}đ</div>
              </div>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="booking-card text-center py-5">
              <div className="small text-muted text-uppercase fw-bold mb-2">Khong co du lieu</div>
              <h3 className="fw-bold mb-3">Nguoi dung nay chua co booking nao</h3>
              <p className="text-muted mb-0">
                Trang nay tong hop tat ca booking cua nguoi dung bang cach doc danh sach booking admin hien co.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {bookings.map((booking) => {
                const bookingStatus = String(booking.status || 'pending').toLowerCase();
                const paymentStatus = String(booking.paymentStatus || 'unpaid').toLowerCase();
                const statusMeta = STATUS_META[bookingStatus] || STATUS_META.pending;
                const paymentMeta = PAYMENT_META[paymentStatus] || PAYMENT_META.unpaid;
                const primaryDetail = booking.details?.[0] || {};
                const roomLines = (booking.details || []).map((detail) => ({
                  key: detail.id || `${booking.id}-${detail.room?.id || 'room'}`,
                  roomNumber: detail.room?.roomNumber || 'N/A',
                  roomType: detail.room?.roomType?.typeName || 'Loai phong',
                  nights: calculateStayNights(detail.checkIn, detail.checkOut),
                  price: Number(detail.priceAtBooking || detail.room?.roomType?.pricePerNight || 0),
                }));

                return (
                  <article key={booking.id} className="booking-card">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-3 mb-3">
                      <div>
                        <div className="small text-muted text-uppercase fw-bold mb-2">Booking #{String(booking.id).padStart(5, '0')}</div>
                        <h3 className="fw-bold mb-1">{primaryDetail.room?.roomType?.typeName || 'Phong khach san'}</h3>
                        <p className="text-muted mb-0">Tao luc: {formatDate(booking.createdAt)}</p>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <span className={`badge-lite ${statusMeta.className}`}>{statusMeta.label}</span>
                        <span className={`badge-lite ${paymentMeta.className}`}>{paymentMeta.label}</span>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-lg-7">
                        <div className="d-flex flex-column gap-3">
                          {roomLines.map((roomLine) => (
                            <div key={roomLine.key} className="rounded-4 border px-3 py-3 bg-light-subtle">
                              <div className="d-flex flex-wrap justify-content-between gap-3">
                                <div>
                                  <div className="fw-bold text-primary">Phong {roomLine.roomNumber}</div>
                                  <div className="text-muted small">{roomLine.roomType}</div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold">{roomLine.price.toLocaleString('vi-VN')}đ / dem</div>
                                  <div className="text-muted small">{roomLine.nights > 0 ? `${roomLine.nights} dem` : 'Chua cap nhat lich'}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-lg-5">
                        <div className="rounded-4 border px-4 py-4 h-100 bg-light-subtle">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Nhan phong</span>
                            <strong>{formatDate(primaryDetail.checkIn)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Tra phong</span>
                            <strong>{formatDate(primaryDetail.checkOut)}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">So phong trong don</span>
                            <strong>{booking.details?.length || 0}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Coupon</span>
                            <strong>{booking.couponCode || 'Khong ap dung'}</strong>
                          </div>
                          <div className="d-flex justify-content-between border-top pt-3 mt-3">
                            <span className="text-muted">Tong thanh toan</span>
                            <strong className="text-primary">{Number(calculateBookingDisplayTotal(booking) || 0).toLocaleString('vi-VN')}đ</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
