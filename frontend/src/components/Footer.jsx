import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-slate-950 w-full py-12 px-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="font-serif italic text-xl text-white">GOAT HOTEL</div>
                <div className="flex gap-8">
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Chính sách Bảo mật</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Điều khoản Dịch vụ</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Liên hệ</Link>
                    <Link className="font-sans uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors" to="#">Tuyển dụng</Link>
                </div>
                <p className="font-sans uppercase tracking-widest text-[10px] text-slate-500">© 2024 GOAT HOTEL. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.</p>
            </div>
        </footer>
    );
}
