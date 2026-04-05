const fs = require('fs');
const file = 'd:\\GOAT_HOTEL\\GOAT_HOTEL\\frontend\\src\\pages\\RoomDetail.jsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add state for reviews
if (!content.includes('const [reviews, setReviews] = useState([]);')) {
    content = content.replace(
        '  const [activeImg, setActiveImg] = useState(0);',
        '  const [activeImg, setActiveImg] = useState(0);\n  const [reviews, setReviews] = useState([]);'
    );
}

// 2. Add useEffect to fetch reviews
if (!content.includes('axios.get(`${API_BASE}/api/reviews/room/${id}`)')) {
    content = content.replace(
        '  const handleInputChange = (e) => {',
        `  useEffect(() => {
    axios.get(\`\${API_BASE}/api/reviews/room/\${id}\`, { withCredentials: true })
      .then(res => {
        if (res.data && res.data.reviews) setReviews(res.data.reviews);
      })
      .catch(err => console.error('Không tải được đánh giá', err));
  }, [id]);

  const handleInputChange = (e) => {`
    );
}

// 3. Add UI for reviews before </section>
if (!content.includes('Đánh giá của khách hàng')) {
    const reviewsUI = `
        {/* REVIEWS SECTION */}
        <div className="pt-12 mt-12 border-t border-outline-variant/30">
          <p className="font-label uppercase tracking-[0.25em] text-secondary text-xs mb-6">Trải nghiệm thực tế</p>
          <h2 className="font-headline text-3xl text-on-surface mb-8">Đánh giá của khách hàng</h2>
          
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((r) => (
                <div key={r.id} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-on-surface">{r.user?.fullName || 'Khách hàng'}</h4>
                      <p className="text-xs text-on-surface-variant">{formatDate(r.createdAt.split('T')[0])}</p>
                    </div>
                    <div className="flex text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: i < r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-on-surface-variant italic font-light">"{r.comment || 'Không có nhận xét'}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">reviews</span>
              <p className="text-on-surface-variant">Chưa có đánh giá nào cho hạng phòng này.</p>
              <p className="text-xs text-outline mt-1 italic">Bạn chỉ có thể đánh giá sau khi hoàn tất thanh toán & trả phòng (Checkout).</p>
            </div>
          )}
        </div>
`;
    content = content.replace('      </section>', reviewsUI + '\n      </section>');
}

fs.writeFileSync(file, content, 'utf-8');
console.log('RoomDetail.jsx updated with reviews section');
