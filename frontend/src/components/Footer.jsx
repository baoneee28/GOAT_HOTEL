import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-slate-950 w-full py-12 px-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="font-serif italic text-xl text-white">GOAT HOTEL</div>
                <div className="flex gap-8">
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Privacy Policy</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Terms of Service</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Contact Us</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Careers</Link>
                </div>
                <p className="font-sans uppercase tracking-widest text-[10px] text-slate-500">© 2024 GOAT HOTEL. ALL RIGHTS RESERVED.</p>
            </div>
        </footer>
    );
}
