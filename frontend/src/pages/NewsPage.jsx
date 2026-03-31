import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl, uploadedImageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

function formatDate(dateValue) {
  if (!dateValue) return '';
  if (Array.isArray(dateValue)) {
    const [year, month, day] = dateValue;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0];
  }
  return '';
}

export default function NewsPage() {
  const [email, setEmail] = useState('');
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    // Fetch tin tức từ backend API
    axios.get(`${API_BASE}/api/news`, { withCredentials: true })
      .then(res => setArticles(res.data?.slice(0, 6) || []))
      .catch(err => {
        console.error('News API error:', err);
        setArticles([]); // fallback rỗng — không dùng mock
      });
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã đăng ký!', text: 'Cảm ơn bạn đã quan tâm.', timer: 2000, showConfirmButton: false });
    setEmail('');
  };

  return (
    <div className="bg-surface text-on-background font-body">

      {/* ── ẢNH BÌA CHUNG CHO TRANG TIN TỨC (KHÔNG PHẢI TIN NỔI BẬT) ── */}
      <HeroHeader 
        image={imageUrl('/images/news/news-4.png')}
        altText="GOAT HOTEL Editorial"
      />

      {/* ── TIÊU ĐỀ TRANG CỐ ĐỊNH ──────────────────────────────────── */}
      <div className="bg-surface w-full pt-16 pb-8 px-8 md:px-16 text-center border-b border-outline-variant/10 relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-4">
            GOAT HOTEL Editorial
          </p>
          <h1 className="font-headline text-primary text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-4">
            Tạp chí & Cảm hứng
          </h1>
          <p className="text-on-surface-variant text-base font-body font-light max-w-2xl">
            Lưu giữ những khoảnh khắc, những câu chuyện ẩm thực và nghệ thuật nghỉ dưỡng mang dấu ấn độc bản.
          </p>
        </div>
      </div>

      {/* ── DANH SÁCH BÀI VIẾT (GRID 3 CỘT) ────────────────────────── */}
      <section className="bg-surface-container-low py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-8 md:px-12">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="group relative z-20 flex cursor-pointer flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface no-underline shadow-lg transition-all duration-300 hover:-translate-y-1 hover:no-underline hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95"
              >
                {/* Ảnh bài viết tỉ lệ 16:9 */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={uploadedImageUrl(article.image || article.thumbnail, '/images/news/news-default.png')}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1.5 rounded-sm">
                    <span className="font-label uppercase tracking-widest text-[9px] text-on-surface font-bold">
                      {article.categoryName || article.category || 'Editorial'}
                    </span>
                  </div>
                </div>

                {/* Nội dung tin */}
                <div className="p-8 flex flex-col flex-1">
                  <span className="font-label text-on-surface-variant text-[10px] uppercase tracking-widest mb-3">
                    {article.publishDate || formatDate(article.createdAt)}
                  </span>
                  <h3 className="font-headline text-xl text-primary leading-snug tracking-tight mb-4 group-hover:text-secondary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="font-body text-outline font-light text-sm line-clamp-3 mb-6 flex-1">
                    {article.excerpt || article.summary}
                  </p>
                  
                  <div className="mt-auto flex items-center font-label uppercase tracking-widest text-[10px] text-secondary group-hover:text-primary transition-colors">
                    Tìm hiểu thêm <span className="material-symbols-outlined text-[14px] ml-2">east</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ĐĂNG KÝ BẢN TIN ──────────────────────────────────────── */}
      <section className="bg-surface-container-low border-t border-outline-variant/20 py-14">
        <div className="max-w-xl mx-auto px-8 text-center">
          <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-3">Luôn Kết nối</p>
          <h2 className="font-headline text-primary text-2xl md:text-3xl mb-8 tracking-tight">
            Nhận cảm hứng từ GOAT HOTEL
          </h2>

          <form onSubmit={handleSubscribe} className="flex gap-0 border-b border-outline-variant/40 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant/40 font-body text-sm py-3 px-0 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="font-label uppercase tracking-widest text-xs text-secondary py-3 px-5 hover:text-primary transition-colors whitespace-nowrap"
            >
              ĐĂNG KÝ
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
