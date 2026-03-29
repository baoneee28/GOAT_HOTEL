import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8M-FaRoCO8wBYor7LaCaMvUdbWL9eJFdQhitFz_hFpNhqxUJgG5pgJ0_DH7OcDG5WXztdRva1kdtFooZZ5PpRlLCpJY8fpLhH7gY3zch59Z7NNFj__0qpgwy8ddNXY70Ej3IBUbFu-Om1PRnoYyYYv9FT2gJRda9MYu9VsJXcCwSK1yndY3etLlA2F8Ikw9qOJARK44RpziXj9C2FS6v2A74vm5JAoetNVOWNL2KPzv0UC5BY5SThqpEjpHtRxmCDqYt1BZquypQ';

const STATIC = {
  id: 1,
  category: 'Signature Ritual',
  title: 'The Art of Sunset Sabrage at the Azure Deck',
  date: 'October 5, 2024',
  image: HERO_IMG,
  content: `As the sun dips below the horizon, painting the Amalfi Coast in hues of burnt orange and deep indigo, a timeless ritual begins. The tradition of sabrage is not merely about opening a bottle; it is a celebration of the evening's arrival.

There is a specific vibration in the air at the Azure Deck during the twilight hour. It is a moment where time seems to expand, held in suspension by the rhythmic crashing of the Tyrrhenian Sea against the limestone cliffs below. Guests gather, not in a rush, but with the quiet anticipation of those who understand that luxury is found in the pauses between actions.

Our head sommelier, Marcus Vane, approaches the pedestal with a heavy, silver-hilted saber. The bottle—a vintage Reserve Sovereign Brut—is chilled to precisely five degrees Celsius. This is essential, he explains. The pressure inside the bottle, combined with the cold glass, makes the crystalline structure brittle along the seam.

The ritual has its roots in the Napoleonic era, where the cavalry would celebrate victories with whatever tools were at hand. At The Sovereign, we have refined this martial display into an art form. It marks the transition from the warmth of the sun to the intimacy of the stars, signaling that the night has officially begun.`,
  pullQuote: '"Sabrage is the ultimate dialogue between elegance and force. It is the exclamation point at the end of a perfect day."',
  pullQuoteAuthor: 'Marcus Vane, Head Sommelier',
};

const RELATED = [
  { id: 2, category: 'Gastronomy', title: "Harvesting the Deep: A Chef's Guide to Local Waters", date: 'Sept 12, 2024', image: HERO_IMG },
  { id: 3, category: 'Wellness', title: 'The Midnight Spa: Rejuvenation Under the Moon', date: 'Aug 29, 2024', image: HERO_IMG },
  { id: 4, category: 'Design', title: 'Bespoke Suite Design: The Sovereign Philosophy', date: 'July 15, 2024', image: HERO_IMG },
];

export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [related, setRelated] = useState(RELATED);

  useEffect(() => {
    setNews(null);
    axios.get(`http://localhost:8080/api/news/${id}`, { withCredentials: true })
      .then(res => setNews(res.data ?? STATIC))
      .catch(() => setNews(STATIC));

    axios.get('http://localhost:8080/api/news/latest', { withCredentials: true })
      .then(res => {
        if (res.data?.length > 0)
          setRelated(res.data.filter(n => n.id !== parseInt(id)).slice(0, 3));
      })
      .catch(() => {});
  }, [id]);

  if (!news) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="font-label uppercase tracking-widest text-xs text-on-surface-variant animate-pulse">Đang tải...</p>
    </div>
  );

  const paragraphs = typeof news.content === 'string'
    ? news.content.split('\n\n').filter(Boolean)
    : [];

  return (
    <div className="bg-surface text-on-surface font-body">

      {/* ── HERO IMAGE ────────────────────────────────────────────── */}
      <section className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden">
        <img
          src={news.image ? `http://localhost:8080/uploads/${news.image}` : HERO_IMG}
          alt={news.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent"></div>

        {/* Overlay title */}
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-8 md:px-16 pb-12">
          <p className="font-label uppercase tracking-[0.3em] text-secondary text-xs mb-3">
            {news.category ?? STATIC.category}
          </p>
          <h1 className="font-headline text-white text-3xl md:text-5xl leading-tight tracking-tight">
            {news.title}
          </h1>
        </div>
      </section>

      {/* ── BACK NAV ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-6 border-b border-outline-variant/20">
        <div className="flex items-center justify-between">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại Tin tức
          </Link>
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
            {news.date ?? STATIC.date}
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">

        {/* LEFT: Article Body ───────────────────────────────────── */}
        <article className="lg:col-span-2 space-y-8">

          {/* Summary / lead */}
          {news.summary && (
            <p className="text-on-surface text-lg md:text-xl font-light leading-relaxed border-l-2 border-secondary pl-6">
              {news.summary}
            </p>
          )}

          {/* Body paragraphs or HTML */}
          {news.content && typeof news.content === 'string' && news.content.includes('<') ? (
            <div
              className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          ) : (
            <div className="space-y-6">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-on-surface-variant leading-relaxed text-base md:text-lg font-light">
                  {p}
                </p>
              ))}
            </div>
          )}

          {/* Pull quote */}
          {(news.pullQuote ?? STATIC.pullQuote) && (
            <blockquote className="my-12 border-l-4 border-secondary pl-8 py-4">
              <p className="font-headline text-xl md:text-2xl text-on-surface italic leading-snug">
                {news.pullQuote ?? STATIC.pullQuote}
              </p>
              <footer className="mt-4 font-label text-xs uppercase tracking-widest text-secondary">
                — {news.pullQuoteAuthor ?? STATIC.pullQuoteAuthor}
              </footer>
            </blockquote>
          )}

          {/* Tradition note */}
          {!news.content?.includes('<') && (
            <div className="bg-surface-container-low px-6 py-5 flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                schedule
              </span>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Truyền thống được gìn giữ: Nghi thức buổi tối của The Sovereign diễn ra lúc 18:45 hàng ngày.
              </p>
            </div>
          )}
        </article>

        {/* RIGHT: Sidebar ───────────────────────────────────────── */}
        <aside className="lg:col-span-1 space-y-10">

          {/* Related Articles */}
          <div>
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-6">
              Bài viết Liên quan
            </p>
            <div className="space-y-6">
              {related.map((item, i) => (
                <Link
                  key={item.id ?? i}
                  to={`/news/${item.id}`}
                  className="group flex gap-4 hover:bg-surface-container-low p-2 -mx-2 transition-colors"
                >
                  <div className="flex-shrink-0 w-20 h-16 overflow-hidden rounded-sm bg-surface-container-high">
                    <img
                      src={item.image ? `http://localhost:8080/uploads/${item.image}` : HERO_IMG}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-1 min-w-0">
                    <p className="font-label uppercase tracking-[0.15em] text-secondary text-[10px]">
                      {item.category}
                    </p>
                    <h4 className="font-headline text-on-surface text-sm leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="font-label text-on-surface-variant text-[10px] uppercase tracking-wider">
                      {item.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Suite CTA */}
          <div className="bg-primary p-8 text-white">
            <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-3">
              Bộ sưu tập
            </p>
            <h3 className="font-headline text-xl mb-3 leading-snug">
              Trải nghiệm Sự Thoải mái Tuyệt đỉnh trong Các Phòng của Chúng tôi
            </h3>
            <p className="text-white/50 text-sm font-body mb-6">
              Khám phá một khu bảo tồn được thiết kế dành cho những ai tìm kiếm sự phi thường trong từng chi tiết.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 font-label uppercase tracking-widest text-xs text-secondary border-b border-secondary/30 hover:border-secondary transition-all pb-0.5"
            >
              Xem Bộ sưu tập
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </aside>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-primary py-10 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-headline italic text-xl text-white">GOAT HOTEL</div>
          <div className="flex gap-8">
            {['Chính sách Bảo mật', 'Điều khoản Dịch vụ', 'Báo chí', 'Bền vững'].map(link => (
              <a key={link} href="#" className="font-label uppercase tracking-widest text-[10px] text-white/40 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="font-label text-[10px] text-white/30 uppercase tracking-widest">
            © 2024 GOAT HOTEL
          </p>
        </div>
      </footer>
    </div>
  );
}
