const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\frontend\\src\\pages\\admin\\Coupons.jsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add state for eventTypes
if (!content.includes('const [eventTypes, setEventTypes]')) {
    content = content.replace(
        'const [expandedGroups, setExpandedGroups] = useState({ DEFAULT: true, ON_REVIEW: true, WEEKEND: true, OTHER: true });',
        `const [expandedGroups, setExpandedGroups] = useState({ DEFAULT: true, ON_REVIEW: true, WEEKEND: true, OTHER: true });
  const [eventTypes, setEventTypes] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({ label: '', eventKey: '', icon: 'category', color: '#6b7280' });
  const [savingEvent, setSavingEvent] = useState(false);`
    );
}

// 2. Fetch eventTypes
if (!content.includes('fetchEventTypes')) {
    content = content.replace(
        '  const fetchData = useCallback(async () => {',
        `  const fetchEventTypes = useCallback(async () => {
    try {
      const res = await axios.get(\`\${API_BASE}/api/admin/coupon-events\`, { withCredentials: true });
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

  const fetchData = useCallback(async () => {`
    );
    // Add call to useEffect
    content = content.replace(
        '  useEffect(() => {\n    fetchData();\n  }, [fetchData]);',
        '  useEffect(() => {\n    fetchData();\n    fetchEventTypes();\n  }, [fetchData, fetchEventTypes]);'
    );
}

// 3. Handlers for event types
if (!content.includes('handleSaveEvent')) {
    content = content.replace(
        '  const handleSave = async (event) => {',
        `  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const res = await axios.post(\`\${API_BASE}/api/admin/coupon-events\`, eventFormData, { withCredentials: true });
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
        const res = await axios.delete(\`\${API_BASE}/api/admin/coupon-events/\${id}\`, { withCredentials: true });
        if (res.data.success) {
          Swal?.fire('Đã xóa', res.data.message, 'success');
          fetchEventTypes();
        }
      } catch (error) {
        Swal?.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra.', 'error');
      }
    }
  };

  const handleSave = async (event) => {`
    );
}

// 4. Update the render loop for groups
if (content.includes('const EVENT_GROUPS = [')) {
    // We replace the static array logic
    const oldLogic = `          const EVENT_GROUPS = [
            { key: 'DEFAULT', label: 'Mặc định (Cấp thủ công)', icon: 'loyalty', color: '#6b7280' },
            { key: 'ON_REVIEW', label: 'Tự động tặng sau Review', icon: 'reviews', color: '#f59e0b' },
            { key: 'WEEKEND', label: 'Khuyến mãi Cuối tuần', icon: 'weekend', color: '#3b82f6' },
            { key: 'OTHER', label: 'Mục khác', icon: 'more_horiz', color: '#8b5cf6' },
          ];`;
    const newLogic = `          const EVENT_GROUPS = eventTypes.length > 0 ? eventTypes.map(e => ({
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
          ];`;
    content = content.replace(oldLogic, newLogic);
}

// 5. Add delete button for non-system events
if (!content.includes('handleDeleteEvent(group.id)')) {
    content = content.replace(
        '{isAdmin && (',
        `{isAdmin && !group.isSystem && (
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{ width: '32px', height: '32px', padding: 0, flexShrink: 0 }}
                      title="Xóa nhóm này"
                      onClick={(e) => { e.stopPropagation(); handleDeleteEvent(group.id); }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  )}
                  {isAdmin && (`
    );
}

// 6. Header + Add Event button
if (!content.includes('setShowEventModal(true)')) {
    content = content.replace(
        'Bấm <strong>+</strong> bên cạnh mỗi nhóm để thêm coupon.',
        'Bấm <strong>+</strong> bên cạnh mỗi nhóm để thêm coupon. Admin có thể tạo nhóm mới.'
    );
    content = content.replace(
        '      </div>\n\n      <div className="card-table">',
        `        {isAdmin && (
          <button
            className="btn btn-outline-primary px-4 py-2 rounded-3 fw-bold mt-2 mt-md-0"
            onClick={() => { setEventFormData({ label: '', eventKey: '', icon: 'category', color: '#6b7280' }); setShowEventModal(true); }}
          >
            + Tạo nhóm sự kiện
          </button>
        )}
      </div>

      <div className="card-table">`
    );
}

// 7. Update Add/Edit Form dynamic select options
if (content.includes('<option value="DEFAULT">')) {
  // It's the static HTML block
  const oldSelect = `<select className="form-select rounded-3" value={formData.targetEvent || 'DEFAULT'} onChange={(event) => setFormData((prev) => ({ ...prev, targetEvent: event.target.value }))}>
                        <option value="DEFAULT">Mặc định (Cấp thủ công)</option>
                        <option value="ON_REVIEW">Tự động tặng sau Review</option>
                        <option value="WEEKEND">Khuyến mãi Cuối tuần</option>
                        <option value="OTHER">Mục khác</option>
                      </select>`;
  const newSelect = `<select className="form-select rounded-3" value={formData.targetEvent || 'DEFAULT'} onChange={(event) => setFormData((prev) => ({ ...prev, targetEvent: event.target.value }))}>
                        {eventTypes.map(e => <option key={e.eventKey} value={e.eventKey}>{e.label}</option>)}
                      </select>`;
  content = content.replace(oldSelect, newSelect);
}

// 8. Event Modal UI
if (!content.includes('Tạo nhóm sự kiện mới')) {
    content = content.replace(
        '    </>\n  );\n}\n',
        `
      {showEventModal && isAdmin && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
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
                      <label className="form-label fw-bold">Tên Icon (Google Material)</label>
                      <input type="text" className="form-control rounded-3" value={eventFormData.icon} onChange={e => setEventFormData(prev => ({...prev, icon: e.target.value}))} placeholder="VD: star" required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Màu sắc</label>
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
`
    );
}


fs.writeFileSync(file, content, 'utf-8');
console.log('Frontend script updated!');
