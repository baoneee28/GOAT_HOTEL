import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_BASE, { uploadedImageUrl } from '../../config';
const Swal = window.Swal;

export default function Users() {
  const [data, setData] = useState({ users: [], totalPages: 1, currentPage: 1 });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '', fullName: '', email: '', phone: '', role: 'customer', password: '', image: ''
  });
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users?q=${q}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [page, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Xóa người dùng này?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`${API_BASE}/api/admin/users/${id}`, { withCredentials: true });
          if (res.data.success) {
            Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            fetchData();
          } else {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: res.data.message });
          }
        } catch (err) { Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' }); }
      }
    });
  };

  const handleEdit = (u) => {
    setFormData({
      id: u.id, fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role, password: '', image: u.image || ''
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', fullName: '', email: '', phone: '', role: 'customer', password: '', image: '' });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalImage = typeof formData.image === 'string' ? formData.image.trim() : '';

      if (fileInputRef.current?.files?.length) {
        const uploadData = new FormData();
        uploadData.append('file', fileInputRef.current.files[0]);
        uploadData.append('type', 'users');

        const uploadRes = await axios.post(`${API_BASE}/api/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        if (uploadRes.data?.success) {
          finalImage = uploadRes.data.fileName;
        }
      }

      const res = await axios.post(`${API_BASE}/api/admin/users`, { ...formData, image: finalImage }, { withCredentials: true });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  return (
    <>
      <style>{`
        .user-avatar { width: 45px; height: 45px; object-fit: cover; border-radius: 50%; border: 2px solid #eee; }
        .table tbody td { padding: 15px 25px; vertical-align: middle; border-bottom: 1px solid #f0f0f0; }
        .badge-role { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .role-admin { background: #fee2e2; color: #dc2626; }
        .role-staff { background: #ede9fe; color: #6d28d9; }
        .role-customer { background: #e0e7ff; color: #4e31aa; }
        .btn-action { width: 32px; height: 32px; border-radius: 8px; border: none; font-size: 14px; }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý người dùng</h2>
              <p className="text-muted mb-0">Danh sách tài khoản khách hàng và nhân viên</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Thêm tài khoản
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom">
              <input type="text" className="form-control rounded-pill px-4" style={{ maxWidth: '350px' }} placeholder="Tìm tên hoặc email..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>

          <div className="table-responsive">
              <table className="table mb-0">
                  <thead className="bg-light">
                      <tr>
                          <th>Người dùng</th>
                          <th>Email</th>
                          <th>Điện thoại</th>
                          <th>Vai trò</th>
                          <th className="text-end">Hành động</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.users && data.users.length > 0 ? data.users.map(u => (
                          <tr key={u.id}>
                              <td>
                                  <div className="d-flex align-items-center">
                                      <img src={uploadedImageUrl(u.image, `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'GOAT User')}`)} className="user-avatar" alt="Avatar" />
                                      <div className="ms-3 fw-bold">{u.fullName}</div>
                                  </div>
                              </td>
                              <td>{u.email}</td>
                              <td>{u.phone}</td>
                              <td><span className={`badge-role ${u.role === 'admin' ? 'role-admin' : (u.role === 'staff' ? 'role-staff' : 'role-customer')}`}>{u.role}</span></td>
                              <td className="text-end">
                                  <button className="btn-action bg-light text-primary me-1" onClick={() => handleEdit(u)}>✎</button>
                                  <button className="btn-action bg-light text-danger" onClick={() => handleDelete(u.id)}>🗑</button>
                              </td>
                          </tr>
                      )) : (<tr><td colSpan="5" className="text-center py-5 text-muted">Chưa có người dùng nào.</td></tr>)}
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

      {showModal && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold">{formData.id ? `Sửa tài khoản: ${formData.fullName}` : 'Thêm tài khoản mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="mb-3">
                                  <label className="form-label fw-bold small text-uppercase text-muted">Họ và tên</label>
                                  <input type="text" className="form-control rounded-3" value={formData.fullName} readOnly={!!formData.id} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                              </div>
                              <div className="row">
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold small text-uppercase text-muted">Email</label>
                                      <input type="email" className="form-control rounded-3" value={formData.email} readOnly={!!formData.id} onChange={e => setFormData({...formData, email: e.target.value})} required />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold small text-uppercase text-muted">Mật khẩu</label>
                                      <input type="password" className="form-control rounded-3" value={formData.password} readOnly={!!formData.id} placeholder={formData.id ? 'Không được đổi MK' : 'Mật khẩu...'} onChange={e => setFormData({...formData, password: e.target.value})} required={!formData.id} />
                                  </div>
                              </div>
                              <div className="row">
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold small text-uppercase text-muted">Số dt</label>
                                      <input type="text" className="form-control rounded-3" value={formData.phone} readOnly={!!formData.id} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold small text-uppercase text-muted">Vai trò</label>
                                      <select className="form-select rounded-3" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                          <option value="customer">Customer</option>
                                          <option value="staff">Staff</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="mb-4">
                                  <label className="form-label fw-bold small text-uppercase text-muted">Ảnh đại diện</label>
                                  <input type="text" className="form-control rounded-3 mb-2" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="/uploads/users/... hoặc https://..." />
                                  <input type="file" ref={fileInputRef} name="image" className="form-control rounded-3" accept="image/*" />
                                  <small className="text-muted d-block mt-1">Ảnh tải lên sẽ được lưu trong `backend/static/uploads/users`.</small>
                                  <div className="mt-3 d-flex align-items-center gap-3">
                                      <img src={uploadedImageUrl(formData.image, `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'GOAT User')}`)} className="user-avatar" alt="Avatar preview" />
                                      <span className="text-muted small">Xem trước ảnh đại diện</span>
                                  </div>
                              </div>
                              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold mt-2" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>Xác nhận</button>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
