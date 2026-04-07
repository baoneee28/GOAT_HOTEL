import React from 'react';
import { getTimelineState, TIMELINE_STEPS } from '../constants/bookingStatus';

export default function BookingTimeline({ currentStatus }) {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-4">
      {TIMELINE_STEPS.map((step, index) => {
        const state = getTimelineState(step.key, currentStatus);
        const isCurrent = state === 'current';
        const isComplete = state === 'complete';
        const toneClass = isCurrent
          ? 'border-secondary/26 bg-secondary/10 text-primary'
          : isComplete
            ? 'border-primary/10 bg-primary/6 text-primary/86'
            : 'border-outline-variant/14 bg-white/72 text-primary/42';

        return (
          <div key={step.key} className={`rounded-[24px] border p-5 transition-all ${toneClass}`}>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                  isCurrent
                    ? 'border-secondary/30 bg-secondary text-primary'
                    : isComplete
                      ? 'border-primary/14 bg-primary text-white'
                      : 'border-outline-variant/18 bg-white text-primary/36'
                }`}
              >
                <span className="font-label text-[0.64rem] uppercase tracking-[0.1em]">
                  {step.key === 'cancelled' ? 'X' : index + 1}
                </span>
              </div>
              <div>
                <p className="font-headline text-lg leading-tight">{step.label}</p>
                {isCurrent ? (
                  <p className="mt-1 font-label text-[0.58rem] uppercase tracking-[0.22em] text-secondary">
                    Trạng thái hiện tại
                  </p>
                ) : null}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-current/80">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}
