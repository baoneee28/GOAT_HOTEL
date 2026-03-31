import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

const Swal = window.Swal;

export default function Inbox() {
  const [data, setData] = useState({ messages: [], totalPages: 1, currentPage: 1, newCount: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/contact-messages?q=${q}&status=${status}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  }, [page, q, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/contact-messages/${id}`, { withCredentials: true });
      if (res.data.success) {
        setSelectedMessage(res.data.messageItem);
      }
    } catch (error) {
      Swal?.fire({ icon: 'error', title: 'Lỗi', text: error.response?.data?.message || 'Không thể tải chi tiết liên hệ.' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedMessage) return;
    try {
      setSaving(true);
      const res = await axios.put(`${API_BASE}/api/admin/contact-messages/${selectedMessage.id}`, {
        status: selectedMessage.status,
        adminNote: selectedMessage.adminNote || ''
      }, { withCredentials: true });
      if (res.data.success) {
        Swal?.fire({ icon: 'success', title: 'Đã cập nhật', timer: 1500, showConfirmButton: false });
        setSelectedMessage(res.data.messageItem);
        fetchData();
      }
    } catch (error) {
      Swal?.fire({ icon: 'error', title: 'Lỗi', text: error.response?.data?.message || 'Không thể cập nhật liên hệ.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (messageId) => {
    Swal?.fire({
      title: 'Xóa liên hệ này?',
      text: 'Tin nhắn sẽ bị xóa khỏi inbox quản trị.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626'
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await axios.delete(`${API_BASE}/api/admin/contact-messages/${messageId}`, { withCredentials: true });
        if (res.data.success) {
          Swal?.fire({ icon: 'success', title: 'Đã xóa', timer: 1400, showConfirmButton: false });
          if (selectedMessage?.id === messageId) {
            setSelectedMessage(null);
          }
          fetchData();
        }
      } catch (error) {
        Swal?.fire({ icon: 'error', title: 'Lỗi', text: error.response?.data?.message || 'Không thể xóa liên hệ.' });
      }
    });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
  };

  const badgeClass = (value) => ({
    new: 'bg-danger-subtle text-danger',
    read: 'bg-warning-subtle text-warning',
    resolved: 'bg-success-subtle text-success'
  }[value] || 'bg-light text-dark');

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Inbox liên hệ</h2>
          <p className="text-muted mb-0">Tin nhắn từ form contact của khách đang đổ về đây. Mới: <b>{data.newCount || 0}</b></p>
        </div>
      </div>

      <div className="card-table mb-4">
        <div className="p-4 border-bottom d-flex flex-wrap gap-3">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '320px' }}
            placeholder="Tìm tên, email hoặc nội dung..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
          <select
            className="form-select"
            style={{ maxWidth: '220px' }}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="read">Đã đọc</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Khách</th>
                <th>Email</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.messages?.length > 0 ? data.messages.map((message) => (
                <tr key={message.id}>
                  <td className="fw-bold">{`${message.firstName} ${message.lastName}`}</td>
                  <td>{message.email}</td>
                  <td className="text-muted small" style={{ maxWidth: '320px' }}>
                    {message.message?.length > 110 ? `${message.message.slice(0, 110)}...` : message.message}
                  </td>
                  <td className="small">{formatDate(message.createdAt)}</td>
                  <td>
                    <span className={`badge rounded-pill ${badgeClass(message.status)}`}>{message.status}</span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-light text-primary me-2" onClick={() => openDetail(message.id)}>Xem</button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(message.id)}>Xóa</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Chưa có liên hệ nào.</td></tr>
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

      {selectedMessage && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.45)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
              <div className="modal-header border-0 p-4 pb-0">
                <div>
                  <h5 className="fw-bold mb-1">{selectedMessage.firstName} {selectedMessage.lastName}</h5>
                  <div className="text-muted small">{selectedMessage.email}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedMessage(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <div className="small text-muted text-uppercase fw-bold mb-2">Gửi lúc</div>
                      <div>{formatDate(selectedMessage.createdAt)}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <div className="small text-muted text-uppercase fw-bold mb-2">Cập nhật cuối</div>
                      <div>{formatDate(selectedMessage.updatedAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">Nội dung khách gửi</label>
                  <div className="border rounded-4 p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMessage.message}
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Trạng thái</label>
                      <select
                        className="form-select rounded-3"
                        value={selectedMessage.status || 'new'}
                        onChange={(e) => setSelectedMessage((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="new">Mới</option>
                        <option value="read">Đã đọc</option>
                        <option value="resolved">Đã xử lý</option>
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-bold">Ghi chú nội bộ</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={selectedMessage.adminNote || ''}
                        onChange={(e) => setSelectedMessage((prev) => ({ ...prev, adminNote: e.target.value }))}
                        placeholder="Ví dụ: Đã gọi lại, đang chờ khách phản hồi..."
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                      {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
                    </button>
                    <button type="button" className="btn btn-outline-danger px-4" onClick={() => handleDelete(selectedMessage.id)}>
                      Xóa liên hệ
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
