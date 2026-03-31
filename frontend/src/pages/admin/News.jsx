import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_BASE, { uploadedImageUrl, formatDateValue } from '../../config';
const Swal = window.Swal;

export default function News() {
  const [data, setData] = useState({ newsList: [], totalPages: 1, currentPage: 1 });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '', title: '', summary: '', content: '', image: ''
  });
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/news/admin?q=${q}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [q, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Xác nhận xóa?', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`${API_BASE}/api/news/admin/${id}`, { withCredentials: true });
          if (res.data.success) {
            Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            fetchData();
          } else {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xóa bài viết này.' });
          }
        } catch (err) { Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' }); }
      }
    });
  };

  const handleEdit = (n) => {
    setFormData({
      id: n.id, title: n.title, summary: n.summary, content: n.content || '', image: n.image || ''
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', title: '', summary: '', content: '', image: '' });
    if (fileInputRef.current) fileInputRef.current.value = null;
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalImageName = formData.image;

      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        const uploadData = new FormData();
        uploadData.append('file', fileInputRef.current.files[0]);
        uploadData.append('type', 'news');

        const uploadRes = await axios.post(`${API_BASE}/api/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });

        if (uploadRes.data.success) {
          finalImageName = uploadRes.data.fileName;
        }
      }

      const res = await axios.post(`${API_BASE}/api/news/admin`, { ...formData, image: finalImageName }, { withCredentials: true });
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
        .news-img { width: 80px; height: 50px; object-fit: cover; border-radius: 8px; }
        .ck-editor__editable { min-height: 300px !important; border-radius: 0 0 12px 12px !important; }
        .ck-toolbar { border-radius: 12px 12px 0 0 !important; }
        .ck-powered-by { display: none !important; }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Tin tức & Sự kiện</h2>
              <p className="text-muted mb-0">Quản lý nội dung truyền thông khách sạn</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Viết bài mới
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom">
              <input type="text" className="form-control rounded-pill px-4" style={{ maxWidth: '350px' }} placeholder="Tìm tiêu đề..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>

          <div className="table-responsive">
              <table className="table mb-0 px-4">
                  <thead>
                      <tr>
                          <th className="ps-4 py-3">Ảnh</th>
                          <th className="py-3">Tiêu đề</th>
                          <th className="py-3">Ngày đăng</th>
                          <th className="text-end pe-4 py-3">Thao tác</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.newsList && data.newsList.length > 0 ? data.newsList.map(n => (
                          <tr key={n.id}>
                              <td className="ps-4 py-3">
                                  <img src={uploadedImageUrl(n.image, '/images/news/news-default.png')} className="news-img" alt="News" />
                              </td>
                              <td className="fw-bold py-3">{n.title}</td>
                              <td className="py-3">{formatDateValue(n.createdAt) || 'Chưa cập nhật'}</td>
                              <td className="text-end pe-4 py-3">
                                  <button className="btn btn-sm btn-light text-primary me-1" onClick={() => handleEdit(n)}>✎</button>
                                  <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(n.id)}>🗑</button>
                              </td>
                          </tr>
                      )) : (<tr><td colSpan="4" className="text-center py-5 text-muted">Chưa có bài viết nào.</td></tr>)}
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
              <div className="modal-dialog modal-dialog-centered modal-lg">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold">{formData.id ? 'Sửa bài viết' : 'Đăng tin mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="mb-3">
                                  <label className="form-label fw-bold">Tiêu đề bài viết</label>
                                  <input type="text" className="form-control rounded-3" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                              </div>
                              <div className="mb-3">
                                  <label className="form-label fw-bold">Mô tả ngắn</label>
                                  <textarea className="form-control rounded-3" rows="2" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} required></textarea>
                              </div>
                              <div className="mb-3">
                                  <label className="form-label fw-bold">Ảnh bìa</label>
                                  <input type="file" name="image" ref={fileInputRef} className="form-control rounded-3" accept="image/*" />
                                  {formData.image && <small className="text-muted d-block mt-2">Ảnh hiện tại: {formData.image}</small>}
                              </div>
                              <div className="mb-4">
                                  <label className="form-label fw-bold">Nội dung chi tiết (Cần CKEditor)</label>
                                  <textarea name="content" className="form-control rounded-3" rows="6" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                              </div>
                              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>Lưu bài viết</button>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
