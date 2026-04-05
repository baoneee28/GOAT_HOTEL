const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\frontend\\src\\pages\\admin\\Coupons.jsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('h5 className="fw-bold mb-1">Tạo nhóm sự kiện mới</h5>')) {
    const modalHTML = `
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
`;
    content = content.replace('    </>\n  );\n}', modalHTML);
    fs.writeFileSync(file, content, 'utf-8');
    console.log("Modal added!");
} else {
    console.log("Modal already exists");
}
