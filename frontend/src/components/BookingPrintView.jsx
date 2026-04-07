import React from 'react';
import { formatDate } from '../utils/dateFormat';

export default function BookingPrintView({
  booking,
  bookingOwner,
  detail,
  discountAmount,
  grandTotal,
  guestCount,
  orderNumber,
  paymentMeta,
  printGeneratedAt,
  roomCount,
  roomEntries,
  roomSummaryLabel,
  statusMeta,
  subtotalLabel,
  bookingSubtotal,
}) {
  return (
    <section className="print-booking-invoice">
      <div className="print-sheet mx-auto max-w-5xl px-4 py-4">
        <header className="print-card border-b border-slate-300 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-label text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">GOAT HOTEL</p>
              <h1 className="mt-2 font-headline text-[2rem] text-slate-950">Hóa đơn đặt phòng</h1>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Booking summary được tối ưu để in hoặc xuất PDF trong một trang.
              </p>
            </div>
            <div className="min-w-[210px] rounded-[18px] border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Mã đơn</p>
              <p className="mt-1.5 font-headline text-[1.8rem] text-slate-950">GH-{orderNumber}</p>
              <div className="mt-3 space-y-1">
                <p>Ngày tạo: <span className="font-medium text-slate-900">{formatDate(booking.createdAt || detail?.checkIn)}</span></p>
                <p>Ngày in: <span className="font-medium text-slate-900">{printGeneratedAt}</span></p>
                <p>Trạng thái booking: <span className="font-medium text-slate-900">{statusMeta.label}</span></p>
                <p>Trạng thái thanh toán: <span className="font-medium text-slate-900">{paymentMeta.label}</span></p>
              </div>
            </div>
          </div>
        </header>

        <div className="print-body">
          <section className="print-card mt-4 rounded-[18px] border border-slate-300 p-4">
            <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Thông tin nhanh</p>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs leading-5 text-slate-700">
              <p>Tên khách: <span className="font-medium text-slate-950">{bookingOwner}</span></p>
              <p>Email: <span className="font-medium text-slate-950">{booking.user?.email || 'Chưa cập nhật'}</span></p>
              <p>Số điện thoại: <span className="font-medium text-slate-950">{booking.user?.phone || 'Chưa cập nhật'}</span></p>
              <p>Số khách: <span className="font-medium text-slate-950">{guestCount ? `${guestCount} khách` : 'Chưa cập nhật'}</span></p>
              <p>Số phòng: <span className="font-medium text-slate-950">{roomCount}</span></p>
              <p>Loại hiển thị: <span className="font-medium text-slate-950">{roomSummaryLabel}</span></p>
            </div>
          </section>

          <section className="print-card print-details-card mt-4 rounded-[20px] border border-slate-300 p-4">
            <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <p className="font-label text-[0.58rem] uppercase tracking-[0.24em] text-slate-500">Danh sách phòng</p>
                <h2 className="mt-1.5 font-headline text-[1.6rem] text-slate-950">Chi tiết lưu trú</h2>
              </div>
              <p className="text-xs text-slate-500">{roomCount} phòng trong đơn đặt này</p>
            </div>

            <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200">
              <table className="print-room-table">
                <thead className="bg-slate-50">
                  <tr>
                    <th>Phòng</th>
                    <th>Loại phòng</th>
                    <th>Nhận phòng</th>
                    <th>Trả phòng</th>
                    <th>Số đêm</th>
                    <th>Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {roomEntries.map((room) => (
                    <tr key={`print-${room.id}`}>
                      <td>Phòng {room.roomNumber}</td>
                      <td className="font-medium text-slate-950">{room.roomTypeName}</td>
                      <td>{room.checkIn}</td>
                      <td>{room.checkOut}</td>
                      <td>{room.nights} đêm</td>
                      <td>{room.pricePerNight.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-[16px] border border-slate-300 p-3.5">
                <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Ghi chú ngắn</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Hóa đơn này được in trực tiếp từ trang chi tiết booking của GOAT HOTEL.
                </p>
              </div>

              <div className="rounded-[16px] border border-slate-300 p-3.5">
                <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Tổng thanh toán</p>
                <div className="mt-3 space-y-2 text-xs text-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <span>{subtotalLabel}</span>
                    <span className="font-medium text-slate-950">{bookingSubtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-start justify-between gap-4">
                      <span>Giảm giá</span>
                      <span className="font-medium text-emerald-700">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-slate-300 pt-3">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Tổng cộng</span>
                    <span className="font-headline text-[2rem] text-slate-950">{grandTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="print-footer mt-4 grid gap-4 md:grid-cols-2">
            <div className="print-card rounded-[18px] border border-dashed border-slate-300 p-4 text-center">
              <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">Khách lưu trú</p>
              <p className="mt-2 text-xs text-slate-600">{bookingOwner}</p>
              <div className="mt-12 border-t border-slate-300 pt-2 text-[11px] text-slate-500">
                Ký và ghi rõ họ tên
              </div>
            </div>

            <div className="print-card rounded-[18px] border border-dashed border-slate-300 p-4 text-center">
              <p className="font-label text-[0.56rem] uppercase tracking-[0.22em] text-slate-500">GOAT HOTEL</p>
              <p className="mt-2 text-xs text-slate-600">Bản in tóm tắt phục vụ đối chiếu booking và demo báo cáo.</p>
              <div className="mt-12 border-t border-slate-300 pt-2 text-[11px] text-slate-500">
                Xác nhận từ hệ thống
              </div>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
