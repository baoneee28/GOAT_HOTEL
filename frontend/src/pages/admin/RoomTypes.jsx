
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export default function RoomTypes() {
  const [data, setData] = useState({ roomTypes: [], totalPages: 1 });
  const [allItems, setAllItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [itemSearch, setItemSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', typeName: '', pricePerNight: '', capacity: '', description: '', currentImage: '', itemsIds: [] });
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/room-types/admin?q=${q}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [q, page]);

  useEffect(() => { 
      fetchData(); 
      axios.get('http://localhost:8080/api/admin/items/all', { withCredentials: true }).then(r => setAllItems(r.data));
  }, [fetchData]);

  const handleDelete = (id) => {
    if (window.Swal) window.Swal.fire({
      title: 'Xác nhận xóa?', text: "Dữ liệu liên quan có thể bị ảnh hưởng!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa ngay', cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`http://localhost:8080/api/room-types/admin/${id}`, { withCredentials: true });
          if (res.data.success) {
            window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
            fetchData();
          } else {
            window.Swal.fire({ icon: 'error', title: 'Lỗi', text: res.data.message });
          }
        } catch (err) { window.Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' }); }
      }
    });
  };

  const handleEdit = (t) => {
    const existingIds = t.items ? t.items.map(i => i.item?.id).filter(id => id) : [];
    setFormData({ id: t.id, typeName: t.typeName, pricePerNight: t.pricePerNight, capacity: t.capacity, description: t.description || '', currentImage: t.image || '', itemsIds: existingIds });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', typeName: '', pricePerNight: '', capacity: '', description: '', currentImage: '', itemsIds: [] });
    if(fileInputRef.current) fileInputRef.current.value = null;
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let finalImageName = formData.currentImage;
      
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
          const file = fileInputRef.current.files[0];
          const uploadData = new FormData();
          uploadData.append('file', file);
          uploadData.append('type', 'general');

          const uploadRes = await axios.post('http://localhost:8080/api/upload', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true
          });
          if (uploadRes.data.success) {
              finalImageName = uploadRes.data.fileName;
          }
      }

      const payload = {
          id: formData.id || null,
          typeName: formData.typeName,
          pricePerNight: parseFloat(formData.pricePerNight),
          capacity: parseInt(formData.capacity),
          description: formData.description,
          image: finalImageName,
          itemsIds: formData.itemsIds.join(',')
      };

      const res = await axios.post('http://localhost:8080/api/room-types/admin', payload, { withCredentials: true });
      if (res.data.success) {
          window.Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
          setShowModal(false);
          fetchData();
      }
    } catch (err) { console.error(err); window.Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra' }); }
  };

  const toggleItem = (itemId) => {
    setFormData(prev => {
        const isSelected = prev.itemsIds.includes(itemId);
        return {
            ...prev,
            itemsIds: isSelected ? prev.itemsIds.filter(id => id !== itemId) : [...prev.itemsIds, itemId]
        };
    });
  };

  const filteredItems = allItems.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()));

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý loại phòng</h2>
              <p className="text-muted mb-0">Thiết lập giá và thông tin hạng phòng / tiện ích</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Thêm loại phòng
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom">
              <input type="text" className="form-control rounded-3" style={{ maxWidth: '400px' }} placeholder="Tìm tên loại phòng..." 
                     value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>

          <div className="table-responsive">
              <table className="table mb-0">
                  <thead>
                      <tr>
                          <th>Ảnh</th>
                          <th>Tên loại (Tiện ích)</th>
                          <th>Giá/h</th>
                          <th>Sức chứa</th>
                          <th>Mô tả</th>
                          <th className="text-end">Hành động</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.roomTypes?.length > 0 ? data.roomTypes.map(t => (
                          <tr key={t.id}>
                              <td>
                                  <img src={t.image ? `http://localhost:8080/uploads/${t.image}` : 'https://via.placeholder.com/60'} className="type-img" alt="type" />
                              </td>
                              <td>
                                  <div className="fw-bold">{t.typeName}</div>
                                  <small className="text-muted d-block mt-1">{(t.items && t.items.length) || 0} tiện ích</small>
                              </td>
                              <td className="text-primary fw-bold">{t.pricePerNight.toLocaleString('vi-VN')}đ</td>
                              <td>{t.capacity} người</td>
                              <td className="text-muted small" style={{ maxWidth: '250px' }}>{t.description}</td>
                              <td className="text-end">
                                  <button className="btn-action btn-edit me-1" onClick={() => handleEdit(t)}>✎</button>
                                  <button className="btn-action btn-delete" onClick={() => handleDelete(t.id)}>🗑</button>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">Chưa có dữ liệu</td></tr>
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
              <div className="modal-dialog modal-dialog-centered modal-lg">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold">{formData.id ? `Sửa: ${formData.typeName}` : 'Thêm loại phòng mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="row">
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold">Tên loại phòng</label>
                                      <input type="text" className="form-control rounded-3" value={formData.typeName} onChange={e => setFormData({...formData, typeName: e.target.value})} required />
                                  </div>
                                  <div className="col-md-3 mb-3">
                                      <label className="form-label fw-bold">Giá thuê</label>
                                      <input type="number" className="form-control rounded-3" value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: e.target.value})} required />
                                  </div>
                                  <div className="col-md-3 mb-3">
                                      <label className="form-label fw-bold">Sức chứa</label>
                                      <input type="number" className="form-control rounded-3" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} required />
                                  </div>
                              </div>
                              <div className="row">
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold">Ảnh đại diện</label>
                                      <input type="file" ref={fileInputRef} className="form-control rounded-3" accept="image/*" />
                                      {formData.currentImage && <small className="text-muted d-block mt-1">Hiện tại: {formData.currentImage}</small>}
                                  </div>
                                  <div className="col-md-6 mb-3">
                                      <label className="form-label fw-bold">Mô tả ngắn</label>
                                      <textarea className="form-control rounded-3" rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                  </div>
                              </div>
                              
                              <div className="mb-3 border-top pt-3">
                                  <label className="form-label fw-bold">Đồ đi kèm đã chọn:</label>
                                  <div className="selected-items-container">
                                      {formData.itemsIds.length === 0 ? (
                                          <span className="text-muted small ms-2 mt-1 fst-italic">Chưa có tiện ích...</span>
                                      ) : (
                                          formData.itemsIds.map(id => {
                                              const item = allItems.find(i => i.id === id);
                                              if(!item) return null;
                                              return (
                                                  <div key={item.id} className="item-brick">
                                                      <img src={`http://localhost:8080${item.image}`} alt={item.name} /> {item.name}
                                                      <span className="remove-btn" onClick={() => toggleItem(item.id)}>×</span>
                                                  </div>
                                              )
                                          })
                                      )}
                                  </div>
                              </div>

                              <div className="mb-2">
                                  <input type="text" className="form-control rounded-3" placeholder="🔍 Tìm kiếm đồ vật..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                              </div>

                              <div className="item-list-container mb-4" style={{maxHeight:'200px', overflowY:'auto'}}>
                                  <div className="row g-2">
                                      {filteredItems.map(item => (
                                          <div key={item.id} className="col-md-4 col-sm-6 item-wrapper">
                                              <div className={`item-option d-flex align-items-center ${formData.itemsIds.includes(item.id) ? 'active' : ''}`} onClick={() => toggleItem(item.id)}>
                                                  <div className="check-mark">✔</div>
                                                  <img src={`http://localhost:8080${item.image}`} className="rounded bg-light" alt={item.name} />
                                                  <div className="ms-3 fw-bold small text-truncate">{item.name}</div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>
                                  Lưu dữ liệu
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
