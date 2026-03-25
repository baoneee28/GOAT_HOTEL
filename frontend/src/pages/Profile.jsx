import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user: sessionUser } = useOutletContext() || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });

  const currentUserId = sessionUser?.id;

  useEffect(() => {
    if (!currentUserId) return; // Wait for session user to load
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/profile/${currentUserId}`, { withCredentials: true });
        if (res.data?.success) {
          const u = res.data.user;
          setUser(u);
          setFormData({ fullName: u.fullName || '', email: u.email || '', phone: u.phone || '' });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUserId]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:8080/api/profile/${currentUserId}`, {
        fullName: formData.fullName,
        phone: formData.phone,
      }, { withCredentials: true });
      if (res.data?.success) {
        setUser(res.data.user);
        setIsEditing(false);
        if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Updated', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      console.error('Profile update error:', err);
    }
  };

  const getAvatarUrl = (url) => {
    if (!url) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBupAx6rs2g2vSjz67aZ0D0tiQDRzDBfJgkudwD4c38Y1_Em9RSX2wyw97p3vln7gc28YLmT4TekXIvJLB91yKBrNQG0j2Y9JvbKXJ7sCYse5IdHrGnONnEP16tc1dW_hWmjk1-SmOoRw7uDZSyT2phBM9Lu9s9MsJ0-q_sgp2xWl3kR1TTvliEaCTqJCMShkhPr3_9hvLUlcryiRJ7iZNtScyYRpWF7STcq6yUDBBEdXjXbmBkI9X7moBVxDNr5UjI1aqTcX4MOMI';
    return url.startsWith('http') ? url : `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <style>{`
        .hero-gradient { background: linear-gradient(135deg, #000614 0%, #001f41 100%); }
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); border: 1px solid rgba(196,198,207,0.2); }
        input:focus + label, input:not(:placeholder-shown) + label {
          transform: translateY(-1.5rem) scale(0.85); color: #775a19;
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-gradient relative py-32 px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            alt="Sovereign ambiance"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkzqUcwJwThy2XUO4RWs307igqJkBIgKZJMgcSDeCzdNgGhgCV6ZMo5cVq0EkjDK2q1AjOGXt0vTIwg2AFHpFMSAM3rHaN6Yzy744PDbObAJsvaZ4jWL1iWem0kKSUBY9mAdk4OsvrSLVTtUZQ6EYLXQAE1jJPv7j-d8pRFzTrezCCY5YJUP-l1sViEOW9tF68V-AxGsTme2i5ckEaz0tVjAN4rXzhVH1hM61-7ZhguVBKVdyrVXUqJexWF7FgMlzx54urR0TV1pw"
          />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <p className="text-secondary font-label text-[0.75rem] uppercase tracking-[0.3em] mb-4">GUEST EXCLUSIVITY</p>
          <h1 className="font-headline text-5xl md:text-[3.5rem] text-white leading-tight -tracking-[0.02em] mb-6">
            Your Sanctuary Profile
          </h1>
          <div className="h-1 w-24 bg-secondary"></div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left Column: Personal & Security */}
          <div className="lg:col-span-4 space-y-16">

            {/* Personal Info */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h2 className="font-headline text-2xl text-primary">Personal Details</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="font-label text-[0.7rem] uppercase tracking-widest text-secondary border-b border-secondary/40 pb-0.5 hover:text-primary transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-10 pt-4">
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 focus:border-secondary transition-colors py-2 outline-none text-on-surface disabled:opacity-60"
                    id="fullName" name="fullName" placeholder=" " type="text"
                    value={formData.fullName} onChange={handleChange} disabled={!isEditing} required
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="fullName">Full Name</label>
                </div>
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 py-2 outline-none text-on-surface opacity-60 cursor-not-allowed"
                    id="email" name="email" placeholder=" " type="email"
                    value={formData.email} disabled
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="email">Email Address</label>
                </div>
                <div className="relative">
                  <input
                    className="peer w-full bg-transparent border-b border-outline-variant/30 focus:border-secondary transition-colors py-2 outline-none text-on-surface disabled:opacity-60"
                    id="phone" name="phone" placeholder=" " type="tel"
                    value={formData.phone} onChange={handleChange} disabled={!isEditing}
                  />
                  <label className="absolute left-0 top-2 text-outline pointer-events-none transition-all duration-300 font-label uppercase text-[0.7rem] tracking-widest" htmlFor="phone">Phone Number</label>
                </div>
                {isEditing ? (
                  <button type="submit" className="bg-primary text-on-primary px-8 py-4 rounded-sm font-label text-[0.75rem] uppercase tracking-widest hover:bg-secondary transition-all">
                    Save Changes
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsEditing(true)} className="bg-primary text-on-primary px-8 py-4 rounded-sm font-label text-[0.75rem] uppercase tracking-widest hover:bg-secondary transition-all">
                    Update Profile
                  </button>
                )}
              </form>
            </div>

            {/* Security */}
            <div className="glass-card p-8 rounded-sm">
              <h2 className="font-headline text-2xl text-primary mb-8">Security &amp; Access</h2>
              <div className="space-y-6">
                <p className="text-sm text-outline font-body">Ensure your sanctuary remains private by updating your security credentials regularly.</p>
                <div className="flex items-center justify-between group cursor-pointer border-b border-outline-variant/20 pb-4">
                  <span className="font-label text-[0.75rem] uppercase tracking-widest text-on-surface group-hover:text-secondary transition-colors">Change Password</span>
                  <span className="material-symbols-outlined text-secondary text-lg">chevron_right</span>
                </div>
                <div className="flex items-center justify-between group cursor-pointer">
                  <span className="font-label text-[0.75rem] uppercase tracking-widest text-on-surface group-hover:text-secondary transition-colors">Two-Factor Auth</span>
                  <div className="w-10 h-5 bg-surface-container-high rounded-full relative">
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: History & Preferences */}
          <div className="lg:col-span-8 space-y-16">

            {/* Booking History */}
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
                <h2 className="font-headline text-3xl text-primary leading-none">Your Residency History</h2>
                <Link to="/history" className="font-label text-[0.7rem] uppercase tracking-widest text-secondary border-b border-secondary/30 pb-1">View All Stays</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <div className="aspect-[16/10] mb-4 overflow-hidden rounded-sm">
                    <img
                      alt="Imperial Grand Suite"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfp90yg3OkRye5eebeEZtq10QTRmiou6TQBzkhJVTNoGsNtHOzIi7csj2tBD_SdOrW9FnqF3Bz0ZjG5_fJ3ev-b3Xu3SGU1Xb6Ihhb0sds2y6GrDkD4WGjHtUI_CXHUBbycy1kzApt4V9R7cxxDffDgQTsWervJ0R_fyYTyWtFzzV176BeeC6ASUpMdapBKHmHSgLg1RPW-VjLj5MeFIuvouBJvo5v2rIYN9wsmR55zNXU2VBhJLxThuoJxZQ1xpey5B8biV7fCDg"
                    />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-secondary">Upcoming Residency</span>
                      <h3 className="font-headline text-xl text-primary mt-1">Imperial Grand Suite</h3>
                      <p className="text-sm text-outline font-body mt-1">Oct 14 — Oct 21, 2024</p>
                    </div>
                    <span className="px-3 py-1 bg-secondary/10 text-secondary font-label text-[0.6rem] uppercase tracking-widest">Confirmed</span>
                  </div>
                </div>
                <div className="group">
                  <div className="aspect-[16/10] mb-4 overflow-hidden rounded-sm">
                    <img
                      alt="Azure Horizon Deluxe"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCC3y_1k7XNTK052dFSt5N9t_BHCkuCnV6E0cuLmFfjgBiMoWF4FrGBgjCsJjttW3iKDwymj0bRc-jeiSE-9IUHuM_5fbtvtubXNjU0QGujRzxb2O7H31m-Z0MJY7k5uQBnW61NyK3k49m-dnl1XFLhIzoFV_5RubwzDZGpIN9Nt0ZrRibrLh-gZ46oTr-fjbKt4cpWPGJjHUVKlMPk_qWlV_MYwsvb2y87onqU-qqavVzyF2JWwBVlOylooltMp1S7JGbLLU-V6nQ"
                    />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-outline">Past Stay</span>
                      <h3 className="font-headline text-xl text-primary mt-1">Azure Horizon Deluxe</h3>
                      <p className="text-sm text-outline font-body mt-1">Aug 02 — Aug 09, 2024</p>
                    </div>
                    <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant font-label text-[0.6rem] uppercase tracking-widest">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Bento Grid */}
            <div className="space-y-8">
              <h2 className="font-headline text-3xl text-primary border-b border-outline-variant/20 pb-4">Personalized Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">bed</span>
                  <h4 className="font-headline text-lg">Rest</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Pillow Menu</p>
                  <p className="text-on-surface font-body text-sm">Hungarian Goose Down, extra firm.</p>
                </div>
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">restaurant</span>
                  <h4 className="font-headline text-lg">Cuisine</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Dietary Needs</p>
                  <p className="text-on-surface font-body text-sm">Plant-based, Gluten-free focus.</p>
                </div>
                <div className="bg-surface-container-low p-8 rounded-sm space-y-4">
                  <span className="material-symbols-outlined text-secondary text-3xl">thermostat</span>
                  <h4 className="font-headline text-lg">Climate</h4>
                  <p className="font-label text-[0.7rem] uppercase tracking-widest text-outline">Ambient Temp</p>
                  <p className="text-on-surface font-body text-sm">Maintained at precisely 21°C.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
