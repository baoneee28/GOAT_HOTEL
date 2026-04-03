import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'new', label: 'Mới' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
];

const STATUS_META = {
  new: { label: 'Mới', badgeClass: 'bg-danger-subtle text-danger-emphasis' },
  in_progress: { label: 'Đang xử lý', badgeClass: 'bg-warning-subtle text-warning-emphasis' },
  resolved: { label: 'Đã xử lý', badgeClass: 'bg-success-subtle text-success-emphasis' },
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

function formatDateTime(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return 'Chưa cập nhật';
  return parsed.toLocaleString('vi-VN', { hour12: false });
}

function buildPreviewText(message) {
  const raw = String(message || '').trim();
  if (!raw) return 'Chưa có nội dung.';
  return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
}

export default function Inbox() {
  const [data, setData] = useState({
    messages: [],
    totalPages: 1,
    currentPage: 1,
    statusSummary: { new: 0, in_progress: 0, resolved: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ status: 'new', adminNote: '' });

  const fetchData = useCallback(async (preferredId = null) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/contact-messages`, {
        params: { q, status, page },
        withCredentials: true,
      });

      const payload = res.data || {};
      const nextMessages = Array.isArray(payload.messages) ? payload.messages : [];

      setData({
        messages: nextMessages,
        totalPages: payload.totalPages || 1,
        currentPage: payload.currentPage || 1,
        statusSummary: payload.statusSummary || { new: 0, in_progress: 0, resolved: 0 },
      });
      setSelectedId((current) => (
        preferredId
        || (nextMessages.some((item) => item.id === current) ? current : nextMessages[0]?.id ?? null)
      ));
    } catch (error) {
      console.error('Fetch contact messages failed:', error);
      setData({
        messages: [],
        totalPages: 1,
        currentPage: 1,
        statusSummary: { new: 0, in_progress: 0, resolved: 0 },
      });
      setSelectedId(null);
      window.Swal?.fire('Không tải được inbox', error.response?.data?.message || 'Vui lòng thử lại sau.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedMessage = useMemo(
    () => data.messages.find((message) => message.id === selectedId) || null,
    [data.messages, selectedId],
  );

  useEffect(() => {
    if (!selectedMessage) {
      setFormData({ status: 'new', adminNote: '' });
      return;
    }

    setFormData({
      status: selectedMessage.status || 'new',
      adminNote: selectedMessage.adminNote || '',
    });
  }, [selectedMessage]);

  const handleSave = async () => {
    if (!selectedMessage) return;

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/admin/contact-messages/${selectedMessage.id}`,
        formData,
        { withCredentials: true },
      );

      if (res.data?.success) {
        window.Swal?.fire({
          icon: 'success',
          title: 'Đã cập nhật liên hệ',
          timer: 1200,
          showConfirmButton: false,
        });
        fetchData(selectedMessage.id);
      }
    } catch (error) {
      console.error('Update contact message failed:', error);
      window.Swal?.fire('Không thể lưu', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .inbox-panel {
          background: white;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.14);
        }
        .inbox-message-card {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          padding: 16px;
          background: #fff;
          cursor: pointer;
          transition: 0.2s ease;
        }
        .inbox-message-card:hover {
          border-color: rgba(99, 102, 241, 0.28);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
        }
        .inbox-message-card.active {
          border-color: rgba(79, 70, 229, 0.38);
          background: linear-gradient(180deg, rgba(238,242,255,0.88) 0%, rgba(255,255,255,1) 100%);
        }
      `}</style>

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="text-uppercase small text-muted fw-bold mb-2">Liên hệ và hỗ trợ</p>
          <h2 className="fw-bold mb-1">Inbox liên hệ</h2>
          <p className="text-muted mb-0">
            Quản lý danh sách tin nhắn từ trang liên hệ, cập nhật trạng thái xử lý và ghi chú nội bộ.
          </p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <section className="inbox-panel h-100">
            <div className="small text-muted text-uppercase fw-bold mb-2">Tin nhắn mới</div>
            <div className="display-5 fw-bold text-danger">{Number(data.statusSummary?.new || 0)}</div>
            <p className="text-muted mt-3 mb-0">Các liên hệ chưa có admin tiếp nhận hoặc cập nhật ghi chú.</p>
          </section>
        </div>
        <div className="col-md-4">
          <section className="inbox-panel h-100">
            <div className="small text-muted text-uppercase fw-bold mb-2">Đang xử lý</div>
            <div className="display-5 fw-bold text-warning">{Number(data.statusSummary?.in_progress || 0)}</div>
            <p className="text-muted mt-3 mb-0">Những liên hệ đã được tiếp nhận và còn đang theo dõi phản hồi.</p>
          </section>
        </div>
        <div className="col-md-4">
          <section className="inbox-panel h-100">
            <div className="small text-muted text-uppercase fw-bold mb-2">Đã xử lý</div>
            <div className="display-5 fw-bold text-success">{Number(data.statusSummary?.resolved || 0)}</div>
            <p className="text-muted mt-3 mb-0">Liên hệ đã chốt xong hoặc đã phản hồi đầy đủ cho khách.</p>
          </section>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-5">
          <section className="inbox-panel h-100">
            <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
              <input
                type="text"
                className="form-control rounded-4"
                style={{ maxWidth: '320px' }}
                placeholder="Tìm theo tên, email hoặc nội dung..."
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
              />
              <select
                className="form-select rounded-4"
                style={{ maxWidth: '220px' }}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : data.messages.length > 0 ? (
              <div className="d-grid gap-3">
                {data.messages.map((message) => {
                  const meta = STATUS_META[message.status] || STATUS_META.new;
                  const fullName = `${message.firstName || ''} ${message.lastName || ''}`.trim();
                  return (
                    <article
                      key={message.id}
                      className={`inbox-message-card ${selectedId === message.id ? 'active' : ''}`}
                      onClick={() => setSelectedId(message.id)}
                    >
                      <div className="d-flex justify-content-between gap-3 align-items-start">
                        <div>
                          <div className="fw-bold text-dark">{fullName || 'Khách chưa cập nhật tên'}</div>
                          <div className="text-muted small">{message.email}</div>
                        </div>
                        <span className={`badge rounded-pill ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="small text-muted mt-3">{buildPreviewText(message.message)}</div>
                      <div className="small text-muted mt-3">{formatDateTime(message.createdAt)}</div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                Chưa có liên hệ nào khớp bộ lọc hiện tại.
              </div>
            )}

            {data.totalPages > 1 && (
              <div className="d-flex justify-content-end mt-4">
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
          </section>
        </div>

        <div className="col-xl-7">
          <section className="inbox-panel h-100">
            {selectedMessage ? (
              <>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                  <div>
                    <div className="small text-muted text-uppercase fw-bold mb-2">Chi tiết liên hệ</div>
                    <h3 className="fw-bold mb-1">
                      {`${selectedMessage.firstName || ''} ${selectedMessage.lastName || ''}`.trim() || 'Khách chưa cập nhật tên'}
                    </h3>
                    <div className="text-muted">{selectedMessage.email}</div>
                  </div>
                  <div className="text-md-end text-muted small">
                    <div>ID #{selectedMessage.id}</div>
                    <div>{formatDateTime(selectedMessage.createdAt)}</div>
                  </div>
                </div>

                <div className="rounded-4 border bg-light-subtle px-4 py-4 mb-4">
                  <div className="small text-muted text-uppercase fw-bold mb-2">Nội dung khách gửi</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.message || 'Không có nội dung.'}</div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-uppercase text-muted">Trạng thái</label>
                    <select
                      className="form-select rounded-4"
                      value={formData.status}
                      onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-uppercase text-muted">Ghi chú nội bộ</label>
                    <textarea
                      className="form-control rounded-4"
                      rows="7"
                      placeholder="Nhập ghi chú xử lý để cả team admin dễ theo dõi..."
                      value={formData.adminNote}
                      onChange={(event) => setFormData((prev) => ({ ...prev, adminNote: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
                  <div className="small text-muted">
                    Cập nhật ở đây sẽ lưu trực tiếp vào `contact_messages.admin_note` và `status`.
                  </div>
                  <button
                    className="btn btn-primary px-4 py-2 rounded-4 fw-bold"
                    style={{ background: 'var(--primary-color)', border: 'none' }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </div>
              </>
            ) : (
              <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center text-muted">
                <div className="fw-bold mb-2">Chưa chọn liên hệ nào</div>
                <div>Hãy chọn một tin nhắn ở cột bên trái để xem chi tiết và cập nhật trạng thái.</div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
