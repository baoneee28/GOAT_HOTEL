import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../../config';
import { useAuth } from '../../auth/useAuth';

const Swal = window.Swal;

const EMPTY_FORM = {
  id: '',
  code: '',
  name: '',
  description: '',
  discountType: 'FIXED',
  targetEvent: 'DEFAULT',
  discountValue: '',
  minOrderValue: '',
  maxDiscountAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  usedCount: 0,
  isActive: true,
};

const HOLDER_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'available', label: 'Còn hạn' },
  { id: 'reserved', label: 'Giữ chỗ' },
  { id: 'used', label: 'Đã dùng' },
  { id: 'expired', label: 'Hết hạn' },
];

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

function getHolderStatusMeta(status) {
  switch (String(status || '').toLowerCase()) {
    case 'used':
      return { label: 'Đã dùng', className: 'bg-secondary-subtle text-secondary-emphasis' };
    case 'reserved':
      return { label: 'Đang giữ chỗ', className: 'bg-info-subtle text-info-emphasis' };
    case 'expired':
      return { label: 'Hết hạn', className: 'bg-danger-subtle text-danger-emphasis' };
    default:
      return { label: 'Còn hạn', className: 'bg-success-subtle text-success-emphasis' };
  }
}

export default function AdminCoupons() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ coupons: [], totalPages: 1, currentPage: 1 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCouponForAssign, setSelectedCouponForAssign] = useState(null);
  const [assignQuery, setAssignQuery] = useState('');
  const [assignUsers, setAssignUsers] = useState([]);
  const [loadingAssignUsers, setLoadingAssignUsers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ userIds: [], expiresAt: '', note: '' });

  const [showHoldersModal, setShowHoldersModal] = useState(false);
  const [selectedCouponForHolders, setSelectedCouponForHolders] = useState(null);
  const [holdersStatus, setHoldersStatus] = useState('all');
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersData, setHoldersData] = useState({ coupon: null, holders: [], summary: {} });
  const [expandedGroups, setExpandedGroups] = useState({ DEFAULT: true, ON_REVIEW: true, WEEKEND: true, OTHER: true });
  const [eventTypes, setEventTypes] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({ label: '', eventKey: '', icon: 'category', color: '#6b7280' });
  const [savingEvent, setSavingEvent] = useState(false);

  const fetchEventTypes = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/coupon-events`, { withCredentials: true });
      if (res.data.success) {
        setEventTypes(res.data.events);
        const newExpanded = { ...expandedGroups };
        res.data.events.forEach(e => {
          if (newExpanded[e.eventKey] === undefined) newExpanded[e.eventKey] = true;
        });
        setExpandedGroups(newExpanded);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

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
    fetchEventTypes();
  }, [fetchData, fetchEventTypes]);

  useEffect(() => {
    if (!showAssignModal) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingAssignUsers(true);
      try {
        const res = await axios.get(`${API_BASE}/api/admin/coupons/users/search`, {
          params: { q: assignQuery },
          withCredentials: true,
        });

        if (!active) {
          return;
        }

        setAssignUsers(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (error) {
        console.error(error);
        if (active) {
          setAssignUsers([]);
        }
      } finally {
        if (active) {
          setLoadingAssignUsers(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [assignQuery, showAssignModal]);

  useEffect(() => {
    if (!showHoldersModal || !selectedCouponForHolders?.id) {
      return undefined;
    }

    let active = true;

    const fetchHolders = async () => {
      setHoldersLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/admin/coupons/${selectedCouponForHolders.id}/holders`, {
          params: { status: holdersStatus },
          withCredentials: true,
        });

        if (!active) {
          return;
        }

        setHoldersData({
          coupon: res.data?.coupon || selectedCouponForHolders,
          holders: Array.isArray(res.data?.holders) ? res.data.holders : [],
          summary: res.data?.summary || {},
        });
      } catch (error) {
        console.error(error);
        if (active) {
          setHoldersData({ coupon: selectedCouponForHolders, holders: [], summary: {} });
          Swal?.fire('Không thể tải danh sách người giữ coupon', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
        }
      } finally {
        if (active) {
          setHoldersLoading(false);
        }
      }
    };

    fetchHolders();

    return () => {
      active = false;
    };
  }, [holdersStatus, selectedCouponForHolders, showHoldersModal]);

  const closeModal = () => {
    setShowModal(false);
    setSaving(false);
    setFormData(EMPTY_FORM);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedCouponForAssign(null);
    setAssignQuery('');
    setAssignUsers([]);
    setLoadingAssignUsers(false);
    setAssigning(false);
    setAssignmentForm({ userIds: [], expiresAt: '', note: '' });
  };

  const closeHoldersModal = () => {
    setShowHoldersModal(false);
    setSelectedCouponForHolders(null);
    setHoldersStatus('all');
    setHoldersLoading(false);
    setHoldersData({ coupon: null, holders: [], summary: {} });
  };

  const handleAddNew = () => {
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const handleOpenAssignModal = (coupon) => {
    setSelectedCouponForAssign(coupon);
    setAssignmentForm({
      userIds: [],
      expiresAt: toDateTimeLocalInput(coupon.endDate),
      note: '',
    });
    setAssignQuery('');
    setAssignUsers([]);
    setShowAssignModal(true);
  };

  const handleOpenHoldersModal = (coupon) => {
    setSelectedCouponForHolders(coupon);
    setHoldersStatus('all');
    setHoldersData({ coupon, holders: [], summary: {} });
    setShowHoldersModal(true);
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
        targetEvent: coupon.targetEvent || 'DEFAULT',
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
          { withCredentials: true },
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

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/coupon-events`, eventFormData, { withCredentials: true });
      if (res.data.success) {
        Swal?.fire('Thành công', res.data.message, 'success');
        setShowEventModal(false);
        fetchEventTypes();
      }
    } catch (error) {
      Swal?.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    const result = await Swal?.fire({
      title: 'Xóa nhóm?',
      text: 'Bạn có chắc muốn xóa nhóm sự kiện này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });
    if (result?.isConfirmed) {
      try {
        const res = await axios.delete(`${API_BASE}/api/admin/coupon-events/${id}`, { withCredentials: true });
        if (res.data.success) {
          Swal?.fire('Đã xóa', res.data.message, 'success');
          fetchEventTypes();
        }
      } catch (error) {
        Swal?.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
      }
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      discountType: formData.discountType,
      targetEvent: formData.targetEvent || 'DEFAULT',
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

  const handleAssignCoupon = async (event) => {
    event.preventDefault();
    if (!selectedCouponForAssign?.id || !assignmentForm.userIds || assignmentForm.userIds.length === 0) {
      Swal?.fire('Thiếu dữ liệu', 'Vui lòng chọn người dùng cần cấp coupon.', 'warning');
      return;
    }

    setAssigning(true);
    let successCount = 0;
    try {
      // Vì hệ thống chưa hỗ trợ batch API nên gọi tuần tự từng người dùng
      for (const uid of assignmentForm.userIds) {
        await axios.post(
          `${API_BASE}/api/admin/coupons/${selectedCouponForAssign.id}/assignments`,
          {
            userId: String(uid),
            expiresAt: assignmentForm.expiresAt || null,
            note: assignmentForm.note?.trim() || null,
          },
          { withCredentials: true },
        );
        successCount++;
      }

      Swal?.fire({
        icon: 'success',
        title: `Đã cấp coupon cho ${successCount} người dùng`,
        timer: 1500,
        showConfirmButton: false,
      });
      closeAssignModal();
      fetchData();
    } catch (error) {
      console.error(error);
      Swal?.fire('Lỗi cấp tập thể', error.response?.data?.message || 'Một số người dùng bị lỗi trong quá trình cấp.', 'error');
      if (successCount > 0) {
        closeAssignModal();
        fetchData();
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Quản lý mã giảm giá</h2>
          <p className="text-muted mb-0">
            Coupon được nhóm theo mục đích phát hành. Bấm <strong>+</strong> bên cạnh mỗi nhóm để thêm coupon. Admin có thể tạo nhóm mới.
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-outline-primary px-4 py-2 rounded-3 fw-bold mt-2 mt-md-0"
            onClick={() => { setEventFormData({ label: '', eventKey: '', icon: 'category', color: '#6b7280' }); setShowEventModal(true); }}
          >
            + Tạo nhóm sự kiện
          </button>
        )}
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

        {loading ? (
          <div className="text-center py-5 text-muted">Đang tải danh sách coupon...</div>
        ) : (() => {
          const EVENT_GROUPS = eventTypes.length > 0 ? eventTypes.map(e => ({
            id: e.id,
            key: e.eventKey,
            label: e.label,
            icon: e.icon,
            color: e.color,
            isSystem: e.isSystem
          })) : [
            { key: 'DEFAULT', label: 'Mặc định (Cấp thủ công)', icon: 'loyalty', color: '#6b7280', isSystem: true },
            { key: 'ON_REVIEW', label: 'Tự động tặng sau Review', icon: 'reviews', color: '#f59e0b', isSystem: true },
            { key: 'WEEKEND', label: 'Khuyến mãi Cuối tuần', icon: 'weekend', color: '#3b82f6', isSystem: true }
          ];
          const grouped = {};
          EVENT_GROUPS.forEach(g => { grouped[g.key] = []; });
          (data.coupons || []).forEach(c => {
            const key = c.targetEvent || 'DEFAULT';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(c);
          });
          return EVENT_GROUPS.map((group) => {
            const items = grouped[group.key] || [];
            return (
              <div key={group.key} className="border-bottom">
                <div
                  className="d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ background: expandedGroups[group.key] ? 'rgba(0,0,0,0.03)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="material-symbols-outlined" style={{ color: group.color, fontSize: '22px' }}>{group.icon}</span>
                    <div>
                      <span className="fw-bold">{group.label}</span>
                      <span className="text-muted ms-2 small">({items.length} coupon)</span>
                    </div>
                    <span className="material-symbols-outlined text-muted" style={{ fontSize: '18px', transition: 'transform 0.2s', transform: expandedGroups[group.key] ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                  </div>
                  {isAdmin && !group.isSystem && (
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{ width: '32px', height: '32px', padding: 0, flexShrink: 0 }}
                      title="Xóa nhóm này"
                      onClick={(e) => { e.stopPropagation(); handleDeleteEvent(group.id); }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', padding: 0, flexShrink: 0 }}
                      title={`Thêm coupon vào "${group.label}"`}
                      onClick={(e) => { e.stopPropagation(); setFormData({ ...EMPTY_FORM, targetEvent: group.key }); setShowModal(true); }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    </button>
                  )}
                </div>
                {expandedGroups[group.key] && (
                  <div>
                    {items.length > 0 ? (
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
                            {items.map((coupon) => {
                              const statusBadge = getCouponStatus(coupon);
                              const isPercent = coupon.discountType === 'PERCENT';
                              return (
                                <tr key={coupon.id}>
                                  <td className="coupon-col-code"><div className="coupon-code-text">{coupon.code}</div></td>
                                  <td className="coupon-col-offer">
                                    <div className="coupon-offer-title">{coupon.name}</div>
                                    <div className="coupon-offer-description">{coupon.description || 'Không có mô tả'}</div>
                                  </td>
                                  <td className="coupon-col-value">
                                    <div className="coupon-value-main">{isPercent ? `${Number(coupon.discountValue || 0)}%` : formatCurrency(coupon.discountValue)}</div>
                                    <div className="coupon-value-sub">{isPercent && coupon.maxDiscountAmount ? `Tối đa ${formatCurrency(coupon.maxDiscountAmount)}` : 'Không giới hạn mức trần'}</div>
                                  </td>
                                  <td className="coupon-col-condition">
                                    <div className="coupon-meta-line"><span className="coupon-meta-label">Đơn tối thiểu:</span> <strong>{formatCurrency(coupon.minOrderValue)}</strong></div>
                                    <div className="coupon-meta-line coupon-meta-sub"><span className="coupon-meta-label">Limit:</span> <span>{coupon.usageLimit || 'Không giới hạn'}</span></div>
                                  </td>
                                  <td className="coupon-col-validity">
                                    <div className="coupon-meta-line"><span className="coupon-meta-label">Từ:</span> <span>{formatCompactDateTime(coupon.startDate)}</span></div>
                                    <div className="coupon-meta-line coupon-meta-sub"><span className="coupon-meta-label">Đến:</span> <span>{formatCompactDateTime(coupon.endDate)}</span></div>
                                  </td>
                                  <td className="coupon-col-usage">
                                    <div className="coupon-usage-main">{coupon.usedCount || 0}</div>
                                    <div className="coupon-usage-sub">/{coupon.usageLimit || '∞'} lượt</div>
                                    <div className="coupon-usage-sub mt-1">Đã phát: {coupon.assignedCount || 0} • Còn hạn: {coupon.availableAssignedCount || 0}</div>
                                  </td>
                                  <td className="coupon-col-status"><span className={`badge rounded-pill coupon-status-badge ${statusBadge.className}`}>{statusBadge.label}</span></td>
                                  <td className="coupon-col-actions text-end">
                                    <button className="btn btn-sm btn-light coupon-action-btn text-info me-1" onClick={() => handleOpenHoldersModal(coupon)} title="Xem người đang giữ">DS</button>
                                    <button className="btn btn-sm btn-light coupon-action-btn text-success me-1" onClick={() => handleOpenAssignModal(coupon)} title="Cấp coupon cá nhân">Cấp</button>
                                    {isAdmin && (
                                      <>
                                        <button className="btn btn-sm btn-light coupon-action-btn text-primary me-1" onClick={() => handleEdit(coupon.id)}>Sửa</button>
                                        <button className={`btn btn-sm coupon-action-btn me-1 ${coupon.isActive ? 'btn-light text-warning' : 'btn-light text-success'}`} onClick={() => handleToggleActive(coupon)}>{coupon.isActive ? 'Tắt' : 'Bật'}</button>
                                        <button className="btn btn-sm btn-light coupon-action-btn text-danger" onClick={() => handleDelete(coupon)}>Xóa</button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted small">Chưa có coupon nào trong nhóm này.</div>
                    )}
                  </div>
                )}
              </div>
            );
          });
        })()}

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

      {showModal && isAdmin && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">{formData.id ? 'Cập nhật coupon' : 'Tạo coupon mới'}</h5>
                  <small className="text-muted">Coupon mẫu dùng để staff/admin phát cho từng user cụ thể.</small>
                </div>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Mã coupon</label>
                      <input type="text" className="form-control rounded-3" value={formData.code} disabled={Boolean(formData.id) && Number(formData.usedCount || 0) > 0} onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value.toUpperCase().replace(/\s+/g, '') }))} placeholder="VD: GOAT50" required />
                      {Boolean(formData.id) && Number(formData.usedCount || 0) > 0 && (
                        <div className="form-text">Coupon đã có lượt sử dụng nên hệ thống khóa chỉnh sửa code để giữ dữ liệu booking an toàn.</div>
                      )}
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-bold">Tên ưu đãi</label>
                      <input type="text" className="form-control rounded-3" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} placeholder="VD: Ưu đãi chào kỳ nghỉ mới" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Mô tả ngắn</label>
                      <textarea className="form-control rounded-3" rows="3" value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} placeholder="Mô tả ngắn gọn ưu đãi dành cho booking phòng." />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Loại giảm</label>
                      <select className="form-select rounded-3" value={formData.discountType} onChange={(event) => setFormData((prev) => ({ ...prev, discountType: event.target.value, maxDiscountAmount: event.target.value === 'PERCENT' ? prev.maxDiscountAmount : '' }))}>
                        <option value="FIXED">Giảm cố định</option>
                        <option value="PERCENT">Giảm phần trăm</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Sự kiện kích hoạt</label>
                      <select className="form-select rounded-3" value={formData.targetEvent || 'DEFAULT'} onChange={(event) => setFormData((prev) => ({ ...prev, targetEvent: event.target.value }))}>
                        {eventTypes.map(e => <option key={e.eventKey} value={e.eventKey}>{e.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giá trị giảm</label>
                      <input type="number" min="0" step={formData.discountType === 'PERCENT' ? '0.01' : '1000'} className="form-control rounded-3" value={formData.discountValue} onChange={(event) => setFormData((prev) => ({ ...prev, discountValue: event.target.value }))} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Đơn tối thiểu</label>
                      <input type="number" min="0" step="1000" className="form-control rounded-3" value={formData.minOrderValue} onChange={(event) => setFormData((prev) => ({ ...prev, minOrderValue: event.target.value }))} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giảm tối đa</label>
                      <input type="number" min="0" step="1000" className="form-control rounded-3" value={formData.maxDiscountAmount} onChange={(event) => setFormData((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))} placeholder={formData.discountType === 'PERCENT' ? 'Ví dụ 150000' : 'Không áp dụng với FIXED'} disabled={formData.discountType !== 'PERCENT'} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Giới hạn sử dụng</label>
                      <input type="number" min="0" step="1" className="form-control rounded-3" value={formData.usageLimit} onChange={(event) => setFormData((prev) => ({ ...prev, usageLimit: event.target.value }))} placeholder="Để trống nếu không giới hạn" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Đã dùng</label>
                      <input type="text" className="form-control rounded-3 bg-light" value={formData.usedCount} readOnly />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Bắt đầu áp dụng</label>
                      <input type="datetime-local" className="form-control rounded-3" value={formData.startDate} onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Kết thúc áp dụng</label>
                      <input type="datetime-local" className="form-control rounded-3" value={formData.endDate} onChange={(event) => setFormData((prev) => ({ ...prev, endDate: event.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" role="switch" id="coupon-active-switch" checked={formData.isActive} onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))} />
                        <label className="form-check-label fw-bold" htmlFor="coupon-active-switch">Bật coupon ngay sau khi lưu</label>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn btn-primary w-100 py-3 fw-bold mt-4" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>
                    {saving ? 'Đang lưu...' : 'Lưu coupon'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedCouponForAssign && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">Cấp coupon cá nhân</h5>
                  <small className="text-muted">Mẫu coupon: <strong>{selectedCouponForAssign.code}</strong> - {selectedCouponForAssign.name}</small>
                </div>
                <button type="button" className="btn-close" onClick={closeAssignModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleAssignCoupon}>
                  <div className="mb-3 d-flex justify-content-between align-items-end">
                    <div className="flex-grow-1 me-3">
                      <label className="form-label fw-bold">Tìm người dùng</label>
                      <input type="text" className="form-control rounded-3" placeholder="Nhập tên, email hoặc số điện thoại..." value={assignQuery} onChange={(event) => setAssignQuery(event.target.value)} />
                    </div>
                    <div>
                      {assignUsers.length > 0 && (
                        <button type="button" className="btn btn-outline-secondary rounded-3 px-3 py-2 fw-bold text-nowrap" onClick={() => {
                          setAssignmentForm(prev => {
                            // Check if all current users are already selected
                            const allSelected = prev.userIds.length >= assignUsers.length && assignUsers.every(u => prev.userIds.includes(String(u.id)));
                            if (allSelected) {
                              // Deselect current visible matching
                              const visibleIds = assignUsers.map(u => String(u.id));
                              return { ...prev, userIds: prev.userIds.filter(id => !visibleIds.includes(id)) };
                            } else {
                              // Select all visible matching
                              const newIds = new Set([...prev.userIds, ...assignUsers.map(u => String(u.id))]);
                              return { ...prev, userIds: Array.from(newIds) };
                            }
                          });
                        }}>
                          {assignmentForm.userIds.length >= assignUsers.length && assignUsers.every(u => assignmentForm.userIds.includes(String(u.id))) && assignUsers.length > 0 ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-4 p-3 mb-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    {loadingAssignUsers ? (
                      <div className="text-muted small">Đang tải danh sách người dùng...</div>
                    ) : assignUsers.length > 0 ? assignUsers.map((user) => {
                      const isSelected = assignmentForm.userIds.includes(String(user.id));
                      return (
                        <button key={user.id} type="button" onClick={() => setAssignmentForm((prev) => ({ ...prev, userIds: isSelected ? prev.userIds.filter(id => id !== String(user.id)) : [...prev.userIds, String(user.id)] }))} className={`w-100 text-start border rounded-3 px-3 py-3 mb-2 ${isSelected ? 'border-primary bg-primary-subtle' : 'border-light bg-white'}`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold">{user.fullName}</div>
                              <div className="small text-muted">{user.email}</div>
                              <div className="small text-muted">{user.phone || 'Chưa có số điện thoại'} • {user.role}</div>
                            </div>
                            {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="text-muted small">Không tìm thấy người dùng phù hợp.</div>
                    )}
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Hạn dùng riêng</label>
                      <input type="datetime-local" className="form-control rounded-3" value={assignmentForm.expiresAt} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, expiresAt: event.target.value }))} />
                      <div className="form-text">Nếu chọn muộn hơn hạn coupon mẫu, backend sẽ tự chặn ở mốc hợp lệ gần nhất.</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Ghi chú</label>
                      <input type="text" className="form-control rounded-3" value={assignmentForm.note} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="VD: Quà chăm sóc khách hàng" />
                    </div>
                  </div>
                  <button type="submit" disabled={assigning || assignmentForm.userIds.length === 0} className="btn btn-primary w-100 py-3 fw-bold mt-4" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>
                    {assigning ? 'Đang cấp coupon...' : `Xác nhận cấp cho ${assignmentForm.userIds.length} người`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHoldersModal && selectedCouponForHolders && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">Người đang giữ coupon</h5>
                  <small className="text-muted">Mẫu coupon: <strong>{holdersData.coupon?.code || selectedCouponForHolders.code}</strong> - {holdersData.coupon?.name || selectedCouponForHolders.name}</small>
                </div>
                <button type="button" className="btn-close" onClick={closeHoldersModal}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {HOLDER_FILTERS.map((filter) => (
                    <button key={filter.id} type="button" onClick={() => setHoldersStatus(filter.id)} className={`btn btn-sm ${holdersStatus === filter.id ? 'btn-dark' : 'btn-light'}`}>
                      {filter.label} ({holdersData.summary?.[filter.id] ?? holdersData.summary?.all ?? 0})
                    </button>
                  ))}
                </div>
                {holdersLoading ? (
                  <div className="text-center py-5 text-muted">Đang tải danh sách người giữ coupon...</div>
                ) : holdersData.holders.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Trạng thái</th>
                          <th>Được cấp lúc</th>
                          <th>Hạn dùng</th>
                          <th>Booking</th>
                          <th>Nguồn</th>
                          <th>Người cấp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdersData.holders.map((holder) => {
                          const statusMeta = getHolderStatusMeta(holder.status);
                          return (
                            <tr key={holder.id}>
                              <td>
                                <div className="fw-bold">{holder.user?.fullName || 'Người dùng không xác định'}</div>
                                <div className="small text-muted">{holder.user?.email}</div>
                                <div className="small text-muted">{holder.user?.phone || 'Chưa có số điện thoại'}</div>
                              </td>
                              <td><span className={`badge rounded-pill ${statusMeta.className}`}>{statusMeta.label}</span></td>
                              <td>{formatCompactDateTime(holder.assignedAt)}</td>
                              <td>{formatCompactDateTime(holder.expiresAt)}</td>
                              <td>{holder.bookingId ? `#${holder.bookingId}` : 'Chưa gắn booking'}</td>
                              <td>
                                <div className="text-capitalize">{holder.source || 'manual'}</div>
                                {holder.note && <div className="small text-muted">{holder.note}</div>}
                              </td>
                              <td>
                                {holder.assignedBy ? (
                                  <>
                                    <div className="fw-semibold">{holder.assignedBy.fullName}</div>
                                    <div className="small text-muted">{holder.assignedBy.email}</div>
                                  </>
                                ) : (
                                  <span className="text-muted">Hệ thống</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">Chưa có người dùng nào giữ coupon này ở bộ lọc hiện tại.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEventModal && isAdmin && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <h5 className="fw-bold mb-1">Tạo nhóm sự kiện mới</h5>
                <button type="button" className="btn-close" onClick={() => setShowEventModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSaveEvent}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Tên nhóm</label>
                    <input type="text" className="form-control rounded-3" value={eventFormData.label} onChange={e => setEventFormData(prev => ({...prev, label: e.target.value}))} placeholder="VD: Khuyến mãi Hè" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mã nhóm (Event Key)</label>
                    <input type="text" className="form-control rounded-3" value={eventFormData.eventKey} onChange={e => setEventFormData(prev => ({...prev, eventKey: e.target.value}))} placeholder="VD: SUMMER_PROMO (để trống tự tạo)" />
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <label className="form-label fw-bold">Tên Icon (Material)</label>
                      <input type="text" className="form-control rounded-3" value={eventFormData.icon} onChange={e => setEventFormData(prev => ({...prev, icon: e.target.value}))} placeholder="VD: star" required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Màu sắc hex</label>
                      <input type="color" className="form-control rounded-3" style={{height: '42px'}} value={eventFormData.color} onChange={e => setEventFormData(prev => ({...prev, color: e.target.value}))} required />
                    </div>
                  </div>
                  <button type="submit" disabled={savingEvent} className="btn btn-primary w-100 py-2 fw-bold" style={{ borderRadius: '12px' }}>
                    {savingEvent ? 'Đang lưu...' : 'Lưu nhóm'}
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

