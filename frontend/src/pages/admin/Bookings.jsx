import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE, { calculateBookingDisplayTotal, calculateStayNights } from '../../config';
const Swal = window.Swal;

export default function Bookings() {
  const [data, setData] = useState({ bookings: [], totalPages: 1, currentPage: 1 });
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const [formData, setFormData] = useState({
    id: '', userId: '', roomId: '', checkIn: '', checkOut: '', status: 'pending'
  });

  const getErrorMessage = (error, fallback = 'Có lỗi xảy ra') => {
    const payload = error?.response?.data;
    if (typeof payload === 'string' && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    return error?.message || fallback;
  };

  const toDateTimeLocalValue = (value) => {
    if (!value) return '';

    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0] = value;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    const raw = String(value).trim();
    if (!raw) return '';

    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    return normalized.substring(0, 16);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/bookings?status=${status}&page=${page}`, { withCredentials: true });
      setData(res.data);
    } catch (err) { console.error(err); }
  }, [status, page]);

  useEffect(() => {
    fetchData();
    axios.get(`${API_BASE}/api/admin/users/all`, { withCredentials: true }).then(r => setUsers(r.data));
    axios.get(`${API_BASE}/api/rooms`, { withCredentials: true }).then(r => setRooms(r.data));
  }, [fetchData]);

  const handleCheckout = (b) => {
    const detail = b.details?.[0] || {};
    const checkOutDate = new Date(detail.checkOut || Date.now());
    const now = new Date();
    const displayTotal = calculateBookingDisplayTotal(b);
    if (now < checkOutDate) {
      Swal.fire({
        title: 'Khách trả phòng sớm!',
        html: `
            <div class="text-start p-3 bg-light rounded-3 mb-3">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="radio" name="checkoutOpt" id="opt1" value="keep" checked>
                    <label class="form-check-label fw-bold" for="opt1">
                        Thanh toán theo giá đã đặt
                        <div class="text-primary">${displayTotal.toLocaleString('vi-VN')}đ</div>
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="checkoutOpt" id="opt2" value="recalc">
                    <label class="form-check-label fw-bold" for="opt2">Tính lại theo số đêm thực tế</label>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận trả phòng',
        confirmButtonColor: '#ea580c',
        preConfirm: () => {
          return document.querySelector('input[name="checkoutOpt"]:checked').value;
        }
      }).then((res) => {
        if (res.isConfirmed) { submitCheckout(b.id, res.value); }
      });
    } else {
      Swal.fire({
        title: 'Xác nhận trả phòng?', text: "Đơn hàng sẽ chuyển sang trạng thái hoàn thành.", icon: 'question',
        showCancelButton: true, confirmButtonText: 'Đồng ý', confirmButtonColor: '#16a34a'
      }).then((res) => {
        if (res.isConfirmed) { submitCheckout(b.id, 'normal'); }
      });
    }
  };

  const submitCheckout = async (id, type) => {
    try {
      const res = await axios.post(`${API_BASE}/api/admin/bookings/${id}/checkout`, { checkoutType: type }, { withCredentials: true });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Đã thanh toán', timer: 1500, showConfirmButton: false });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleApprove = (id) => {
    Swal.fire({
      title: 'Duyệt đơn này?', text: 'Đơn đặt phòng sẽ chuyển sang trạng thái Đã xác nhận.', icon: 'question',
      showCancelButton: true, confirmButtonText: 'Đồng ý', confirmButtonColor: '#16a34a'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const result = await axios.post(`${API_BASE}/api/admin/bookings/${id}/approve`, {}, { withCredentials: true });
          if (result.data.success) {
            Swal.fire({ icon: 'success', title: 'Đã duyệt!', timer: 1500, showConfirmButton: false });
            fetchData();
          }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(e) });
        }
      }
    });
  };

  const handleEdit = (b) => {
    const detail = b.details?.[0] || {};
    setFormData({
      id: b.id, userId: b.user?.id || '', roomId: detail.room?.id || '',
      checkIn: toDateTimeLocalValue(detail.checkIn),
      checkOut: toDateTimeLocalValue(detail.checkOut),
      status: b.status
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ id: '', userId: '', roomId: '', checkIn: '', checkOut: '', status: 'pending' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/admin/bookings`, formData, { withCredentials: true });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Lưu thành công', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: getErrorMessage(err) });
    }
  };

  const printInvoice = () => { window.print(); };

  const availableRooms = rooms.filter(r => r.status === 'available');
  const getStayNightsLabel = (checkIn, checkOut) => {
    const nights = calculateStayNights(checkIn, checkOut);
    return nights > 0 ? `${nights} đêm` : 'Chưa cập nhật';
  };

  return (
    <>
      <style>{`
        .st-badge { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .st-confirmed { background: #e0f2fe; color: #0369a1; }
        .st-pending { background: #fef3c7; color: #92400e; }
        .st-completed { background: #dcfce7; color: #166534; }
        .st-cancelled { background: #fee2e2; color: #991b1b; }
        .btn-check-action { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: none; transition: 0.2s; }
        .btn-check-early { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
        .btn-check-early:hover { background: #ea580c; color: white; }
        .invoice-box { padding: 20px; border: 1px solid #eee; border-radius: 16px; background: #fff; }
        .invoice-header { border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px; }
        .invoice-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
        .invoice-total { border-top: 2px solid #eee; padding-top: 15px; margin-top: 15px; font-size: 1.2rem; font-weight: 800; color: var(--primary-color); }
      `}</style>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h2 className="fw-bold mb-1">Quản lý đặt phòng</h2>
              <p className="text-muted mb-0">Hệ thống tính tiền tự động theo đêm</p>
          </div>
          <button className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm" style={{ background: 'var(--primary-color)', border: 'none' }} onClick={handleAddNew}>
              + Tạo đơn mới
          </button>
      </div>

      <div className="card-table">
          <div className="p-4 border-bottom d-flex gap-2">
              <button className={`btn btn-sm ${!status ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => { setStatus(''); setPage(1); }}>Tất cả</button>
              <button className={`btn btn-sm ${status === 'pending' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => { setStatus('pending'); setPage(1); }}>Chờ duyệt</button>
              <button className={`btn btn-sm ${status === 'confirmed' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => { setStatus('confirmed'); setPage(1); }}>Đã đặt</button>
              <button className={`btn btn-sm ${status === 'completed' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => { setStatus('completed'); setPage(1); }}>Hoàn thành</button>
              <button className={`btn btn-sm ${status === 'cancelled' ? 'btn-dark' : 'btn-light border'} rounded-pill px-3`} onClick={() => { setStatus('cancelled'); setPage(1); }}>Đã hủy</button>
          </div>

          <div className="p-0" style={{ width: '100%', overflowX: 'hidden' }}>
              <table className="table mb-0 align-middle table-hover" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead className="table-light">
                      <tr>
                          <th className="px-3" style={{width: '20%'}}>Khách hàng</th>
                          <th style={{width: '15%'}}>Phòng & Giá</th>
                          <th style={{width: '20%'}}>Thời gian</th>
                          <th style={{width: '15%'}}>Tổng tiền</th>
                          <th style={{width: '10%'}}>Trạng thái</th>
                          <th className="text-end px-3" style={{width: '20%'}}>Hành động</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.bookings && data.bookings.length > 0 ? data.bookings.map(b => {
                          const formatDate = (arr) => Array.isArray(arr) ? `${String(arr[2]).padStart(2,'0')}/${String(arr[1]).padStart(2,'0')}/${arr[0]} ${String(arr[3]).padStart(2,'0')}:${String(arr[4]||0).padStart(2,'0')}` : arr;
                          const displayTotal = calculateBookingDisplayTotal(b);
                          return (
                          <tr key={b.id}>
                              <td className="fw-bold px-3 text-wrap text-break">{b.user?.fullName}</td>
                              <td>
                                  {b.details?.map((d, i) => (
                                    <div key={`rm-${i}`} className="mb-2">
                                      <div className="fw-bold text-primary">Phòng {d.room?.roomNumber}</div>
                                      <small className="text-muted">{d.room?.roomType?.pricePerNight.toLocaleString('vi-VN')}đ/đêm</small>
                                    </div>
                                  ))}
                              </td>
                              <td className="small">
                                  {b.details?.map((d, i) => (
                                    <div key={`time-${i}`} className="mb-1 text-wrap">
                                      <div className="text-muted">In: <b className="text-dark">{formatDate(d.checkIn)}</b></div>
                                      <div className="text-muted">Out: <b className="text-dark">{formatDate(d.checkOut)}</b></div>
                                    </div>
                                  ))}
                              </td>
                              <td className="fw-bold text-primary">
                                  {displayTotal.toLocaleString('vi-VN')}đ<br />
                                  <span className="badge bg-light text-dark fw-normal border">
                                      {getStayNightsLabel(b.details?.[0]?.checkIn, b.details?.[0]?.checkOut)}
                                  </span>
                              </td>
                              <td><span className={`st-badge st-${b.status}`}>{b.status}</span></td>
                              <td className="text-end px-3">
                                  <div className="d-flex flex-wrap justify-content-end gap-1">
                                      {b.status === 'pending' && (
                                          <button className="btn btn-sm btn-light text-success border rounded-circle" style={{width:'32px', height:'32px'}} title="Duyệt đơn" onClick={() => handleApprove(b.id)}>✓</button>
                                      )}
                                      {(b.status === 'confirmed' || b.status === 'pending') && (
                                          <button className="btn btn-sm btn-light text-warning border rounded-circle" style={{width:'32px', height:'32px'}} title="Chấm trả phòng" onClick={() => handleCheckout(b)}>⚡</button>
                                      )}
                                      {b.status === 'completed' && (
                                          <button className="btn btn-sm btn-light text-info border rounded-circle" style={{width:'32px', height:'32px'}} title="Xem hóa đơn" onClick={() => {
                                              setInvoiceData(b);
                                              setShowInvoice(true);
                                          }}>👁</button>
                                      )}
                                      {b.status !== 'completed' && (
                                          <button className="btn btn-sm btn-light text-primary border rounded-circle" style={{width:'32px', height:'32px'}} title="Sửa" onClick={() => handleEdit(b)}>✎</button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      )}) : (<tr><td colSpan="6" className="text-center py-5 text-muted">Không có đơn đặt phòng nào.</td></tr>)}
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
                          <h5 className="fw-bold">{formData.id ? 'Cập nhật đơn đặt phòng' : 'Tạo đơn mới'}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <form onSubmit={handleSave}>
                              <div className="mb-3">
                                  <label className="form-label fw-bold small text-muted text-uppercase">Khách hàng</label>
                                  <select className="form-select rounded-3" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} required>
                                      <option value="">-- Chọn khách --</option>
                                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                                  </select>
                              </div>
                              <div className="mb-3">
                                  <label className="form-label fw-bold small text-muted text-uppercase">Phòng</label>
                                  <select className="form-select rounded-3" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} required>
                                      <option value="">-- Chọn phòng --</option>
                                      {formData.id && rooms.find(r => r.id == formData.roomId) && (
                                          <option value={formData.roomId}>Phòng {rooms.find(r => r.id == formData.roomId)?.roomNumber} (Hiện tại)</option>
                                      )}
                                      {availableRooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber}</option>)}
                                  </select>
                              </div>
                              <div className="row mb-3 g-3">
                                  <div className="col-6">
                                      <label className="form-label fw-bold small text-muted text-uppercase">Giờ Check-in</label>
                                      <input type="datetime-local" className="form-control" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} required />
                                  </div>
                                  <div className="col-6">
                                      <label className="form-label fw-bold small text-muted text-uppercase">Giờ Check-out</label>
                                      <input type="datetime-local" className="form-control" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} required />
                                  </div>
                              </div>
                              <div className="mb-4">
                                  <label className="form-label fw-bold small text-muted text-uppercase">Trạng thái</label>
                                  <select className="form-select rounded-3" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                      <option value="pending">Đang chờ</option>
                                      <option value="confirmed">Đã xác nhận</option>
                                      <option value="completed">Đã hoàn thành</option>
                                      <option value="cancelled">Đã hủy</option>
                                  </select>
                              </div>
                              <button type="submit" className="btn btn-primary w-100 py-3 fw-bold" style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}>Lưu thông tin</button>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showInvoice && invoiceData && (
          <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content" style={{ borderRadius: '24px', border: 'none' }}>
                      <div className="modal-header border-0 p-4 pb-0">
                          <h5 className="fw-bold text-uppercase text-primary">Chi tiết hóa đơn</h5>
                          <button type="button" className="btn-close" onClick={() => setShowInvoice(false)}></button>
                      </div>
                      <div className="modal-body p-4">
                          <div className="invoice-box">
                              <div className="invoice-header text-center">
                                  <h3 className="fw-bold">GOAT HOTEL</h3>
                                  <div className="text-muted small">Mã đơn: #{invoiceData.id}</div>
                              </div>
                              <div className="invoice-row"><span className="text-muted">Khách hàng:</span> <span className="fw-bold">{invoiceData.user?.fullName}</span></div>
                              {invoiceData.details?.map((d, i) => (
                                <div key={i} className="mb-3 border rounded p-2 bg-light">
                                  <div className="invoice-row"><span className="text-muted">Phòng:</span> <span className="fw-bold">{d.room?.roomNumber} ({d.room?.roomType?.typeName})</span></div>
                                  <div className="invoice-row"><span className="text-muted">Nhận phòng:</span> <span>{d.checkIn}</span></div>
                                  <div className="invoice-row"><span className="text-muted">Trả phòng:</span> <span>{d.checkOut}</span></div>
                                  <div className="border-top mt-2 pt-2">
                                      <div className="invoice-row">
                                          <span>Đơn giá</span>
                                          <span>{d.priceAtBooking.toLocaleString('vi-VN')}đ /đêm</span>
                                      </div>
                                      <div className="invoice-row mb-0">
                                          <span>Thời gian lưu trú</span>
                                          <span>{getStayNightsLabel(d.checkIn, d.checkOut)}</span>
                                      </div>
                                  </div>
                                </div>
                              ))}

                              <div className="invoice-total d-flex justify-content-between">
                                  <span>TỔNG CỘNG</span>
                                  <span>{calculateBookingDisplayTotal(invoiceData).toLocaleString('vi-VN')} VNĐ</span>
                              </div>
                              <div className="text-center mt-3 text-success fw-bold text-uppercase small border p-1 rounded bg-light">
                                  Đã thanh toán
                              </div>
                          </div>
                          <button className="btn btn-dark w-100 mt-3 rounded-pill" onClick={printInvoice}>🖨 In hóa đơn</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
