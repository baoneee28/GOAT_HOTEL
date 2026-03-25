import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const BG_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDLb8cYvQnJ540J-YvOcTj8Mdsnf5z6wQcyQV4H506T2b9uYsiEBRAp1BeJRSHrvU-gGoU07_VStl3nUgai7ezQlvXgpiZ2wQRJSEc1vRDTTGZE70ExkbRLTZ0F1_P2--0ISqQSHzL7aHNFgPF9_V5hU2qEcqAgj-lgXvjTqbyjxBBOAlgUML2sEGIsSkzrKa-gz1_TBbbnwBz6Z2AJSvMfB05M1dIVJAFjYA0OmfG0f-dgP10BfVwTfJcN7yTH6N3MhwxH_-gPAPc';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function BookingConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const booking = {
    checkIn: state?.checkIn ?? '2024-10-28',
    checkOut: state?.checkOut ?? '2024-11-01',
    room: state?.room ?? 'Imperial Grand Suite',
    pricePerNight: state?.pricePerNight ?? 340,
  };

  return (
    <div className="font-body text-on-surface">
      <style>{`
        .glass-card {
          background: rgba(25, 28, 29, 0.6);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-button {
          box-shadow: 0 0 20px rgba(119, 90, 25, 0.4);
        }
      `}</style>

      {/* ── HERO (full screen) ──────────────────────────────────── */}
      <main className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Luxury Suite"
            className="w-full h-full object-cover"
            src={BG_IMG}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/60 to-transparent"></div>
        </div>

        {/* Glass card */}
        <div className="relative z-10 w-full max-w-xl px-6">
          <div className="glass-card p-10 md:p-16 rounded-sm text-white flex flex-col items-center">

            {/* Icon */}
            <div className="mb-8">
              <span
                className="material-symbols-outlined text-amber-500 text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>

            {/* Heading */}
            <h1 className="font-headline text-4xl md:text-5xl mb-4 tracking-tight text-center">
              Confirm Your Stay
            </h1>
            <p className="font-label text-amber-500 uppercase tracking-[0.3em] text-[10px] mb-12">
              The Sovereign Guest Experience
            </p>

            {/* Detail rows */}
            <div className="w-full space-y-8 mb-12">

              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center space-x-4">
                  <span className="material-symbols-outlined text-white/50">calendar_today</span>
                  <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Check-In</span>
                </div>
                <span className="font-headline text-lg">{fmtDate(booking.checkIn)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center space-x-4">
                  <span className="material-symbols-outlined text-white/50">calendar_month</span>
                  <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Check-Out</span>
                </div>
                <span className="font-headline text-lg">{fmtDate(booking.checkOut)}</span>
              </div>

              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center space-x-4">
                  <span className="material-symbols-outlined text-white/50">king_bed</span>
                  <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Room Type</span>
                </div>
                <span className="font-headline text-lg">{booking.room}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center space-x-4">
                  <span className="material-symbols-outlined text-white/50">payments</span>
                  <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Price</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-500 font-headline text-3xl">${booking.pricePerNight}</span>
                  <span className="text-white/40 text-xs uppercase tracking-widest ml-1">/ Night</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              className="glow-button w-full bg-amber-600 hover:bg-amber-500 text-white font-bold tracking-[0.2em] py-5 rounded-full transition-all duration-300 transform hover:-translate-y-1 active:scale-95 text-xs"
              onClick={() => {/* integrate confirm booking API here */}}
            >
              BOOK NOW
            </button>

            <button
              className="mt-8 text-white/40 hover:text-white text-[10px] tracking-widest uppercase transition-colors duration-300 underline underline-offset-8"
              onClick={() => navigate(-1)}
            >
              MODIFY SELECTION
            </button>
          </div>
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-slate-950 w-full border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center w-full py-16 px-12 max-w-screen-2xl mx-auto">
          <div className="mb-8 md:mb-0">
            <span className="font-headline italic text-amber-600 text-xl">GOAT HOTEL</span>
            <p className="text-slate-500 font-body text-[10px] tracking-widest uppercase mt-2">
              © 2024 GOAT HOTEL. THE SOVEREIGN GUEST EXPERIENCE.
            </p>
          </div>
          <div className="flex space-x-8">
            {['PRIVACY', 'TERMS', 'CAREERS', 'PRESS'].map(l => (
              <a
                key={l}
                href="#"
                className="text-slate-500 font-body text-[10px] tracking-widest uppercase hover:text-slate-100 transition-colors duration-300 opacity-80 hover:opacity-100"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
