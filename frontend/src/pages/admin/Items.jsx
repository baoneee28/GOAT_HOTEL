import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function Items() {
  const [data, setData] = useState({ items: [], totalPages: 1, currentPage: 1 });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', image: '' });

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/admin/items?q=${q}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [q, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = (id) => {
    if (window.Swal) window.Swal.fire({
      title: 'Xác nhận xóa?', text: "Dữ liệu vật phẩm này sẽ bị xóa vĩnh viễn!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`http://localhost:8080/api/admin/items/${id}`, { withCredentials: true });
          if (res.data.success) {
            window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            fetchData();
          }
        } catch (err) {
            window.Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
        }
      }
    });
  };

  const handleEdit = (i) => {
    setFormData({ id: i.id, name: i.name, image: i.image });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', name: '', image: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          id: formData.id || null,
          name: formData.name,
          image: formData.image
      };

      const res = await axios.post('http://localhost:8080/api/admin/items', payload, { withCredentials: true });
      if (res.data.success) {
          window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
          setShowModal(false);
          fetchData();
      }
    } catch (err) { console.error(err); window.Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' }); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý vật phẩm</h2>
              <p className="text-muted mb-0">Quản lý các tiện ích đi kèm phòng</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Thêm vật phẩm
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom">
              <input type="text" className="form-control rounded-3" style={{ maxWidth: '400px' }} placeholder="Tìm tên vật phẩm..." 
                     value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>

          <div className="table-responsive">
              <table className="table mb-0">
                  <thead>
                      <tr>
                          <th width="100">Icon</th>
                          <th>Tên vật phẩm</th>
                          <th>Đường dẫn ảnh (URL)</th>
                          <th className="text-end">Hành động</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.items?.length > 0 ? data.items.map(i => (
                          <tr key={i.id}>
                              <td>
                                  <img src={i.image?.startsWith('http') || i.image?.startsWith('/uploads') ? i.image : `http://localhost:8080${i.image}`} 
                                       className="item-icon-img" alt={i.name} onError={(e)=>{e.target.onerror=null; e.target.src='https://via.placeholder.com/40'}} />
                              </td>
                              <td className="fw-bold">{i.name}</td>
                              <td className="text-muted small">{i.image}</td>
                              <td className="text-end">
                                  <button className="btn-action btn-edit me-1" onClick={() => handleEdit(i)}>✎</button>
                                  <button className="btn-action btn-delete" onClick={() => handleDelete(i.id)}>🗑</button>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan="4" className="text-center py-5 text-muted">Chưa có dữ liệu</td></tr>
                      )}
                  </tbody>
              </table>
          </div>

          {data.totalPages > 1 && (
              <div className="p-4 d-flex justify-content-end">
                  <nav><ul className="pagination mb-0">
                      {[...Array(data.totalPages)].map((_, idx) => (
                          <li key={idx+1} className={`page-item ${idx+1 === page ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setPage(idx+1)}>{idx+1}</button>
                          </li>
                      ))}
                  </ul></nav>
              </div>
          )}
      </div>

      {showModal && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold">{formData.id ? 'Sửa vật phẩm' : 'Thêm vật phẩm mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="mb-3">
                                  <label className="form-label fw-bold">Tên vật phẩm</label>
                                  <input type="text" className="form-control rounded-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Tivi, Điều hòa..." required />
                              </div>
                              <div className="mb-4">
                                  <label className="form-label fw-bold">Đường dẫn Icon (URL)</label>
                                  <input type="text" className="form-control rounded-3" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." required />
                                  <div className="form-text">Dán link ảnh từ Flaticon hoặc các nguồn mở khác.</div>
                              </div>
                              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>
                                  Lưu vật phẩm
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
