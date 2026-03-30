import React, { useState } from 'react';
import { imageUrl } from '../config';
import HeroHeader from '../components/HeroHeader';

const CONTACT_INFO = [
  {
    icon: 'location_on',
    label: 'Địa chỉ',
    value: '01 Võ Văn Ngân, Phường Linh Chiểu,\nTP. Thủ Đức, Hồ Chí Minh',
  },
  {
    icon: 'call',
    label: 'Đặt phòng',
    value: '+84 (0) 28 1234 5678',
  },
  {
    icon: 'mail',
    label: 'Hỗ trợ chung',
    value: 'goathotel@gmail.com',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (window.Swal) {
      window.Swal.fire({
        icon: 'success',
        title: 'Đã nhận được tin nhắn',
        text: 'Đội ngũ của chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.',
        timer: 2500,
        showConfirmButton: false,
      });
    }
    setSent(true);
    setForm({ firstName: '', lastName: '', email: '', message: '' });
  };

  return (
    <div className="bg-surface text-on-surface font-body">
      <style>{`
        .floating-label-group { position: relative; }
        .floating-label-group input:focus ~ label,
        .floating-label-group input:not(:placeholder-shown) ~ label,
        .floating-label-group textarea:focus ~ label,
        .floating-label-group textarea:not(:placeholder-shown) ~ label {
          top: -0.65rem; font-size: 0.7rem; color: #775a19; opacity: 1;
          background: #e8e4dc; padding: 0 6px; left: 10px;
        }
        .floating-label-group label {
          position: absolute; left: 16px; top: 1.1rem;
          transition: all 0.2s ease; pointer-events: none; color: #74777f;
        }
        .floating-label-group input, .floating-label-group textarea {
          border: 1px solid rgba(196,198,207,0.5);
          border-radius: 12px;
          background: transparent; padding: 1rem 1rem 0.6rem 1rem; width: 100%;
        }
        .floating-label-group input:focus, .floating-label-group textarea:focus {
          outline: none; border-color: #775a19;
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <HeroHeader
        image={imageUrl('/images/contact/contact_hero_bg.jpg')}
        altText="Liên hệ với GOAT HOTEL"
      />

      {/* ── TIÊU ĐỀ TRANG ────────────────────────────────────────── */}
      <div className="bg-surface w-full pt-14 pb-6 text-center border-b border-outline-variant/10">
        <p className="font-label uppercase tracking-[0.3em] text-secondary text-xs mb-3">Liên hệ &amp; Kết nối</p>
        <h1 className="font-headline text-4xl md:text-5xl text-primary tracking-tight">Liên hệ với Chúng tôi</h1>
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 pt-16 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Contact Form Card */}
          <div className="lg:col-span-7 bg-[#e8e4dc] p-10 md:p-16 border border-[#c5bba8] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1)] rounded-2xl">
            <div className="mb-12">
              <h2 className="font-headline text-3xl mb-4">Gửi yêu cầu</h2>
              <p className="text-on-surface-variant max-w-md">
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng 24/7 để giúp đỡ bạn với các yêu cầu và đặt phòng.
              </p>
            </div>
            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="floating-label-group">
                  <input
                    id="firstName" name="firstName" type="text" placeholder=" " required
                    value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                  />
                  <label htmlFor="firstName" className="font-label text-sm tracking-wide">
                    Tên
                  </label>
                </div>
                <div className="floating-label-group">
                  <input
                    id="lastName" name="lastName" type="text" placeholder=" " required
                    value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                  />
                  <label htmlFor="lastName" className="font-label text-sm tracking-wide">
                    Họ
                  </label>
                </div>
              </div>

              <div className="floating-label-group">
                <input
                  id="email" name="email" type="email" placeholder=" " required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <label htmlFor="email" className="font-label text-sm tracking-wide">
                  Địa chỉ Email
                </label>
              </div>

              <div className="floating-label-group">
                <textarea
                  id="message" name="message" rows={4} placeholder=" " required
                  className="resize-none"
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                />
                <label htmlFor="message" className="font-label text-sm tracking-wide">
                  Tin nhắn của bạn
                </label>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-12 py-4 font-label text-xs tracking-[0.3em] uppercase hover:bg-primary/90 transition-all active:scale-95"
                >
                  GỬI TIN NHẮN
                </button>
                {sent && (
                  <p className="mt-4 font-label text-xs text-secondary uppercase tracking-widest">
                    ✓ Đã gửi tin nhắn. Chúng tôi sẽ sớm liên hệ.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Info Column */}
          <div className="lg:col-span-5">
            <div className="bg-primary p-12 text-white shadow-xl rounded-2xl">
              <h3 className="font-headline text-2xl mb-8 border-b border-white/10 pb-6">
                Kênh Trực tiếp
              </h3>
              <div className="space-y-8">
                {CONTACT_INFO.map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-5">
                    <span
                      className="material-symbols-outlined text-secondary text-2xl"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      {icon}
                    </span>
                    <div>
                      <p className="font-label text-xs uppercase tracking-widest text-secondary mb-1">
                        {label}
                      </p>
                      <p className="text-lg font-light leading-relaxed whitespace-pre-line">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer được render bởi MainLayout — không cần thêm ở đây */}
    </div>
  );
}
