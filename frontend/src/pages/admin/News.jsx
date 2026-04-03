import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import API_BASE, { formatDateValue, uploadedImageUrl } from '../../config';

const Swal = window.Swal;

export default function News() {
  const [data, setData] = useState({ newsList: [], totalPages: 1, currentPage: 1 });
  const [featuredNews, setFeaturedNews] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    summary: '',
    content: '',
    image: '',
  });

  const fetchData = useCallback(async () => {
    const res = await axios.get(`${API_BASE}/api/news/admin?q=${q}&page=${page}`, { withCredentials: true });
    setData({
      newsList: Array.isArray(res.data?.newsList) ? res.data.newsList : [],
      totalPages: Number(res.data?.totalPages || 1),
      currentPage: Number(res.data?.currentPage || page),
    });
    setFeaturedNews(Array.isArray(res.data?.featuredNews) ? res.data.featuredNews : []);
  }, [page, q]);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/news/admin?q=${q}&page=${page}`, { withCredentials: true });
        if (!isActive) return;

        setData({
          newsList: Array.isArray(res.data?.newsList) ? res.data.newsList : [],
          totalPages: Number(res.data?.totalPages || 1),
          currentPage: Number(res.data?.currentPage || page),
        });
        setFeaturedNews(Array.isArray(res.data?.featuredNews) ? res.data.featuredNews : []);
      } catch (err) {
        if (isActive) {
          console.error(err);
        }
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, [page, q]);

  const featuredByNewsId = useMemo(() => {
    const result = new Map();
    featuredNews.forEach((entry) => {
      if (entry?.news?.id) {
        result.set(entry.news.id, entry);
      }
    });
    return result;
  }, [featuredNews]);

  const openModalForNews = (newsItem) => {
    setFormData({
      id: newsItem?.id || '',
      title: newsItem?.title || '',
      summary: newsItem?.summary || '',
      content: newsItem?.content || '',
      image: newsItem?.image || '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await axios.delete(`${API_BASE}/api/news/admin/${id}`, { withCredentials: true });
        if (res.data?.success) {
          Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
          await fetchData();
        } else {
          Swal.fire({ icon: 'error', title: 'Lỗi', text: res.data?.message || 'Không thể xóa bài viết này.' });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      let finalImage = formData.image.trim();

      if (fileInputRef.current?.files?.length) {
        const uploadData = new FormData();
        uploadData.append('file', fileInputRef.current.files[0]);
        uploadData.append('type', 'news');

        const uploadRes = await axios.post(`${API_BASE}/api/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });

        if (uploadRes.data?.success) {
          finalImage = uploadRes.data.fileName;
        }
      }

      const payload = { ...formData, image: finalImage };
      const res = await axios.post(`${API_BASE}/api/news/admin`, payload, { withCredentials: true });
      if (res.data?.success) {
        Swal.fire({ icon: 'success', title: 'Thành công', timer: 1500, showConfirmButton: false });
        setShowModal(false);
        await fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Có lỗi xảy ra' });
    }
  };

  const handleAddFeatured = async (newsId) => {
    try {
      const res = await axios.post(`${API_BASE}/api/news/admin/featured/${newsId}`, {}, { withCredentials: true });
      if (res.data?.success) {
        setFeaturedNews(Array.isArray(res.data?.featuredNews) ? res.data.featuredNews : []);
        Swal.fire({ icon: 'success', title: 'Đã đưa lên nổi bật', timer: 1400, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể cập nhật bản tin nổi bật.' });
    }
  };

  const handleRemoveFeatured = async (featuredId) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/news/admin/featured/${featuredId}`, { withCredentials: true });
      if (res.data?.success) {
        setFeaturedNews(Array.isArray(res.data?.featuredNews) ? res.data.featuredNews : []);
        Swal.fire({ icon: 'success', title: 'Đã gỡ khỏi nổi bật', timer: 1400, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể gỡ bài viết khỏi bản tin nổi bật.' });
    }
  };

  const handleMoveFeatured = async (featuredId, direction) => {
    const currentIndex = featuredNews.findIndex((entry) => entry.id === featuredId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= featuredNews.length) {
      return;
    }

    const reordered = [...featuredNews];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    try {
      const res = await axios.patch(`${API_BASE}/api/news/admin/featured/reorder`, {
        featuredIds: reordered.map((entry) => entry.id),
      }, { withCredentials: true });

      if (res.data?.success) {
        setFeaturedNews(Array.isArray(res.data?.featuredNews) ? res.data.featuredNews : []);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: err.response?.data?.message || 'Không thể cập nhật thứ tự nổi bật.' });
    }
  };

  return (
    <>
      <style>{`
        .news-img { width: 80px; height: 50px; object-fit: cover; border-radius: 8px; }
        .featured-news-card {
          border: 1px solid #ece7f8;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #faf8ff 100%);
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Tin tức & Sự kiện</h2>
          <p className="text-muted mb-0">Quản lý nội dung truyền thông khách sạn và chọn bài lên bản tin nổi bật</p>
        </div>
        <button
          className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm"
          style={{ background: 'var(--primary-color)', border: 'none' }}
          onClick={() => openModalForNews(null)}
        >
          + Viết bài mới
        </button>
      </div>

      <div className="card-table mb-4">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h5 className="fw-bold mb-1">Bản tin nổi bật</h5>
            <p className="text-muted mb-0">Chọn từ các bài đã viết để hiển thị ở `featured_news` trên trang chủ.</p>
          </div>
          <span className="badge rounded-pill text-bg-light px-3 py-2">{featuredNews.length} bài đang nổi bật</span>
        </div>
        <div className="p-4">
          {featuredNews.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {featuredNews.map((entry, index) => (
                <div key={entry.id} className="featured-news-card p-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-pill px-3 py-2 fw-bold" style={{ background: '#f4efff', color: '#5b3db5', minWidth: '64px', textAlign: 'center' }}>
                      #{index + 1}
                    </div>
                    <img
                      src={uploadedImageUrl(entry?.news?.image, '/images/news/news-default.png')}
                      className="news-img"
                      alt={entry?.news?.title || 'Featured news'}
                    />
                    <div>
                      <div className="fw-bold">{entry?.news?.title || 'Bài viết đã bị thiếu dữ liệu'}</div>
                      <div className="text-muted small">{formatDateValue(entry?.news?.createdAt) || 'Chưa cập nhật ngày đăng'}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-light" disabled={index === 0} onClick={() => handleMoveFeatured(entry.id, 'up')}>↑</button>
                    <button className="btn btn-sm btn-light" disabled={index === featuredNews.length - 1} onClick={() => handleMoveFeatured(entry.id, 'down')}>↓</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveFeatured(entry.id)}>Gỡ</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">Chưa có bài nào được chọn lên `featured_news`. Bạn có thể thêm ngay từ danh sách bên dưới.</div>
          )}
        </div>
      </div>

      <div className="card-table">
        <div className="p-4 border-bottom">
          <input
            type="text"
            className="form-control rounded-pill px-4"
            style={{ maxWidth: '350px' }}
            placeholder="Tìm tiêu đề..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="table-responsive">
          <table className="table mb-0 px-4">
            <thead>
              <tr>
                <th className="ps-4 py-3">Ảnh</th>
                <th className="py-3">Tiêu đề</th>
                <th className="py-3">Nổi bật</th>
                <th className="py-3">Ngày đăng</th>
                <th className="text-end pe-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.newsList.length > 0 ? data.newsList.map((newsItem) => {
                const featuredEntry = featuredByNewsId.get(newsItem.id);
                return (
                  <tr key={newsItem.id}>
                    <td className="ps-4 py-3">
                      <img src={uploadedImageUrl(newsItem.image, '/images/news/news-default.png')} className="news-img" alt={newsItem.title || 'News'} />
                    </td>
                    <td className="fw-bold py-3">{newsItem.title}</td>
                    <td className="py-3">
                      {featuredEntry ? (
                        <span className="badge rounded-pill text-bg-warning">Đang nổi bật #{(featuredEntry.displayOrder ?? 0) + 1}</span>
                      ) : (
                        <span className="text-muted small">Chưa chọn</span>
                      )}
                    </td>
                    <td className="py-3">{formatDateValue(newsItem.createdAt) || 'Chưa cập nhật'}</td>
                    <td className="text-end pe-4 py-3">
                      <button
                        className={`btn btn-sm me-1 ${featuredEntry ? 'btn-warning text-dark' : 'btn-light text-warning'}`}
                        onClick={() => (featuredEntry ? handleRemoveFeatured(featuredEntry.id) : handleAddFeatured(newsItem.id))}
                        title={featuredEntry ? 'Gỡ khỏi bản tin nổi bật' : 'Đưa lên bản tin nổi bật'}
                      >
                        {featuredEntry ? '★' : '☆'}
                      </button>
                      <button className="btn btn-sm btn-light text-primary me-1" onClick={() => openModalForNews(newsItem)}>✎</button>
                      <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(newsItem.id)}>🗑</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">Chưa có bài viết nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div className="p-4 d-flex justify-content-end border-top">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((prev) => prev - 1)}>‹</button>
                </li>
                {[...Array(data.totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${i + 1 === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= data.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((prev) => prev + 1)}>›</button>
                </li>
              </ul>
            </nav>
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
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mô tả ngắn</label>
                    <textarea
                      className="form-control rounded-3"
                      rows="2"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Đường dẫn ảnh bìa</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/images/news/news-1.jpg hoặc https://..."
                    />
                    <div className="form-text">Có thể nhập đường dẫn ảnh có sẵn hoặc chọn file mới ở ô bên dưới.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Hoặc tải ảnh mới</label>
                    <input type="file" ref={fileInputRef} name="image" className="form-control rounded-3" accept="image/*" />
                    <div className="form-text">Ảnh tải lên sẽ được lưu vào `backend/static/uploads/news`.</div>
                    <div className="mt-3">
                      <img src={uploadedImageUrl(formData.image, '/images/news/news-default.png')} className="news-img" alt="Xem trước ảnh bìa" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Nội dung chi tiết</label>
                    <textarea
                      name="content"
                      className="form-control rounded-3"
                      rows="6"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 fw-bold"
                    style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '12px' }}
                  >
                    Lưu bài viết
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
