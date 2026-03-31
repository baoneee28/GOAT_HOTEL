import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

export default function Rooms() {
  const [data, setData] = useState({ rooms: [], totalPages: 1, currentPage: 1 });
  const [types, setTypes] = useState([]);
  
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modal form state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', roomNumber: '', typeId: '', status: 'available' });

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/rooms/admin?q=${q}&status=${status}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [q, status, page]);

  useEffect(() => {
    fetchData();
    axios.get(`${API_BASE}/api/room-types`, { withCredentials: true }).then(r => setTypes(r.data));
  }, [fetchData]);

  const handleDelete = (id) => {
    if (window.Swal) window.Swal.fire({
      title: 'Cảnh báo xóa!', text: "Phòng này sẽ bị xóa vĩnh viễn.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`${API_BASE}/api/rooms/admin/${id}`, { withCredentials: true });
          if (res.data.success) {
             window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
             fetchData();
          } else {
             window.Swal.fire({ icon: 'error', title: 'Lỗi', text: res.data.message });
          }
        } catch (err) {
          window.Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' });
        }
      }
    });
  };

  const handleEdit = (r) => {
    setFormData({ id: r.id, roomNumber: r.roomNumber || '', typeId: r.roomType?.id || '', status: r.status });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', roomNumber: '', typeId: types[0]?.id || '', status: 'available' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            id: formData.id || null,
            roomNumber: formData.roomNumber,
            typeId: formData.typeId,
            status: formData.status
        };
        const res = await axios.post(`${API_BASE}/api/rooms/admin`, payload, { withCredentials: true });
        if (res.data.success) {
            window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            setShowModal(false);
            fetchData();
        }
    } catch (err) {
        window.Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý phòng</h2>
              <p className="text-muted mb-0">Danh sách và trạng thái phòng nghỉ</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Thêm phòng mới
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom d-flex gap-3">
              <input type="text" className="form-control" style={{ borderRadius: '12px', maxWidth: '300px' }} placeholder="Tìm số phòng..." 
                     value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
              <select className="form-select" style={{ borderRadius: '12px', maxWidth: '200px' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="available">Phòng trống</option>
                  <option value="booked">Đang thuê</option>
                  <option value="maintenance">Bảo trì</option>
              </select>
          </div>

          <div className="table-responsive">
              <table className="table mb-0">
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
                      {data.rooms && data.rooms.length > 0 ? data.rooms.map(r => (
                          <tr key={r.id}>
                              <td>{r.id}</td>
                              <td className="fw-bold text-primary">{r.roomNumber}</td>
                              <td>{r.roomType?.typeName}</td>
                              <td>{r.roomType?.pricePerNight?.toLocaleString('vi-VN')}đ</td>
                              <td><span className="badge bg-light text-dark border">{r.roomType?.items?.length || 0} món</span></td>
                              <td>
                                  {r.status === 'available' && <span className="badge-status status-available">Sẵn sàng</span>}
                                  {r.status === 'booked' && <span className="badge-status status-booked">Đang có khách</span>}
                                  {r.status === 'maintenance' && <span className="badge-status status-maintenance">Đang sửa</span>}
                              </td>
                              <td className="text-end">
                                  <button className="btn-action btn-edit me-1" onClick={() => handleEdit(r)}>✎</button>
                                  <button className="btn-action btn-delete" onClick={() => handleDelete(r.id)}>🗑</button>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan="7" className="text-center py-5 text-muted">Chưa có dữ liệu.</td></tr>
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
                              <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                          </li>
                          {[...Array(data.totalPages)].map((_, i) => (
                              <li key={i+1} className={`page-item ${i+1 === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setPage(i+1)}>{i+1}</button>
                              </li>
                          ))}
                          <li className={`page-item ${page >= data.totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                          </li>
                      </ul>
                  </nav>
              </div>
          )}
      </div>

      {/* MODAL */}
      {showModal && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '20px' }}>
                      <div className="modal-header border-bottom-0 p-4">
                          <h5 className="modal-title fw-bold">{formData.id ? 'Cập nhật phòng' : 'Thêm phòng mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4 pt-0">
                          <form onSubmit={handleSave}>
                              <div className="row g-3">
                              <div className="col-12">
                                      <label className="form-label fw-bold">Số phòng</label>
                                      <input type="text" className="form-control rounded-3 p-2" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} placeholder="VD: 101, A203..." required />
                                  </div>
                                  <div className="col-12">
                                      <label className="form-label fw-bold">Loại phòng</label>
                                      <select className="form-select rounded-3 p-2" value={formData.typeId} onChange={e => setFormData({...formData, typeId: e.target.value})} required>
                                          <option value="">-- Chọn loại phòng --</option>
                                          {types.map(t => (
                                              <option key={t.id} value={t.id}>{t.typeName} - {t.pricePerNight?.toLocaleString('vi-VN')}đ</option>
                                          ))}
                                      </select>
                                  </div>
                                  <div className="col-12">
                                      <label className="form-label fw-bold">Trạng thái</label>
                                      <select className="form-select rounded-3 p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                          <option value="available">Sẵn sàng</option>
                                          <option value="booked">Đang có khách</option>
                                          <option value="maintenance">Đang bảo trì</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="d-grid mt-4">
                                  <button type="submit" className="btn btn-primary py-2 rounded-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none' }}>Lưu thông tin</button>
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
