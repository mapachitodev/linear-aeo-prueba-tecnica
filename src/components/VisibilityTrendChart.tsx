import { useEffect, useState } from 'react';
import { getSurveyHistory } from '../lib/api';
import { SurveyHistoryEntry, ThemeMode } from '../types';
import { motion } from 'motion/react';

interface VisibilityTrendChartProps {
  theme: ThemeMode;
  refreshKey?: string | null;
}

export function VisibilityTrendChart({ theme, refreshKey }: VisibilityTrendChartProps) {
  const isDark = theme === 'dark';
  const [history, setHistory] = useState<SurveyHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getSurveyHistory());
  }, [refreshKey]);

  const width = 500;
  const height = 180;
  const padding = { top: 25, right: 25, bottom: 35, left: 35 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (history.length === 0) {
    return (
      <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center h-[240px] text-xs text-center gap-1 ${isDark ? 'bg-[#091834] border-[#132c58] text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
        <span>Evolución de la visibilidad de Linear (por auditoría ejecutada)</span>
        <span className="opacity-70">Cada auditoría que corras en esta sesión aparece acá como un punto real.</span>
      </div>
    );
  }

  const points = history.map((h) => ({
    label: new Date(h.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    visibility: h.target_metrics.visibility_rate,
    position: h.target_metrics.avg_position,
  }));

  const getX = (i: number) => (points.length <= 1 ? padding.left + innerWidth / 2 : padding.left + (i / (points.length - 1)) * innerWidth);
  const getY = (val: number) => padding.top + innerHeight - (Math.min(100, val) / 100) * innerHeight;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(p.visibility)}`).join(' ');
  const lastIndex = points.length - 1;

  return (
    <div className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${isDark ? 'bg-[#091834] border border-[#132c58]' : 'bg-white border border-slate-100 shadow-xs'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <h3 className={`text-xs md:text-sm font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Evolución de la visibilidad de Linear
          </h3>
          <p className="text-[10px] text-slate-400">{history.length} auditoría{history.length === 1 ? '' : 's'} ejecutada{history.length === 1 ? '' : 's'} en esta sesión</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Visibilidad</span>
        </div>
      </div>

      <div className="relative w-full h-[170px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {[100, 75, 50, 25, 0].map((val) => (
            <g key={val}>
              <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} stroke={isDark ? '#162e59' : '#e2e8f0'} strokeWidth="0.8" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={getY(val) + 3} textAnchor="end" fontSize="9" fill={isDark ? '#7a92b8' : '#94a3b8'} className="font-mono select-none">
                {val}%
              </text>
            </g>
          ))}

          {points.length > 1 && <path d={linePath} fill="none" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth="3" strokeLinecap="round" />}

          {points.map((p, i) => (
            <g key={i}>
              <text x={getX(i)} y={height - 10} textAnchor="middle" fontSize="9" fill={i === lastIndex ? (isDark ? '#fff' : '#1e293b') : (isDark ? '#7a92b8' : '#94a3b8')} fontWeight={i === lastIndex ? 'bold' : 'normal'}>
                {p.label}
              </text>
              <circle cx={getX(i)} cy={getY(p.visibility)} r={i === lastIndex ? 4.5 : 3} fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
            </g>
          ))}
        </svg>

        {points[lastIndex] && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ left: `${(getX(lastIndex) / width) * 100}%`, top: `${(getY(points[lastIndex].visibility) / height) * 100 - 28}%`, transform: 'translate(-50%, -100%)' }}
            className="absolute pointer-events-none bg-[#6366f1] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex flex-col items-center gap-0.5"
          >
            <span>{points[lastIndex].visibility.toFixed(0)}%</span>
            <span className="text-[9px] font-semibold text-indigo-100">Pos: {points[lastIndex].position.toFixed(1)}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
