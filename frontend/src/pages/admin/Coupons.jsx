import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

const Swal = window.Swal;

const EMPTY_FORM = {
  id: '',
  code: '',
  name: '',
  description: '',
  discountType: 'FIXED',
  discountValue: '',
  minOrderValue: '',
  maxDiscountAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  usedCount: 0,
  isActive: true,
};

function parseDateValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const parsed = new Date(year, (month || 1) - 1, day || 1, hour, minute, second);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocalInput(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';

  return `${parsed.getFullYear()}-${padNumber(parsed.getMonth() + 1)}-${padNumber(parsed.getDate())}T${padNumber(parsed.getHours())}:${padNumber(parsed.getMinutes())}`;
}

function formatCompactDateTime(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return 'Chưa cập nhật';

  return `${padNumber(parsed.getHours())}:${padNumber(parsed.getMinutes())} ${padNumber(parsed.getDate())}/${padNumber(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function getCouponStatus(coupon) {
  const now = new Date();
  const startDate = parseDateValue(coupon.startDate);
  const endDate = parseDateValue(coupon.endDate);
  const usageLimit = Number(coupon.usageLimit || 0);
  const usedCount = Number(coupon.usedCount || 0);

  if (!coupon.isActive) {
    return { label: 'Tạm tắt', className: 'bg-secondary-subtle text-secondary-emphasis' };
  }
  if (usageLimit > 0 && usedCount >= usageLimit) {
    return { label: 'Hết lượt', className: 'bg-danger-subtle text-danger-emphasis' };
  }
  if (endDate && endDate < now) {
    return { label: 'Hết hạn', className: 'bg-danger-subtle text-danger-emphasis' };
  }
  if (startDate && startDate > now) {
    return { label: 'Chưa bắt đầu', className: 'bg-warning-subtle text-warning-emphasis' };
  }
  return { label: 'Đang áp dụng', className: 'bg-success-subtle text-success-emphasis' };
}

export default function AdminCoupons() {
  const [data, setData] = useState({ coupons: [], totalPages: 1, currentPage: 1 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/coupons`, {
        params: { q, status, page },
        withCredentials: true,
      });
      setData(res.data);
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message
        || (error.response?.status === 403
          ? 'Bạn không có quyền truy cập danh sách coupon quản trị.'
          : 'Vui lòng thử lại sau.');
      Swal?.fire('Không tải được dữ liệu', message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeModal = () => {
    setShowModal(false);
    setSaving(false);
    setFormData(EMPTY_FORM);
  };

  const handleAddNew = () => {
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/coupons/${id}`, { withCredentials: true });
      const coupon = res.data.coupon;
      setFormData({
        id: coupon.id,
        code: coupon.code || '',
        name: coupon.name || '',
        description: coupon.description || '',
        discountType: coupon.discountType || 'FIXED',
        discountValue: coupon.discountValue ?? '',
        minOrderValue: coupon.minOrderValue ?? '',
        maxDiscountAmount: coupon.maxDiscountAmount ?? '',
        startDate: toDateTimeLocalInput(coupon.startDate),
        endDate: toDateTimeLocalInput(coupon.endDate),
        usageLimit: coupon.usageLimit ?? '',
        usedCount: coupon.usedCount ?? 0,
        isActive: Boolean(coupon.isActive),
      });
      setShowModal(true);
    } catch (error) {
      console.error(error);
      Swal?.fire('Không thể tải coupon', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    }
  };

  const handleDelete = (coupon) => {
    Swal?.fire({
      title: 'Xóa mã giảm giá?',
      text: `Mã ${coupon.code} sẽ bị xóa khỏi hệ thống.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await axios.delete(`${API_BASE}/api/admin/coupons/${coupon.id}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          Swal?.fire({ icon: 'success', title: 'Đã xóa', timer: 1400, showConfirmButton: false });
          fetchData();
        }
      } catch (error) {
        console.error(error);
        Swal?.fire('Không thể xóa', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
      }
    });
  };

  const handleToggleActive = (coupon) => {
    const nextAction = coupon.isActive ? 'tắt' : 'bật';
    Swal?.fire({
      title: `${nextAction === 'tắt' ? 'Tắt' : 'Bật'} coupon?`,
      text: `Bạn sắp ${nextAction} mã ${coupon.code}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await axios.patch(
          `${API_BASE}/api/admin/coupons/${coupon.id}/toggle-active`,
          {},
          { withCredentials: true }
        );
        if (res.data.success) {
          Swal?.fire({ icon: 'success', title: res.data.message, timer: 1400, showConfirmButton: false });
          fetchData();
        }
      } catch (error) {
        console.error(error);
        Swal?.fire('Không thể cập nhật', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
      }
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue || 0),
      maxDiscountAmount:
        formData.discountType === 'PERCENT' && formData.maxDiscountAmount !== ''
          ? Number(formData.maxDiscountAmount)
          : null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
      isActive: Boolean(formData.isActive),
    };

    try {
      const request = formData.id
        ? axios.put(`${API_BASE}/api/admin/coupons/${formData.id}`, payload, { withCredentials: true })
        : axios.post(`${API_BASE}/api/admin/coupons`, payload, { withCredentials: true });

      const res = await request;
      if (res.data.success) {
        Swal?.fire({
          icon: 'success',
          title: formData.id ? 'Cập nhật thành công' : 'Tạo coupon thành công',
          timer: 1400,
          showConfirmButton: false,
        });
        closeModal();
        fetchData();
      }
    } catch (error) {
      console.error(error);
      Swal?.fire('Không thể lưu coupon', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý mã giảm giá</h2>
          <p className="text-muted mb-0">Coupon chỉ áp dụng cho flow booking phòng khách sạn.</p>
        </div>
        <button
          className="btn btn-primary px-4 py-2 rounded-3 fw-bold"
          style={{ background: 'var(--primary-color)', border: 'none' }}
          onClick={handleAddNew}
        >
          + Thêm coupon
        </button>
      </div>

      <div className="card-table">
        <div className="p-4 border-bottom">
          <div className="row g-3">
            <div className="col-lg-6">
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Tìm theo code, tên ưu đãi hoặc mô tả..."
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="col-lg-3">
              <select
                className="form-select rounded-3"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang áp dụng</option>
                <option value="inactive">Tạm tắt</option>
                <option value="expired">Hết hạn</option>
                <option value="scheduled">Chưa bắt đầu</option>
              </select>
            </div>
            <div className="col-lg-3 d-flex align-items-center">
              <span className="text-muted small">
                Tổng hiển thị: <strong>{data.coupons?.length || 0}</strong> coupon ở trang hiện tại
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table coupon-admin-table mb-0">
            <thead>
              <tr>
                <th className="coupon-col-code">Mã</th>
                <th className="coupon-col-offer">Ưu đãi</th>
                <th className="coupon-col-value">Giá trị</th>
                <th className="coupon-col-condition">Điều kiện</th>
                <th className="coupon-col-validity">Hiệu lực</th>
                <th className="coupon-col-usage">Sử dụng</th>
                <th className="coupon-col-status">Trạng thái</th>
                <th className="coupon-col-actions text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">Đang tải danh sách coupon...</td>
                </tr>
              ) : data.coupons?.length > 0 ? data.coupons.map((coupon) => {
                const statusBadge = getCouponStatus(coupon);
                const isPercent = coupon.discountType === 'PERCENT';

                return (
                  <tr key={coupon.id}>
                    <td className="coupon-col-code">
                      <div className="coupon-code-text">{coupon.code}</div>
                    </td>
                    <td className="coupon-col-offer">
                      <div className="coupon-offer-title">{coupon.name}</div>
                      <div className="coupon-offer-description">{coupon.description || 'Không có mô tả'}</div>
                    </td>
                    <td className="coupon-col-value">
                      <div className="coupon-value-main">
                        {isPercent ? `${Number(coupon.discountValue || 0)}%` : formatCurrency(coupon.discountValue)}
                      </div>
                      <div className="coupon-value-sub">
                        {isPercent && coupon.maxDiscountAmount
                          ? `Tối đa ${formatCurrency(coupon.maxDiscountAmount)}`
                          : 'Không giới hạn mức trần'}
                      </div>
                    </td>
                    <td className="coupon-col-condition">
                      <div className="coupon-meta-line">
                        <span className="coupon-meta-label">Đơn tối thiểu:</span>
                        <strong>{formatCurrency(coupon.minOrderValue)}</strong>
                      </div>
                      <div className="coupon-meta-line coupon-meta-sub">
                        <span className="coupon-meta-label">Limit:</span>
                        <span>{coupon.usageLimit || 'Không giới hạn'}</span>
                      </div>
                    </td>
                    <td className="coupon-col-validity">
                      <div className="coupon-meta-line">
                        <span className="coupon-meta-label">Từ:</span>
                        <span>{formatCompactDateTime(coupon.startDate)}</span>
                      </div>
                      <div className="coupon-meta-line coupon-meta-sub">
                        <span className="coupon-meta-label">Đến:</span>
                        <span>{formatCompactDateTime(coupon.endDate)}</span>
                      </div>
                    </td>
                    <td className="coupon-col-usage">
                      <div className="coupon-usage-main">{coupon.usedCount || 0}</div>
                      <div className="coupon-usage-sub">/{coupon.usageLimit || '∞'} lượt</div>
                    </td>
                    <td className="coupon-col-status">
                      <span className={`badge rounded-pill coupon-status-badge ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="coupon-col-actions text-end">
                      <button className="btn btn-sm btn-light coupon-action-btn text-primary me-1" onClick={() => handleEdit(coupon.id)}>
                        ✎
                      </button>
                      <button
                        className={`btn btn-sm coupon-action-btn me-1 ${coupon.isActive ? 'btn-light text-warning' : 'btn-light text-success'}`}
                        onClick={() => handleToggleActive(coupon)}
                      >
                        {coupon.isActive ? '⏸' : '▶'}
                      </button>
                      <button className="btn btn-sm btn-light coupon-action-btn text-danger" onClick={() => handleDelete(coupon)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">Chưa có coupon phù hợp bộ lọc hiện tại.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div className="p-4 d-flex justify-content-end border-top">
            <nav>
              <ul className="pagination mb-0">
                {[...Array(data.totalPages)].map((_, index) => (
                  <li key={index + 1} className={`page-item ${index + 1 === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(index + 1)}>
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">{formData.id ? 'Cập nhật coupon' : 'Tạo coupon mới'}</h5>
                  <small className="text-muted">Coupon chỉ dùng cho booking phòng khách sạn.</small>
                </div>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Mã coupon</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={formData.code}
                        disabled={Boolean(formData.id) && Number(formData.usedCount || 0) > 0}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          code: event.target.value.toUpperCase().replace(/\s+/g, ''),
                        }))}
                        placeholder="VD: GOAT50"
                        required
                      />
                      {Boolean(formData.id) && Number(formData.usedCount || 0) > 0 && (
                        <div className="form-text">Coupon đã có lượt sử dụng nên hệ thống khóa chỉnh sửa code để giữ dữ liệu booking an toàn.</div>
                      )}
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-bold">Tên ưu đãi</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={formData.name}
                        onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="VD: Ưu đãi chào kỳ nghỉ mới"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">Mô tả ngắn</label>
                      <textarea
                        className="form-control rounded-3"
                        rows="3"
                        value={formData.description}
                        onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Mô tả ngắn gọn ưu đãi dành cho booking phòng."
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Loại giảm</label>
                      <select
                        className="form-select rounded-3"
                        value={formData.discountType}
                        onChange={(event) => setFormData((prev) => ({
                          ...prev,
                          discountType: event.target.value,
                          maxDiscountAmount: event.target.value === 'PERCENT' ? prev.maxDiscountAmount : '',
                        }))}
                      >
                        <option value="FIXED">Giảm cố định</option>
                        <option value="PERCENT">Giảm phần trăm</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giá trị giảm</label>
                      <input
                        type="number"
                        min="0"
                        step={formData.discountType === 'PERCENT' ? '0.01' : '1000'}
                        className="form-control rounded-3"
                        value={formData.discountValue}
                        onChange={(event) => setFormData((prev) => ({ ...prev, discountValue: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Đơn tối thiểu</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="form-control rounded-3"
                        value={formData.minOrderValue}
                        onChange={(event) => setFormData((prev) => ({ ...prev, minOrderValue: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giảm tối đa</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        className="form-control rounded-3"
                        value={formData.maxDiscountAmount}
                        onChange={(event) => setFormData((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                        placeholder={formData.discountType === 'PERCENT' ? 'Ví dụ 150000' : 'Không áp dụng với FIXED'}
                        disabled={formData.discountType !== 'PERCENT'}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giới hạn sử dụng</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="form-control rounded-3"
                        value={formData.usageLimit}
                        onChange={(event) => setFormData((prev) => ({ ...prev, usageLimit: event.target.value }))}
                        placeholder="Để trống nếu không giới hạn"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Đã dùng</label>
                      <input
                        type="text"
                        className="form-control rounded-3 bg-light"
                        value={formData.usedCount}
                        readOnly
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bắt đầu áp dụng</label>
                      <input
                        type="datetime-local"
                        className="form-control rounded-3"
                        value={formData.startDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Kết thúc áp dụng</label>
                      <input
                        type="datetime-local"
                        className="form-control rounded-3"
                        value={formData.endDate}
                        onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="coupon-active-switch"
                          checked={formData.isActive}
                          onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                        />
                        <label className="form-check-label fw-bold" htmlFor="coupon-active-switch">
                          Bật coupon ngay sau khi lưu
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary w-100 py-3 fw-bold mt-4"
                    style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu coupon'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
