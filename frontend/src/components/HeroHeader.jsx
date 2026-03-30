import React from 'react';
import { imageUrl } from '../config';

export default function HeroHeader({ image, altText = "Room Preview", children }) {
  return (
    <section className="relative h-[45vh] lg:h-[55vh] min-h-[350px] overflow-hidden flex items-end">
      <img
        src={image || imageUrl('/images/home/hero_slider_2.jpg')}
        alt={altText}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Cố định overlay tối màu ở nửa dưới ảnh cho mọi trang */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
      
      {/* Render các phần tử con (nếu có) trên nền gradient */}
      {children}
    </section>
  );
}
