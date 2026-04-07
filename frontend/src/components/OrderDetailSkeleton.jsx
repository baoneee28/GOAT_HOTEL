import React from 'react';

export default function OrderDetailSkeleton() {
  return (
    <div
      className="min-h-[70vh] bg-[linear-gradient(180deg,#f6f0e5_0%,#faf7f2_100%)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="animate-pulse space-y-8">
          <div className="overflow-hidden rounded-[32px] bg-slate-900/92 p-8">
            <div className="h-4 w-36 rounded-full bg-white/12"></div>
            <div className="mt-6 h-12 w-72 rounded-full bg-white/16"></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-10 w-32 rounded-full bg-white/14"></div>
              <div className="h-10 w-36 rounded-full bg-white/14"></div>
              <div className="h-10 w-40 rounded-full bg-white/14"></div>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.52fr)_minmax(320px,0.88fr)]">
            <div className="space-y-8">
              <div className="rounded-[30px] border border-outline-variant/12 bg-white/80 p-6">
                <div className="h-5 w-32 rounded-full bg-slate-200"></div>
                <div className="mt-4 h-10 w-64 rounded-full bg-slate-200"></div>
                <div className="mt-8 grid gap-4 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[24px] border border-outline-variant/12 bg-white p-5">
                      <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                      <div className="mt-4 h-5 w-28 rounded-full bg-slate-200"></div>
                      <div className="mt-3 h-4 w-full rounded-full bg-slate-100"></div>
                      <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] bg-slate-950 p-6">
                <div className="h-5 w-40 rounded-full bg-white/12"></div>
                <div className="mt-4 h-10 w-56 rounded-full bg-white/16"></div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                      <div className="h-4 w-24 rounded-full bg-white/10"></div>
                      <div className="mt-4 h-8 w-32 rounded-full bg-white/14"></div>
                    </div>
                  ))}
                </div>
              </div>

              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-[30px] border border-outline-variant/12 bg-white/80 p-6">
                  <div className="h-4 w-28 rounded-full bg-slate-200"></div>
                  <div className="mt-4 h-9 w-64 rounded-full bg-slate-200"></div>
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 3 }).map((__, rowIndex) => (
                      <div key={rowIndex} className="rounded-[24px] border border-outline-variant/12 bg-white p-5">
                        <div className="h-5 w-40 rounded-full bg-slate-200"></div>
                        <div className="mt-3 h-4 w-full rounded-full bg-slate-100"></div>
                        <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              <div className="rounded-[30px] bg-slate-950 p-6">
                <div className="h-4 w-32 rounded-full bg-white/12"></div>
                <div className="mt-4 h-10 w-48 rounded-full bg-white/16"></div>
                <div className="mt-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                      <div className="h-4 w-32 rounded-full bg-white/10"></div>
                      <div className="h-6 w-24 rounded-full bg-white/14"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-outline-variant/12 bg-white/80 p-6">
                <div className="h-4 w-28 rounded-full bg-slate-200"></div>
                <div className="mt-4 h-9 w-44 rounded-full bg-slate-200"></div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-14 rounded-[20px] bg-slate-100"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
