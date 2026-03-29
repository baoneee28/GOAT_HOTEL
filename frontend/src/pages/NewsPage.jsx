import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// ─── Static article data from Stitch design ───────────────────────────────────
const FEATURED = {
  id: 1,
  category: 'Signature Ritual',
  title: 'The Art of Sunset Sabrage at the Azure Deck',
  excerpt:
    'Discover the curated evening ritual that has become the signature of our coastal sanctuary, blending Napoleonic tradition with modern mixology.',
  date: 'October 5, 2024',
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8M-FaRoCO8wBYor7LaCaMvUdbWL9eJFdQhitFz_hFpNhqxUJgG5pgJ0_DH7OcDG5WXztdRva1kdtFooZZ5PpRlLCpJY8fpLhH7gY3zch59Z7NNFj__0qpgwy8ddNXY70Ej3IBUbFu-Om1PRnoYyYYv9FT2gJRda9MYu9VsJXcCwSK1yndY3etLlA2F8Ikw9qOJARK44RpziXj9C2FS6v2A74vm5JAoetNVOWNL2KPzv0UC5BY5SThqpEjpHtRxmCDqYt1BZquypQ',
};

const ARTICLES = [
  {
    id: 2,
    category: 'Curation & Narrative',
    title: 'Unveiling the Autumn Tasting Menu: A Dialogue with Soil',
    date: 'September 12, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
  {
    id: 3,
    category: 'Wellness',
    title: 'Sovereign Silence: The Reimagined Spa Philosophy',
    date: 'August 28, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
  {
    id: 4,
    category: 'Architecture',
    title: 'Modern Heritage: The Architecture of the Gilt Wing',
    date: 'August 15, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
  {
    id: 5,
    category: 'Exploration',
    title: 'Beyond the Gates: Secret Coves of the Azure Coast',
    date: 'July 30, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
  {
    id: 6,
    category: 'Events',
    title: 'Summer Gala: A Night of Azure Elegance',
    date: 'July 10, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
  {
    id: 7,
    category: 'Mixology',
    title: 'The Golden Hour: Mixology and the Azure Spirit',
    date: 'June 22, 2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCpkBvEAGb7XWrPtGZ_R3t8T0FwbQK1_nOsT6y3cV-E_Ny0dHxM2F-TzM7fqaV4KnXqFHBhpHVlV8IxiT4R4BrSXEXFUxe4CK_q8qLxI7wq9PJhRUFP3KWlJwYRrXBBxlxjEpOk9JJfFHEcuUMYXcHnz8E3EJrSTiJJvhCAuQb8K1vvUbS5s8BDW3F5xHvBFXvZKRsJu7vVJTlAW4JXVmjFhE5y6i5bQhQWJxYXGAiRvSiHb-cTAJ2YQ',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewsPage() {
  const [email, setEmail] = useState('');
  const [articles, setArticles] = useState([]);

  // Try to fetch from backend; fall back to static data
  useEffect(() => {
    axios.get('http://localhost:8080/api/news/')
      .then(res => {
        if (res.data && res.data.length > 0) setArticles(res.data);
        else setArticles(ARTICLES);
      })
      .catch(() => setArticles(ARTICLES));
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Đã đăng ký!', text: 'Cảm ơn bạn đã quan tâm.', timer: 2000, showConfirmButton: false });
    setEmail('');
  };

  const list = articles.length > 0 ? articles : ARTICLES;

  return (
    <div className="bg-surface text-on-background">

      {/* ── HERO: Featured Article ─────────────────────────────────────────── */}
      <section className="relative w-full min-h-[70vh] flex items-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={FEATURED.image}
            alt={FEATURED.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-8 md:px-16 pb-16 md:pb-24">
          <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-4">
            {FEATURED.category}
          </p>
          <h1 className="font-headline text-white text-3xl md:text-5xl leading-tight tracking-tight max-w-2xl mb-6">
            {FEATURED.title}
          </h1>
          <p className="text-white/70 text-base md:text-lg font-body font-light max-w-xl mb-8">
            {FEATURED.excerpt}
          </p>
          <div className="flex items-center gap-6">
            <Link
              to={`/news/${FEATURED.id}`}
              className="font-label uppercase tracking-widest text-xs text-white border-b border-secondary pb-1 hover:text-secondary transition-colors"
            >
              ĐỌC BÀI VIẾT →
            </Link>
            <span className="font-label text-xs text-white/40 uppercase tracking-wider">{FEATURED.date}</span>
          </div>
        </div>
      </section>

      {/* ── LATEST JOURNALS ───────────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-8 md:px-16">

          {/* Section header */}
          <div className="flex items-center justify-between mb-14">
            <div>
              <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-3">
                Bài viết Mới nhất
              </p>
              <h2 className="font-headline text-on-surface text-3xl md:text-4xl tracking-tight">
                Câu chuyện của Chúng tôi
              </h2>
            </div>
          </div>

          {/* Article grid — 2 columns on md+, stacked list on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-0 divide-y divide-outline-variant/20">
            {list.map((article, idx) => (
              <Link
                key={article.id ?? idx}
                to={`/news/${article.id}`}
                className="group flex gap-6 py-8 hover:bg-surface-container transition-colors px-2 -mx-2"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-sm bg-surface-container-high">
                  <img
                    src={article.image ?? article.thumbnail}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col justify-center gap-2 min-w-0">
                  <p className="font-label uppercase tracking-[0.2em] text-secondary text-[10px]">
                    {article.category}
                  </p>
                  <h3 className="font-headline text-on-surface text-base leading-snug tracking-tight group-hover:text-secondary transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="font-label text-on-surface-variant text-xs uppercase tracking-wider">
                    {article.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER CTA ────────────────────────────────────────────────── */}
      <section className="bg-primary py-20 md:py-28">
        <div className="max-w-xl mx-auto px-8 text-center">
          <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-4">
            Luôn Kết nối
          </p>
          <h2 className="font-headline text-white text-3xl md:text-4xl mb-4 tracking-tight">
            Nhận thông báo qua Email
          </h2>
          <p className="text-white/50 text-sm font-body mb-10">
            Bằng cách đăng ký, bạn đồng ý với Chính sách Bảo mật và Điều khoản Dịch vụ của chúng tôi.
          </p>

          <form onSubmit={handleSubscribe} className="flex gap-0">
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent border-b border-white/20 focus:border-secondary text-white placeholder-white/30 font-body text-sm py-3 px-0 focus:outline-none focus:ring-0 transition-colors"
            />
            <button
              type="submit"
              className="font-label uppercase tracking-widest text-xs text-secondary border-b border-secondary py-3 px-6 hover:text-white hover:border-white transition-all ml-4"
            >
              ĐĂNG KÝ
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
