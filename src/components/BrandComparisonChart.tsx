import { useState } from 'react';
import { BRAND_COLORS, BrandMetrics, ThemeMode } from '../types';
import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

interface BrandComparisonChartProps {
  brandMetrics: BrandMetrics[] | null;
  theme: ThemeMode;
}

export function BrandComparisonChart({ brandMetrics, theme }: BrandComparisonChartProps) {
  const isDark = theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showShareOfVoice, setShowShareOfVoice] = useState(false);

  if (!brandMetrics || brandMetrics.length === 0) {
    return (
      <div className={`p-5 rounded-2xl border flex items-center justify-center h-[240px] text-xs ${isDark ? 'bg-[#091834] border-[#132c58] text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
        Sin datos todavía — ejecutá una auditoría.
      </div>
    );
  }

  const sorted = [...brandMetrics].sort((a, b) => b.visibility_rate - a.visibility_rate);
  const maxVal = Math.max(...sorted.map((b) => (showShareOfVoice ? b.share_of_voice : b.visibility_rate)), 10);
  const yLabels = [1, 0.75, 0.5, 0.25, 0].map((f) => `${Math.round(maxVal * f)}%`);
  const leader = sorted[0];
  const second = sorted[1];

  return (
    <div className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between relative ${isDark ? 'bg-[#091834] border border-[#132c58]' : 'bg-white border border-slate-100 shadow-xs'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <h3 className={`text-xs md:text-sm font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {showShareOfVoice ? 'Share of Voice (%) por marca' : 'Tasa de Visibilidad (%) por marca'}
          </h3>
          <span className="text-[10px] text-slate-400">
            {leader.brand} {showShareOfVoice ? `concentra ${leader.share_of_voice.toFixed(0)}%` : `aparece en ${leader.visibility_rate.toFixed(0)}%`} de las respuestas
          </span>
        </div>
        <div className="flex items-center gap-3">
          {[leader, second].filter(Boolean).map((b, i) => (
            <div key={b!.brand} className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                {b!.brand} ({i === 0 ? '1º' : '2º'})
              </span>
              <span className="text-xs font-bold" style={{ color: BRAND_COLORS[b!.brand] ?? '#64748b' }}>
                {(showShareOfVoice ? b!.share_of_voice : b!.visibility_rate).toFixed(0)}%
              </span>
            </div>
          ))}
          <button
            title="Alternar entre Visibilidad y Share of Voice"
            onClick={() => setShowShareOfVoice(!showShareOfVoice)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[180px] flex pt-2">
        <div className="flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-6 pr-2 select-none">
          {yLabels.map((lbl) => (
            <span key={lbl} className="leading-none text-right">{lbl}</span>
          ))}
        </div>

        <div className="relative flex-1 flex flex-col justify-between pb-6">
          <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
            {yLabels.map((_, i) => (
              <div key={i} className={`w-full border-b ${isDark ? 'border-[#142a52]' : 'border-slate-100'}`} />
            ))}
          </div>

          <div className="relative z-10 h-full flex items-end justify-around px-2">
            {sorted.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              const value = showShareOfVoice ? item.share_of_voice : item.visibility_rate;
              const heightPct = Math.min(100, Math.max(4, (value / maxVal) * 100));
              const color = BRAND_COLORS[item.brand] ?? '#64748b';

              return (
                <div
                  key={item.brand}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative flex flex-col items-center h-full justify-end group cursor-pointer w-10 sm:w-12"
                >
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-10 px-2.5 py-1 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap z-30 pointer-events-none text-white"
                      style={{ backgroundColor: color }}
                    >
                      {item.brand}: {value.toFixed(0)}% {showShareOfVoice ? 'SoV' : 'Visibilidad'}
                    </motion.div>
                  )}

                  <div
                    style={{ height: `${heightPct}%`, backgroundColor: color }}
                    className="relative w-3.5 sm:w-5 rounded-full transition-all duration-300 group-hover:scale-y-105"
                  />

                  <span
                    className={`absolute -bottom-5 text-[10px] font-medium transition-colors select-none ${
                      isHovered ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {item.brand}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
