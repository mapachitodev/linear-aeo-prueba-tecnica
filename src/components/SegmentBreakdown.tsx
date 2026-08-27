import { SegmentStat } from '../lib/breakdown';
import { ThemeMode } from '../types';

interface SegmentBreakdownProps {
  title: string;
  segments: SegmentStat[];
  theme: ThemeMode;
}

export function SegmentBreakdown({ title, segments, theme }: SegmentBreakdownProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091834] border-[#132c58]' : 'bg-white border-slate-100 shadow-xs'}`}>
      <h4 className={`text-xs font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
      <div className="space-y-2.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className={`text-[11px] font-medium w-32 shrink-0 truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`} title={s.label}>
              {s.label}
            </span>
            <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                style={{ width: `${Math.max(4, s.visibilityRate)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 w-10 text-right shrink-0">
              {s.visibilityRate.toFixed(0)}%
            </span>
            <span className={`text-[10px] w-16 text-right shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {s.avgPosition > 0 ? `pos ${s.avgPosition.toFixed(1)}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
