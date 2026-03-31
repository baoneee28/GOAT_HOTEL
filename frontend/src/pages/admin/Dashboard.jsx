import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../config';
import Chart from 'chart.js/auto';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState({ fullName: 'Admin' });
  const [time, setTime] = useState('');
  
  const waveChartRef = useRef(null);
  const pieChartRef = useRef(null);
  let waveChartInstance = useRef(null);
  let pieChartInstance = useRef(null);

  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    }, 1000);

    // Fetch User
    axios.get(`${API_BASE}/api/home/`, { withCredentials: true }).then(res => {
      if (res.data.user_logged_in) setUser(res.data.user_logged_in);
    });

    // Fetch Stats
    axios.get(`${API_BASE}/api/admin/dashboard/stats`, { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(err => console.error(err));

    return () => clearInterval(timer);
  }, []);

  const formatCurrencyShort = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };

  useEffect(() => {
    if (stats && waveChartRef.current && pieChartRef.current) {
        if (waveChartInstance.current) waveChartInstance.current.destroy();
        if (pieChartInstance.current) pieChartInstance.current.destroy();

        waveChartInstance.current = new Chart(waveChartRef.current, {
            type: 'line',
            data: {
                labels: stats.chart_labels,
                datasets: [{
                    label: 'Doanh thu',
                    data: stats.chart_data,
                    borderColor: '#4e31aa',
                    backgroundColor: 'rgba(78, 49, 170, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4e31aa',
                    pointBorderWidth: 2,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true, grid: { borderDash: [5, 5] },
                        ticks: { font: { size: 10 }, callback: value => `${formatCurrencyShort(value)}đ` }
                    },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });

        pieChartInstance.current = new Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
                labels: ['Phòng trống', 'Có lịch đặt', 'Đang thuê', 'Bảo trì'],
                datasets: [{
                    data: [stats.rooms_available, stats.rooms_reserved || 0, stats.rooms_booked, stats.rooms_maintenance],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
            }
        });
    }
  }, [stats]);

  if (!stats) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <>
      <style>{`
        .stat-box { background: white; border-radius: 24px; padding: 25px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.03); height: 100%; transition: 0.3s; }
        .stat-box:hover { transform: translateY(-5px); }
        .chart-container { background: white; border-radius: 24px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); margin-top: 30px; }
        .welcome-card { background: linear-gradient(135deg, #4e31aa 0%, #8b5cf6 100%); color: white; border-radius: 24px; padding: 35px; margin-bottom: 30px; box-shadow: 0 15px 35px rgba(78,49,170,0.2); position: relative; overflow: hidden; }
        .icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 15px; }
        #realtime-clock { font-size: 2.5rem; font-weight: 800; opacity: 0.2; position: absolute; right: 30px; top: 50%; transform: translateY(-50%); letter-spacing: 2px; pointer-events: none; }
      `}</style>
      
      <div className="welcome-card d-flex justify-content-between align-items-center">
          <div style={{ zIndex: 2 }}>
              <h2 className="fw-bold mb-2">Xin chào, <span>{user.fullName}</span>! 👋</h2>
              <p className="mb-0 opacity-75">Hệ thống đang hoạt động ổn định. Bạn có <b>{stats.pending_count}</b> đơn đặt phòng cần duyệt.</p>
              <p className="mb-0 opacity-75 mt-2">Inbox hiện có <b>{stats.new_contacts || 0}</b> liên hệ mới từ khách.</p>
          </div>
          <div id="realtime-clock">{time}</div>
      </div>

      <div className="row g-4">
          <div className="col-md-3">
              <div className="stat-box">
                  <div className="icon-box bg-success-subtle text-success">💰</div>
                  <div className="small text-muted mb-1 text-uppercase fw-bold">Tổng doanh thu</div>
                  <h3 className="fw-bold mb-0"><span>{stats.total_revenue.toLocaleString('vi-VN')}</span>đ</h3>
              </div>
          </div>
          <div className="col-md-3">
              <div className="stat-box">
                  <div className="icon-box bg-info-subtle text-info">👥</div>
                  <div className="small text-muted mb-1 text-uppercase fw-bold">Khách hàng</div>
                  <h3 className="fw-bold mb-0">{stats.total_customers.toLocaleString('vi-VN')}</h3>
              </div>
          </div>
          <div className="col-md-3">
              <div className="stat-box">
                  <div className="icon-box bg-primary-subtle text-primary">🏣</div>
                  <div className="small text-muted mb-1 text-uppercase fw-bold">Tổng số phòng</div>
                  <h3 className="fw-bold mb-0"><span>{stats.total_rooms}</span> Phòng</h3>
                  <div className="small text-muted mt-2">
                    Trống: {stats.rooms_available} · Có lịch: {stats.rooms_reserved || 0} · Đang thuê: {stats.rooms_booked} · Bảo trì: {stats.rooms_maintenance}
                  </div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="stat-box">
                  <div className="icon-box bg-warning-subtle text-warning">⏳</div>
                  <div className="small text-muted mb-1 text-uppercase fw-bold">Chờ xử lý</div>
                  <h3 className="fw-bold mb-0"><span>{stats.pending_count}</span> Đơn</h3>
              </div>
          </div>
      </div>

      <div className="row">
          <div className="col-lg-8">
              <div className="chart-container h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Biểu đồ doanh thu tuần</h5>
                      <span className="badge bg-light text-dark border">7 ngày gần nhất</span>
                  </div>
                  <div style={{ height: '180px', position: 'relative' }}>
                      <canvas ref={waveChartRef}></canvas>
                  </div>
              </div>
          </div>
          <div className="col-lg-4">
              <div className="chart-container h-100">
                  <h5 className="fw-bold mb-3">Trạng thái phòng</h5>
                  <div style={{ position: 'relative', height: '160px' }}>
                      <canvas ref={pieChartRef}></canvas>
                  </div>
                  
                  <div className="mt-2 text-center small text-muted">
                      <span className="mx-2">● Trống: <span>{stats.rooms_available}</span></span>
                      <span className="mx-2">● Có lịch: <span>{stats.rooms_reserved || 0}</span></span>
                      <span className="mx-2">● Đang thuê: <span>{stats.rooms_booked}</span></span>
                      <span className="mx-2">● Bảo trì: <span>{stats.rooms_maintenance}</span></span>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}
