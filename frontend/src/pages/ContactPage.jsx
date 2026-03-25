import React, { useState } from 'react';

const CONTACT_INFO = [
  {
    icon: 'location_on',
    label: 'Location',
    value: '127 Azure Gilt Way,\nThe Sovereignty District, NY 10012',
  },
  {
    icon: 'call',
    label: 'Reservations',
    value: '+1 (800) 555-GOAT',
  },
  {
    icon: 'mail',
    label: 'General Inquiries',
    value: 'concierge@goathotel.com',
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
        title: 'Message Received',
        text: 'Our concierge team will reach out within 24 hours.',
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
          top: -0.5rem; font-size: 0.75rem; color: #775a19; opacity: 1;
        }
        .floating-label-group label {
          position: absolute; left: 0; top: 1rem;
          transition: all 0.2s ease; pointer-events: none; color: #74777f;
        }
        .floating-label-group input, .floating-label-group textarea {
          border: none; border-bottom: 1px solid rgba(196,198,207,0.4);
          background: transparent; padding-top: 1.5rem; padding-bottom: 0.5rem; width: 100%;
        }
        .floating-label-group input:focus, .floating-label-group textarea:focus {
          outline: none; border-bottom: 1px solid #775a19;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-[409px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary z-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBRF6Dya7NFHm87LEYMeGkx0lFpd6GTO-_34xZ2mM0_zhTfT-UZNXb3obmVMOv65VMwQ0pSPBJizF-qX1PZrqbzQfm-oLI_nWmEWAR0TMp-KC7VcflUIO61rBRbVo1DDozc6vIu63UkVoa8Gd3nQQgA06C6ml4vtFQc7OagJJB8aIACu-oN_J4WlPlU0RPC9gBGku4TCxA0X1bbHEwEAO1stZbKky2mJbR60kUG53bbQf2Aju51IJpDagGYhsVTxYeJz6_d05hhpWs')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-surface"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <p className="font-label text-secondary text-xs tracking-[0.4em] uppercase mb-4">
            Inquiry &amp; Connection
          </p>
          <h1 className="font-headline text-5xl md:text-7xl text-white tracking-tight">
            Contact Us
          </h1>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 -mt-24 pb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Contact Form Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-10 md:p-16 shadow-[0_24px_48px_-12px_rgba(0,6,20,0.08)]">
            <div className="mb-12">
              <h2 className="font-headline text-3xl mb-4">Send an Inquiry</h2>
              <p className="text-on-surface-variant max-w-md">
                Our concierge team is available 24/7 to assist with your requirements and reservations.
              </p>
            </div>
            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="floating-label-group">
                  <input
                    id="firstName" name="firstName" type="text" placeholder=" " required
                    value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  />
                  <label htmlFor="firstName" className="font-label text-sm uppercase tracking-wider">
                    First Name
                  </label>
                </div>
                <div className="floating-label-group">
                  <input
                    id="lastName" name="lastName" type="text" placeholder=" " required
                    value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  />
                  <label htmlFor="lastName" className="font-label text-sm uppercase tracking-wider">
                    Last Name
                  </label>
                </div>
              </div>

              <div className="floating-label-group">
                <input
                  id="email" name="email" type="email" placeholder=" " required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                />
                <label htmlFor="email" className="font-label text-sm uppercase tracking-wider">
                  Email Address
                </label>
              </div>

              <div className="floating-label-group">
                <textarea
                  id="message" name="message" rows={4} placeholder=" " required
                  className="resize-none"
                  value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                />
                <label htmlFor="message" className="font-label text-sm uppercase tracking-wider">
                  Your Message
                </label>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-12 py-4 font-label text-xs tracking-[0.3em] uppercase hover:bg-primary/90 transition-all active:scale-95"
                >
                  Send Message
                </button>
                {sent && (
                  <p className="mt-4 font-label text-xs text-secondary uppercase tracking-widest">
                    ✓ Message delivered. We'll be in touch.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Info + Map Column */}
          <div className="lg:col-span-5 space-y-8">
            {/* Dark Info Card */}
            <div className="bg-primary p-12 text-white shadow-xl">
              <h3 className="font-headline text-2xl mb-8 border-b border-white/10 pb-6">
                Direct Channels
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

            {/* Stylized Map */}
            <div className="h-[350px] w-full relative group grayscale hover:grayscale-0 transition-all duration-700 overflow-hidden shadow-lg border border-outline-variant/20">
              <img
                alt="Stylized map"
                className="absolute inset-0 w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBedII3uC_cPIh0ITDCbb8su-53DQTUaKiawVEDSUNxBaiBvSKxlSCLo8hB51RNco0HPkJ-yd6NMoQoSwnJWZYMD8d_reAOBqAjsEqhcvVl4qe9JgtLynWYGc81J2wSxXma78e0cmdrLMA2JsiHJIfq_IE2QwsZJKhUwbJoI8GjogEPfyfaqMdC08wyQKfUbkF5ZTnU29fDxloGv45mVFU6lzPhbKFwYt0QkOe6GS1iczKoGk9lYa-UphY8CdOwfEI2pTreGcxcptc"
              />
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span
                  className="material-symbols-outlined text-secondary text-5xl animate-bounce"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  location_on
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL & AWARDS ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t border-outline-variant/30 gap-12">
          {/* Award logos */}
          <div className="flex gap-12 grayscale opacity-50">
            <img className="h-12 object-contain" alt="Forbes Travel Guide Five Star"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoal-NI6tlTjYlJ5-JmttDLudqeEWHZKUkBkx-bkuiB_SWTYo2aiSqrbjDXQKU_sQ6kS446amybdYTmH1lLhzhcFBgCR5lpNLv6y6xfVeJz5zVjc_8JGLLc0ckalTU4we4tvmUFDm-StdprTMVt725GB7jigPBffc9HgZ_YdM2ay2Zt0ahv-Jnu4aqDdrdzLC3jtvQbvxxIIJqeOTImed7OHbqLpNHe1Dgqz-lzh6LkzuGpEl9ubEabSZNZNJ13ACDnxrMAfTiqdc"/>
            <img className="h-12 object-contain" alt="Michelin Guide"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzGsO17NaKn5eKfL1HU7MIjO0YXwpyGs2fu-w2VWmHVqx9i48isdbDc4asy7YRkEHluweE0RRH4ope5nR1mO2H8zXWGWP-oYhLw9nky79OGCychaO6JrIHmh3D-Cf51aTBFIYAX-IMBIWTmvciYzEPTmTuNSD3bbqyS906XpUa5H6SSFW_CBJcYDyfgJOgvbDW5whDgcRjS6HRaSN6kM0bpgDZX_N1igRfGhcGRxdZgXiDExro1eOGehcvBwCxqvjJAc6bh_e0gSA"/>
            <img className="h-12 object-contain" alt="Condé Nast Traveler"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlR7BluVPQIyBPs6We0zUwu31VK2Td8Ql9Sq1_LMXEmkEj3rR-qC5ZCAzIiIQcB_ItRENSd8qJWmDYBBr2YTWELZDs9zd9B5dsDCtqsifblvY3LOZu2vtYndoEQTz8ilfccAUuukPUWoFGBlAossdWEom61BOH0OWE0Wr40Qr0HxLwjpRM5wa21JG7SivCuECBLXn2aN5MQdYa1QBj4TtCdYbRnT_uhLIMQyO4Z2TcaG4gD8LPBtfDz6HFOLzRZWNhiu-7HtYDb68"/>
          </div>
          {/* Social links */}
          <div className="flex gap-8">
            {['Instagram', 'LinkedIn', 'Facebook'].map(s => (
              <a key={s} href="#" className="text-on-surface-variant hover:text-secondary transition-colors">
                <span className="font-label text-xs tracking-widest uppercase">{s}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 w-full py-12 px-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-headline italic text-xl text-white">GOAT HOTEL</div>
          <div className="flex gap-8">
            {[
              { label: 'Privacy Policy', active: false },
              { label: 'Terms of Service', active: false },
              { label: 'Contact Us', active: true },
              { label: 'Careers', active: false },
            ].map(({ label, active }) => (
              <a
                key={label}
                href="#"
                className={`font-label uppercase tracking-widest text-[10px] transition-colors ${active ? 'text-secondary' : 'text-slate-400 hover:text-white'}`}
              >
                {label}
              </a>
            ))}
          </div>
          <p className="font-label uppercase tracking-widest text-[10px] text-slate-500">
            © 2024 GOAT HOTEL. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
