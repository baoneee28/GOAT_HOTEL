import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import API_BASE, { formatDateValue, iconUrl, imageUrl, uploadedImageUrl } from '../../config';
import { useAuth } from '../../auth/useAuth';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState({ fullName: 'Admin' });
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const waveChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const waveChartInstance = useRef(null);
  const pieChartInstance = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    }, 1000);

    let active = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [homeRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/home/`, { withCredentials: true }),
          axios.get(`${API_BASE}/api/admin/dashboard/stats`, { withCredentials: true }),
        ]);

        if (!active) return;

        if (homeRes.data?.user_logged_in) {
          setUser(homeRes.data.user_logged_in);
        }

        setStats(statsRes.data || null);
        setLoadError('');
      } catch (error) {
        console.error(error);
        if (!active) return;
        setStats(null);
        setLoadError(error?.response?.data?.message || 'Không thể tải dashboard quản trị lúc này.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!stats || !waveChartRef.current || !pieChartRef.current) {
      return undefined;
    }

    if (waveChartInstance.current) waveChartInstance.current.destroy();
    if (pieChartInstance.current) pieChartInstance.current.destroy();

    waveChartInstance.current = new Chart(waveChartRef.current, {
      type: 'line',
      data: {
        labels: stats.chart_labels || [],
        datasets: [{
          label: 'Doanh thu',
          data: stats.chart_data || [],
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.12)',
          fill: true,
          tension: 0.36,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#7c3aed',
          pointBorderWidth: 2,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.15)' },
            ticks: {
              callback: (value) => `${Math.round(Number(value) / 1000)}k`,
            },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    pieChartInstance.current = new Chart(pieChartRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Sẵn sàng', 'Có lịch sắp tới', 'Đang có khách', 'Bảo trì'],
        datasets: [{
          data: [
            Number(stats.rooms_available || 0),
            Number(stats.rooms_reserved || 0),
            Number(stats.rooms_booked || 0),
            Number(stats.rooms_maintenance || 0),
          ],
          backgroundColor: ['#16a34a', '#f59e0b', '#2563eb', '#64748b'],
          borderWidth: 0,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
            },
          },
        },
      },
    });

    return () => {
      if (waveChartInstance.current) {
        waveChartInstance.current.destroy();
        waveChartInstance.current = null;
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
        pieChartInstance.current = null;
      }
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-warning border-0 shadow-sm" role="alert">
        {loadError || 'Không thể tải dashboard quản trị.'}
      </div>
    );
  }

  const statCards = isAdmin ? [
    {
      label: 'Tổng doanh thu',
      value: `${Number(stats.total_revenue || 0).toLocaleString('vi-VN')}đ`,
      icon: '💰',
      toneClass: 'tone-revenue',
      helper: 'Tổng tiền đã thu thực tế',
    },
    {
      label: 'Khách hàng',
      value: Number(stats.total_customers || 0).toLocaleString('vi-VN'),
      icon: '👥',
      toneClass: 'tone-customers',
      helper: 'Tài khoản khách đang hoạt động',
    },
    {
      label: 'Tổng số phòng',
      value: `${Number(stats.total_rooms || 0)} phòng`,
      icon: '🏨',
      toneClass: 'tone-rooms',
      helper: `${Number(stats.rooms_available || 0)} phòng đang sẵn sàng`,
    },
    {
      label: 'Cần xử lý',
      value: `${Number(stats.pending_count || 0)} đơn`,
      icon: '⏳',
      toneClass: 'tone-pending',
      helper: `${Number(stats.new_contacts || 0)} liên hệ mới chưa đọc`,
    },
  ] : [
    {
      label: 'Check-in hôm nay',
      value: `${Number(stats.today_checkins || 0)} lượt`,
      icon: 'CI',
      toneClass: 'tone-rooms',
      helper: 'Lượt nhận phòng đã ghi nhận trong ngày',
    },
    {
      label: 'Check-out hôm nay',
      value: `${Number(stats.today_checkouts || 0)} lượt`,
      icon: 'CO',
      toneClass: 'tone-pending',
      helper: 'Lượt trả phòng đã hoàn tất trong ngày',
    },
    {
      label: 'Phòng trống',
      value: `${Number(stats.rooms_available || 0)} phòng`,
      icon: 'PT',
      toneClass: 'tone-customers',
      helper: 'Sẵn sàng nhận booking mới',
    },
    {
      label: 'Phòng đang có khách',
      value: `${Number(stats.rooms_booked || 0)} phòng`,
      icon: 'DK',
      toneClass: 'tone-revenue',
      helper: `${Number(stats.rooms_reserved || 0)} phòng có lịch sắp tới`,
    },
  ];

  const quickLinks = isAdmin
    ? [
        { to: '/admin/rooms', label: 'Quản lý phòng' },
        { to: '/admin/room-types', label: 'Loại phòng' },
        { to: '/admin/items', label: 'Vật phẩm' },
        { to: '/admin/news', label: 'Tin tức' },
      ]
    : [
        { to: '/admin/rooms', label: 'Quản lý phòng' },
        { to: '/admin/bookings', label: 'Đơn đặt phòng' },
        { to: '/admin/inbox', label: 'Inbox liên hệ' },
      ];

  const roomTypes = Array.isArray(stats.featured_room_types) ? stats.featured_room_types : [];
  const items = Array.isArray(stats.featured_items) ? stats.featured_items : [];
  const newsList = Array.isArray(stats.featured_news) ? stats.featured_news : [];

  return (
    <>
      <style>{`
        .dashboard-shell {
          display: grid;
          gap: 28px;
        }
        .dashboard-panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
        }
        .dashboard-hero {
          position: relative;
          overflow: hidden;
          padding: 34px;
          color: white;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.18) 0%, transparent 36%),
            linear-gradient(135deg, #111827 0%, #1d4ed8 50%, #7c3aed 100%);
        }
        .dashboard-hero::after {
          content: '';
          position: absolute;
          inset: auto -60px -80px auto;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
        }
        .dashboard-clock {
          font-size: 2.5rem;
          font-weight: 800;
          opacity: 0.16;
          letter-spacing: 0.12em;
          white-space: nowrap;
        }
        .stat-card {
          padding: 22px;
          border-radius: 24px;
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.12);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04);
          height: 100%;
        }
        .stat-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          margin-bottom: 14px;
        }
        .tone-revenue .stat-icon { background: rgba(22,163,74,0.12); }
        .tone-customers .stat-icon { background: rgba(14,165,233,0.12); }
        .tone-rooms .stat-icon { background: rgba(59,130,246,0.12); }
        .tone-pending .stat-icon { background: rgba(245,158,11,0.14); }
        .chart-panel {
          padding: 24px;
          height: 100%;
        }
        .media-panel {
          padding: 24px;
        }
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .room-preview-card {
          overflow: hidden;
          height: 100%;
          border-radius: 24px;
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.14);
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
        }
        .room-preview-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .room-preview-body {
          padding: 18px;
        }
        .item-icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 14px;
        }
        .item-icon-card {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: white;
          padding: 16px 14px;
          text-align: center;
          height: 100%;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
        }
        .item-icon-card img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        .news-preview-card {
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: white;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
          height: 100%;
        }
        .news-preview-card img {
          width: 100%;
          height: 170px;
          object-fit: cover;
          display: block;
        }
        .news-preview-body {
          padding: 18px;
        }
        .quick-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 18px;
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          text-decoration: none;
          font-weight: 700;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          transition: 0.2s ease;
        }
        .quick-link:hover {
          color: white;
          transform: translateY(-1px);
          background: rgba(255,255,255,0.14);
        }
        @media (max-width: 991px) {
          .dashboard-clock {
            font-size: 1.7rem;
          }
          .dashboard-hero {
            padding: 28px;
          }
        }
      `}</style>

      <div className="dashboard-shell">
        <section className="dashboard-panel dashboard-hero d-flex flex-wrap justify-content-between align-items-end gap-4">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="text-uppercase small fw-bold mb-2 opacity-75">{isAdmin ? 'GOAT Admin Dashboard' : 'GOAT Operations Dashboard'}</p>
            <h2 className="fw-bold mb-2">Xin chào, {user.fullName || 'Admin'}!</h2>
            <p className="mb-4 opacity-75" style={{ maxWidth: '640px' }}>
              {isAdmin ? (
                <>
                  Hệ thống đang theo dõi đồng thời phòng nghỉ, tiện ích và nội dung truyền thông.
                  Bạn hiện có <b>{Number(stats.pending_count || 0)}</b> booking chờ xử lý và <b>{Number(stats.new_contacts || 0)}</b> liên hệ mới.
                </>
              ) : (
                <>
                  Đây là bảng điều hành cho ca vận hành hôm nay.
                  Hiện có <b>{Number(stats.rooms_available || 0)}</b> phòng sẵn sàng, <b>{Number(stats.rooms_booked || 0)}</b> phòng đang có khách và <b>{Number(stats.rooms_reserved || 0)}</b> phòng có lịch sắp tới.
                </>
              )}
            </p>
            <div className="d-flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} className="quick-link">{link.label}</Link>
              ))}
            </div>
          </div>
          <div className="dashboard-clock">{time}</div>
        </section>

        <section className="row g-4">
          {statCards.map((card) => (
            <div key={card.label} className="col-md-6 col-xl-3">
              <article className={`stat-card ${card.toneClass}`}>
                <div className="stat-icon">{card.icon}</div>
                <div className="small text-muted mb-2 text-uppercase fw-bold">{card.label}</div>
                <h3 className="fw-bold mb-2">{card.value}</h3>
                <p className="text-muted mb-0 small">{card.helper}</p>
              </article>
            </div>
          ))}
        </section>

        <section className="row g-4">
          {isAdmin ? (
            <>
              <div className="col-xl-8">
                <article className="dashboard-panel chart-panel">
                  <div className="section-head">
                    <div>
                      <p className="small text-uppercase text-muted fw-bold mb-2">Thanh toán gần đây</p>
                      <h4 className="fw-bold mb-0">Biểu đồ tiền đã thu 7 ngày</h4>
                    </div>
                    <span className="badge bg-light text-dark border rounded-pill px-3 py-2">Realtime summary</span>
                  </div>
                  <div style={{ height: '260px', position: 'relative' }}>
                    <canvas ref={waveChartRef}></canvas>
                  </div>
                </article>
              </div>
              <div className="col-xl-4">
                <article className="dashboard-panel chart-panel">
                  <div className="section-head">
                    <div>
                      <p className="small text-uppercase text-muted fw-bold mb-2">Tình trạng buồng phòng</p>
                      <h4 className="fw-bold mb-0">Phân bổ trạng thái</h4>
                    </div>
                  </div>
                  <div style={{ height: '260px', position: 'relative' }}>
                    <canvas ref={pieChartRef}></canvas>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="col-12">
              <article className="dashboard-panel chart-panel">
                <div className="section-head">
                  <div>
                    <p className="small text-uppercase text-muted fw-bold mb-2">Tình trạng buồng phòng</p>
                    <h4 className="fw-bold mb-0">Phân bổ trạng thái hiện tại</h4>
                  </div>
                  <span className="badge bg-light text-dark border rounded-pill px-3 py-2">Vận hành hôm nay</span>
                </div>
                <div className="row g-4 align-items-center">
                  <div className="col-lg-5">
                    <div style={{ height: '260px', position: 'relative' }}>
                      <canvas ref={pieChartRef}></canvas>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <article className="stat-card tone-rooms">
                          <div className="small text-muted mb-2 text-uppercase fw-bold">Check-in hôm nay</div>
                          <h4 className="fw-bold mb-2">{Number(stats.today_checkins || 0)} lượt</h4>
                          <p className="text-muted mb-0 small">Số lượt đã nhận phòng trong ngày hiện tại.</p>
                        </article>
                      </div>
                      <div className="col-md-6">
                        <article className="stat-card tone-pending">
                          <div className="small text-muted mb-2 text-uppercase fw-bold">Check-out hôm nay</div>
                          <h4 className="fw-bold mb-2">{Number(stats.today_checkouts || 0)} lượt</h4>
                          <p className="text-muted mb-0 small">Số lượt đã trả phòng và hoàn tất vận hành.</p>
                        </article>
                      </div>
                      <div className="col-md-6">
                        <article className="stat-card tone-customers">
                          <div className="small text-muted mb-2 text-uppercase fw-bold">Phòng trống</div>
                          <h4 className="fw-bold mb-2">{Number(stats.rooms_available || 0)} phòng</h4>
                          <p className="text-muted mb-0 small">Có thể nhận booking hoặc check-in mới.</p>
                        </article>
                      </div>
                      <div className="col-md-6">
                        <article className="stat-card tone-revenue">
                          <div className="small text-muted mb-2 text-uppercase fw-bold">Phòng đang có khách</div>
                          <h4 className="fw-bold mb-2">{Number(stats.rooms_booked || 0)} phòng</h4>
                          <p className="text-muted mb-0 small">{Number(stats.rooms_reserved || 0)} phòng có lịch sắp tới cần theo dõi.</p>
                        </article>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}
        </section>

        {isAdmin && (
          <>
            <section className="dashboard-panel media-panel">
              <div className="section-head">
                <div>
                  <p className="small text-uppercase text-muted fw-bold mb-2">Hình ảnh loại phòng</p>
                  <h4 className="fw-bold mb-0">Danh mục phòng đang khai thác</h4>
                </div>
                <Link to="/admin/room-types" className="btn btn-sm btn-light border rounded-pill px-3">
                  Mở quản lý loại phòng
                </Link>
              </div>

              <div className="row g-4">
                {roomTypes.map((roomType) => (
                  <div key={roomType.id} className="col-md-6 col-xl-3">
                    <article className="room-preview-card">
                      <img
                        src={uploadedImageUrl(roomType.image, '/images/rooms/standard-room.jpg')}
                        alt={roomType.typeName}
                        className="room-preview-image"
                      />
                      <div className="room-preview-body">
                        <p className="small text-uppercase text-muted fw-bold mb-2">Loại phòng</p>
                        <h5 className="fw-bold mb-2">{roomType.typeName}</h5>
                        <div className="text-primary fw-bold mb-2">
                          {Number(roomType.pricePerNight || 0).toLocaleString('vi-VN')}đ / đêm
                        </div>
                        <div className="small text-muted">
                          {Number(roomType.capacity || 0)} khách • {Number(roomType.itemCount || 0)} tiện ích
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </section>

            <section className="row g-4">
              <div className="col-xl-5">
                <article className="dashboard-panel media-panel h-100">
                  <div className="section-head">
                    <div>
                      <p className="small text-uppercase text-muted fw-bold mb-2">Icon vật phẩm</p>
                      <h4 className="fw-bold mb-0">Tiện ích đang dùng trong hệ thống</h4>
                    </div>
                    <Link to="/admin/items" className="btn btn-sm btn-light border rounded-pill px-3">
                      Mở quản lý vật phẩm
                    </Link>
                  </div>

                  <div className="item-icon-grid">
                    {items.map((item) => (
                      <article key={item.id} className="item-icon-card">
                        <img src={iconUrl(item.image, '/icons/tv.png')} alt={item.name} />
                        <div className="fw-bold small">{item.name}</div>
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              <div className="col-xl-7">
                <article className="dashboard-panel media-panel h-100">
                  <div className="section-head">
                    <div>
                      <p className="small text-uppercase text-muted fw-bold mb-2">Ảnh bài viết</p>
                      <h4 className="fw-bold mb-0">Tin tức gần đây</h4>
                    </div>
                    <Link to="/admin/news" className="btn btn-sm btn-light border rounded-pill px-3">
                      Mở quản lý tin tức
                    </Link>
                  </div>

                  <div className="row g-4">
                    {newsList.map((news) => (
                      <div key={news.id} className="col-md-6">
                        <article className="news-preview-card">
                          <img
                            src={imageUrl(news.image, '/images/news/news-default.png')}
                            alt={news.title}
                          />
                          <div className="news-preview-body">
                            <div className="small text-muted mb-2">{formatDateValue(news.createdAt) || 'Mới cập nhật'}</div>
                            <h5 className="fw-bold mb-2">{news.title}</h5>
                            <p className="text-muted small mb-0">
                              {news.summary || 'Bài viết hiện chưa có mô tả ngắn.'}
                            </p>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
