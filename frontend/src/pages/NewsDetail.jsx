import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE, { imageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

export default function NewsDetail() {
  const { id } = useParams(); // URL path /news/:id (hiện đang dùng truyền slug)
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    // Fetch tin tức từ backend API theo slug hoặc id
    axios.get(`${API_BASE}/api/news/${id}`, { withCredentials: true })
      .then(res => {
        if (!res.data) { navigate('/news'); return; }
        setNews(res.data);
        // Fetch tin liên quan
        return axios.get(`${API_BASE}/api/news`, { withCredentials: true });
      })
      .then(res => {
        if (res) {
          setRelated((res.data || []).filter(n => String(n.id) !== String(id) && n.slug !== id).slice(0, 3));
        }
      })
      .catch(() => navigate('/news'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, navigate]);

  if (!news) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="font-label uppercase tracking-widest text-xs text-on-surface-variant animate-pulse">Đang tải nội dung...</p>
    </div>
  );

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">

      {/* ── BẮT TAY COMPONENT HERO ĐỒNG NHẤT ──────────────────────── */}
      <HeroHeader image={imageUrl(news.image || news.heroImage)} altText={news.title} />

      {/* ── TIÊU ĐỀ BÀI VIẾT (TÁCH KHỎI ẢNH ĐỂ KHÔNG ĐÈ NAVBAR) ───── */}
      <div className="w-full bg-surface pt-12 pb-4 px-8 md:px-16 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="font-label uppercase tracking-[0.3em] text-secondary text-xs mb-4">
            {news.categoryName} <span className="text-on-surface-variant ml-2 opacity-60">• {news.publishDate}</span>
          </p>
          <h1 className="font-headline text-primary text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
            {news.title}
          </h1>
        </div>
      </div>

      {/* ── THANH BREADCRUMB ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-6 border-b border-outline-variant/20 w-full mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Trở lại Tạp chí
          </Link>
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest hidden md:block">
            {news.categoryName} | GOAT HOTEL Editorial
          </span>
        </div>
      </div>

      {/* ── NỘI DUNG CHÍNH (MAIN GRID) ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-20">

        {/* LEFT: Article Body ───────────────────────────────────── */}
        <article className="space-y-10">
          
          {/* Summary / Lead Paragraph */}
          {news.excerpt && (
            <p className="text-on-surface text-xl md:text-2xl font-headline font-light leading-relaxed border-l-4 border-secondary pl-8">
              {news.excerpt}
            </p>
          )}

          {/* HTML Content Render */}
          <div
            className="text-on-surface-variant font-light text-[17px] md:text-xl leading-[1.85] [&>p]:mb-8"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {/* Signature / Author */}
          <div className="mt-16 pt-8 border-t border-outline-variant/30 flex items-center justify-between">
            <div>
              <p className="font-label uppercase tracking-widest text-xs text-secondary">Người viết</p>
              <p className="font-headline text-lg mt-1">Ban Biên Tập GOAT Hotel</p>
            </div>
            <div className="flex gap-4">
              {/* Share actions */}
              <button className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container hover:text-secondary transition-colors">
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
            </div>
          </div>
        </article>

        {/* RIGHT: Sidebar ───────────────────────────────────────── */}
        <aside className="space-y-16 lg:pt-0 pt-10 border-t lg:border-t-0 border-outline-variant/20">

          {/* Related Articles Widgets */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-[1px] bg-secondary"></span>
              <p className="font-label uppercase tracking-[0.25em] text-secondary text-[11px] font-bold">
                Có thể bạn quan tâm
              </p>
            </div>
            
            <div className="space-y-8">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.slug || item.id}`}
                  className="group flex flex-col gap-4 cursor-pointer"
                >
                  <div className="w-full aspect-video overflow-hidden rounded-md bg-surface-container-high relative">
                    <img
                      src={imageUrl(item.image || item.thumbnail)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="font-label uppercase tracking-[0.15em] text-secondary text-[9px]">
                      {item.categoryName} <span className="opacity-50 ml-1">• {item.publishDate}</span>
                    </p>
                    <h4 className="font-headline text-on-surface text-[15px] leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Banner Promo / Collection CTA */}
          <div className="bg-primary/5 p-8 border border-primary/10 rounded-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-[10px] mb-3 relative z-10">
              Trải nghiệm thực tế
            </p>
            <h3 className="font-headline text-primary text-2xl mb-4 leading-snug relative z-10">
              Biến cảm hứng thành kỳ nghỉ trong mơ
            </h3>
            <p className="text-on-surface-variant text-sm font-light font-body mb-8 line-clamp-3 relative z-10">
              Đừng chỉ đọc về sự xa hoa. Hãy để GOAT HOTEL trở thành điểm dừng chân vương giả tiếp theo của bạn.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center justify-center w-full py-4 text-center font-label uppercase tracking-widest text-[11px] text-on-primary bg-primary rounded-sm hover:bg-secondary transition-all active:scale-95 shadow-md relative z-10"
            >
              Đặt phòng ngay
            </Link>
          </div>

        </aside>

      </section>

    </div>
  );
}
