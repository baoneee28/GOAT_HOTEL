import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE from '../../config';
import { useAuth } from '../../auth/useAuth';

const ROOM_STATUS_META = {
  available: {
    label: 'Sẵn sàng',
    className: 'room-status-available',
    description: 'Có thể nhận booking mới',
  },
  booked: {
    label: 'Đang có khách',
    className: 'room-status-booked',
    description: 'Phòng đang được sử dụng',
  },
  reserved: {
    label: 'Có lịch sắp tới',
    className: 'room-status-reserved',
    description: 'Đã có booking còn hiệu lực trong tương lai hoặc booking đã xác nhận nhưng chưa check-in',
  },
  maintenance: {
    label: 'Đang sửa',
    className: 'room-status-maintenance',
    description: 'Tạm ngưng khai thác để bảo trì',
  },
};

const FILTER_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'available', label: 'Sẵn sàng' },
  { value: 'booked', label: 'Đang có khách' },
  { value: 'reserved', label: 'Có lịch sắp tới' },
  { value: 'maintenance', label: 'Đang sửa' },
];

const EDITABLE_STATUS_OPTIONS = [
  { value: 'available', label: 'Sẵn sàng' },
  { value: 'booked', label: 'Đang có khách' },
  { value: 'maintenance', label: 'Đang sửa' },
];

const createEmptyForm = () => ({
  id: '',
  roomNumber: '',
  typeId: '',
  status: 'available',
  effectiveStatus: 'available',
});

export default function Rooms() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ rooms: [], totalPages: 1, currentPage: 1 });
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm());

  const getErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const payload = error?.response?.data;
    if (typeof payload === 'string' && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    return error?.message || fallback;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { q, status, page };
      if (availableFrom && availableTo) {
        params.availableFrom = availableFrom;
        params.availableTo = availableTo;
      }
      const res = await axios.get(`${API_BASE}/api/rooms/admin`, {
        params,
        withCredentials: true,
      });

      const nextData = {
        rooms: res.data?.rooms || [],
        totalPages: res.data?.totalPages || 1,
        currentPage: res.data?.currentPage || 1,
      };

      setData(nextData);
      setLoadError('');

      if (nextData.currentPage !== page) {
        setPage(nextData.currentPage);
      }
    } catch (error) {
      console.error(error);
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách phòng.'));
      setData({ rooms: [], totalPages: 1, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  }, [availableFrom, availableTo, page, q, status]);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/room-types`, { withCredentials: true });
      setTypes(res.data || []);
    } catch (error) {
      console.error(error);
      setTypes([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const closeModal = (force = false) => {
    if (submitting && !force) return;
    setShowModal(false);
    setFormData(createEmptyForm());
  };

  const handleAddNew = () => {
    if (!isAdmin) {
      return;
    }
    if (!types.length) {
      window.Swal?.fire({
        icon: 'warning',
        title: 'Thiếu loại phòng',
        text: 'Bạn cần tạo loại phòng trước khi thêm phòng mới.',
      });
      return;
    }

    setFormData({
      id: '',
      roomNumber: '',
      typeId: String(types[0].id),
      status: 'available',
      effectiveStatus: 'available',
    });
    setShowModal(true);
  };

  const handleEdit = (room) => {
    setFormData({
      id: room.id || '',
      roomNumber: room.roomNumber || '',
      typeId: room.roomType?.id ? String(room.roomType.id) : '',
      status: room.status || 'available',
      effectiveStatus: room.effectiveStatus || room.status || 'available',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const normalizedRoomNumber = formData.roomNumber.trim().toUpperCase();
    if (!normalizedRoomNumber) {
      window.Swal?.fire({ icon: 'warning', title: 'Thiếu số phòng', text: 'Vui lòng nhập số phòng trước khi lưu.' });
      return;
    }
    if (normalizedRoomNumber.length > 10) {
      window.Swal?.fire({ icon: 'warning', title: 'Số phòng quá dài', text: 'Số phòng tối đa 10 ký tự.' });
      return;
    }
    if (!formData.typeId) {
      window.Swal?.fire({ icon: 'warning', title: 'Thiếu loại phòng', text: 'Vui lòng chọn loại phòng.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/rooms/admin`, {
        id: formData.id || null,
        roomNumber: normalizedRoomNumber,
        typeId: Number(formData.typeId),
        status: formData.status,
      }, { withCredentials: true });

      if (res.data?.success) {
        window.Swal?.fire({
          icon: 'success',
          title: 'Thành công',
          text: res.data?.message || 'Đã lưu thông tin phòng.',
          timer: 1500,
          showConfirmButton: false,
        });
        closeModal(true);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      window.Swal?.fire({
        icon: 'error',
        title: 'Không thể lưu phòng',
        text: getErrorMessage(error, 'Có lỗi xảy ra khi lưu thông tin phòng.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    if (!isAdmin) {
      return;
    }
    let confirmed = false;

    if (window.Swal) {
      const result = await window.Swal.fire({
        title: `Xóa phòng ${room.roomNumber}?`,
        text: 'Thao tác này không thể hoàn tác.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Xóa phòng',
        cancelButtonText: 'Hủy',
      });
      confirmed = result.isConfirmed;
    } else {
      confirmed = window.confirm(`Bạn có chắc muốn xóa phòng ${room.roomNumber}?`);
    }

    if (!confirmed) return;

    setDeletingId(room.id);
    try {
      const res = await axios.delete(`${API_BASE}/api/rooms/admin/${room.id}`, { withCredentials: true });
      if (res.data?.success) {
        window.Swal?.fire({
          icon: 'success',
          title: 'Đã xóa phòng',
          text: res.data?.message || 'Phòng đã được xóa.',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchData();
      } else {
        window.Swal?.fire({
          icon: 'error',
          title: 'Không thể xóa phòng',
          text: res.data?.message || 'Có lỗi xảy ra.',
        });
      }
    } catch (error) {
      console.error(error);
      window.Swal?.fire({
        icon: 'error',
        title: 'Không thể xóa phòng',
        text: getErrorMessage(error, 'Có lỗi xảy ra khi xóa phòng.'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const selectedType = types.find((type) => String(type.id) === String(formData.typeId));
  const previewStatus = formData.id ? formData.effectiveStatus : formData.status;

  return (
    <>
      <style>{`
        .room-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: 1px solid transparent;
        }
        .room-status-available {
          background: #dcfce7;
          border-color: #bbf7d0;
          color: #166534;
        }
        .room-status-booked {
          background: #dbeafe;
          border-color: #bfdbfe;
          color: #1d4ed8;
        }
        .room-status-reserved {
          background: #fef3c7;
          border-color: #fde68a;
          color: #92400e;
        }
        .room-status-maintenance {
          background: #e5e7eb;
          border-color: #d1d5db;
          color: #334155;
        }
        .room-form-note {
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
        }
        .room-booking-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid #fde68a;
          background: #fff7ed;
          color: #9a3412;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
        }
        .room-booking-link:hover {
          color: #7c2d12;
          background: #ffedd5;
        }
        .room-status-detail {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          margin-top: 8px;
        }
        .room-availability-from label,
        .room-availability-to label,
        .room-clear-filter {
          font-size: 0;
        }
        .room-availability-from label::after,
        .room-availability-to label::after,
        .room-clear-filter::after {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }
        .room-availability-from label::after {
          content: 'Trống từ';
        }
        .room-availability-to label::after {
          content: 'Đến';
        }
        .room-clear-filter::after {
          content: 'Xóa lọc lịch';
          font-size: 0.95rem;
          letter-spacing: normal;
          text-transform: none;
          color: #0f172a;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý phòng</h2>
          <p className="text-muted mb-0">
            {isAdmin
              ? 'Danh sách, trạng thái và thao tác quản trị cho từng phòng nghỉ.'
              : 'Nhân viên có thể cập nhật trạng thái vận hành và xem booking liên quan của từng phòng.'}
          </p>
        </div>
        {isAdmin && (
        <button
          className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm"
          style={{ background: 'var(--primary-color)', border: 'none' }}
          onClick={handleAddNew}
        >
          + Thêm phòng mới
        </button>
        )}
      </div>

      {loadError && (
        <div className="alert alert-warning border-0 shadow-sm mb-4" role="alert">
          {loadError}
        </div>
      )}

      <div className="card-table">
        <div className="p-4 border-bottom d-flex flex-wrap align-items-end gap-3">
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: '12px', maxWidth: '320px' }}
            placeholder="Tìm số phòng..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="form-select"
            style={{ borderRadius: '12px', maxWidth: '220px' }}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {FILTER_STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="room-availability-from" style={{ minWidth: '220px' }}>
            <label className="form-label small fw-bold text-uppercase text-muted">Trá»‘ng tá»«</label>
            <input
              type="datetime-local"
              className="form-control"
              style={{ borderRadius: '12px' }}
              value={availableFrom}
              onChange={(e) => {
                setAvailableFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="room-availability-to" style={{ minWidth: '220px' }}>
            <label className="form-label small fw-bold text-uppercase text-muted">Äáº¿n</label>
            <input
              type="datetime-local"
              className="form-control"
              style={{ borderRadius: '12px' }}
              value={availableTo}
              onChange={(e) => {
                setAvailableTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(availableFrom || availableTo) && (
            <button
              type="button"
              className="btn btn-light border rounded-3 px-3 room-clear-filter"
              onClick={() => {
                setAvailableFrom('');
                setAvailableTo('');
                setPage(1);
              }}
            >
              XÃ³a lá»c lá»‹ch
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Số phòng</th>
                <th>Loại phòng</th>
                <th>Giá</th>
                <th>Đồ đi kèm</th>
                <th>Trạng thái</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">Đang tải danh sách phòng...</td>
                </tr>
              ) : data.rooms?.length > 0 ? data.rooms.map((room) => {
                const effectiveStatus = room.effectiveStatus || room.status || 'available';
                const effectiveStatusMeta = ROOM_STATUS_META[effectiveStatus] || ROOM_STATUS_META.available;
                const itemCount = Number(room.roomType?.itemCount ?? room.roomType?.items?.length ?? 0);
                const relatedBookingId = room.relatedBookingId;

                return (
                  <tr key={room.id}>
                    <td>{room.id}</td>
                    <td className="fw-bold text-primary">{room.roomNumber}</td>
                    <td>
                      <div className="fw-bold">{room.roomType?.typeName || 'Chưa gán loại phòng'}</div>
                      <small className="text-muted">
                        {room.roomType?.capacity ? `${room.roomType.capacity} khách` : 'Chưa cập nhật sức chứa'}
                      </small>
                    </td>
                    <td className="fw-bold">
                      {Number(room.roomType?.pricePerNight || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border rounded-pill">
                        {itemCount} món
                      </span>
                    </td>
                    <td>
                      <div className={`room-status-badge ${effectiveStatusMeta.className}`}>
                        {effectiveStatusMeta.label}
                      </div>
                      {effectiveStatus === 'reserved' && relatedBookingId && (
                        <div className="room-status-detail">
                          {relatedBookingId && (
                            <Link
                              className="room-booking-link"
                              to={`/admin/bookings?bookingId=${relatedBookingId}`}
                              title={`Xem booking #${relatedBookingId}`}
                            >
                              Xem đơn
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn-action btn-edit me-1"
                        title="Sửa phòng"
                        onClick={() => handleEdit(room)}
                      >
                        ✎
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-action btn-delete"
                          title="Xóa phòng"
                          disabled={deletingId === room.id}
                          onClick={() => handleDelete(room)}
                        >
                          {deletingId === room.id ? '…' : '🗑'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    Không tìm thấy phòng nào khớp bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div className="p-4 d-flex justify-content-between align-items-center border-top">
            <div className="text-muted small">
              Hiển thị trang <span>{data.currentPage}</span> / <span>{data.totalPages}</span>
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((prev) => prev - 1)}>‹</button>
                </li>
                {[...Array(data.totalPages)].map((_, index) => (
                  <li key={index + 1} className={`page-item ${index + 1 === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(index + 1)}>{index + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= data.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((prev) => prev + 1)}>›</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">{formData.id ? `Cập nhật phòng ${formData.roomNumber}` : 'Thêm phòng mới'}</h5>
                  <p className="text-muted small mb-0">Điền đầy đủ số phòng, loại phòng và trạng thái khai thác.</p>
                </div>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Số phòng</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="VD: BT101"
                        value={formData.roomNumber}
                        maxLength={10}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          roomNumber: e.target.value.toUpperCase(),
                        }))}
                        disabled={!isAdmin}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Loại phòng</label>
                      <select
                        className="form-select rounded-3"
                        value={formData.typeId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, typeId: e.target.value }))}
                        disabled={!isAdmin}
                        required
                      >
                        <option value="">-- Chọn loại phòng --</option>
                        {types.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.typeName} - {Number(type.pricePerNight || 0).toLocaleString('vi-VN')}đ
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Trạng thái khai thác</label>
                      <select
                        className="form-select rounded-3"
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        {EDITABLE_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="room-form-note p-3 mt-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div>
                        <div className="text-muted small text-uppercase fw-bold">
                          {formData.id ? 'Trạng thái đang hiển thị' : 'Trạng thái dự kiến'}
                        </div>
                        <div className={`room-status-badge mt-2 ${(ROOM_STATUS_META[previewStatus] || ROOM_STATUS_META.available).className}`}>
                          {(ROOM_STATUS_META[previewStatus] || ROOM_STATUS_META.available).label}
                        </div>
                        <div className="small text-muted mt-2">
                          {(ROOM_STATUS_META[previewStatus] || ROOM_STATUS_META.available).description}
                        </div>
                      </div>
                      {selectedType && (
                        <div className="text-md-end">
                          <div className="fw-bold">{selectedType.typeName}</div>
                          <div className="small text-muted mt-1">
                            Giá: {Number(selectedType.pricePerNight || 0).toLocaleString('vi-VN')}đ
                          </div>
                          <div className="small text-muted">
                            Sức chứa: {selectedType.capacity || 0} khách
                          </div>
                          <div className="small text-muted">
                            Tiện ích: {selectedType.itemCount ?? selectedType.items?.length ?? 0} món
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-grid mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary py-3 rounded-3 fw-bold"
                      style={{ background: 'var(--primary-color)', border: 'none' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Đang lưu...' : (isAdmin ? 'Lưu thông tin phòng' : 'Lưu trạng thái phòng')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
