import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary w-full border-t border-white/5">
      {/* Main Footer — flex layout, không grid để tránh khoảng trắng giữa */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-16 flex flex-col md:flex-row justify-between gap-12">

        {/* Col 1: Brand */}
        <div className="flex flex-col gap-5 md:max-w-[280px]">
          <span className="font-headline italic text-2xl text-white tracking-tight">GOAT HOTEL</span>
          <p className="font-body text-white/50 text-sm leading-relaxed font-light">
            Nơi mọi khoảnh khắc đều trở nên đáng nhớ.
          </p>
        </div>

        {/* Right group: Navigation + Legal side by side */}
        <div className="flex flex-row gap-16 md:gap-24">

          {/* Col 2: Navigation */}
          <div className="flex flex-col gap-3">
            <span className="font-label uppercase tracking-[0.25em] text-white/30 text-[10px] mb-2">Điều hướng</span>
            {[
              { label: 'Trang chủ', to: '/' },
              { label: 'Đặt phòng', to: '/collections' },
              { label: 'Tin tức & Tạp chí', to: '/news' },
              { label: 'Liên hệ', to: '/contact' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="font-label uppercase tracking-widest text-[11px] text-white/50 hover:text-secondary transition-colors w-fit"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Col 3: Legal */}
          <div className="flex flex-col gap-3">
            <span className="font-label uppercase tracking-[0.25em] text-white/30 text-[10px] mb-2">Pháp lý</span>
            {['Chính sách Bảo mật', 'Điều khoản Dịch vụ'].map(label => (
              <a
                key={label}
                href="#"
                className="font-label uppercase tracking-widest text-[11px] text-white/50 hover:text-white transition-colors w-fit"
              >
                {label}
              </a>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-5 px-8 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-label uppercase tracking-widest text-[10px] text-white/25">
            © {new Date().getFullYear()} GOAT HOTEL. Tất cả quyền được bảo lưu.
          </p>

        </div>
      </div>
    </footer>
  );
}
