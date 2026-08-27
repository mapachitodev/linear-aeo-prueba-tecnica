import { Sparkles, TrendingUp, Eye, Hash } from 'lucide-react';
import { BrandMetrics, ThemeMode } from '../types';

interface StatCardsProps {
  targetMetrics: BrandMetrics | null;
  theme: ThemeMode;
  onOpenReport?: () => void;
}

interface CardDef {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Sparkles;
  highlight?: boolean;
}

export function StatCards({ targetMetrics, theme, onOpenReport }: StatCardsProps) {
  const isDark = theme === 'dark';

  const cards: CardDef[] = targetMetrics
    ? [
        {
          id: 'aeo-score',
          title: `AEO Score de ${targetMetrics.brand}`,
          value: `${targetMetrics.aeo_score}`,
          subtitle: `Visibilidad ${targetMetrics.visibility_rate.toFixed(0)}% · Top-of-mind ${targetMetrics.top_of_mind_rate.toFixed(0)}%`,
          icon: Sparkles,
          highlight: true,
        },
        {
          id: 'visibility',
          title: 'Tasa de visibilidad',
          value: `${targetMetrics.visibility_rate.toFixed(0)}%`,
          subtitle: `% de respuestas que mencionan a ${targetMetrics.brand} (n=${targetMetrics.sample_size_n})`,
          icon: Eye,
        },
        {
          id: 'share-of-voice',
          title: 'Share of voice',
          value: `${targetMetrics.share_of_voice.toFixed(0)}%`,
          subtitle: `Menciones de ${targetMetrics.brand} / menciones totales de marcas`,
          icon: TrendingUp,
        },
        {
          id: 'avg-position',
          title: 'Posición promedio',
          value: targetMetrics.avg_position > 0 ? targetMetrics.avg_position.toFixed(1) : '—',
          subtitle: `Desviación estándar ${targetMetrics.position_std_dev.toFixed(2)} · varianza ${targetMetrics.position_variance.toFixed(2)}`,
          icon: Hash,
        },
      ]
    : [
        { id: 'aeo-score', title: 'AEO Score', value: '—', subtitle: 'Ejecutá una auditoría para calcularlo', icon: Sparkles, highlight: true },
        { id: 'visibility', title: 'Tasa de visibilidad', value: '—', subtitle: 'Sin datos aún', icon: Eye },
        { id: 'share-of-voice', title: 'Share of voice', value: '—', subtitle: 'Sin datos aún', icon: TrendingUp },
        { id: 'avg-position', title: 'Posición promedio', value: '—', subtitle: 'Sin datos aún', icon: Hash },
      ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`relative p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between ${
              card.highlight
                ? isDark
                  ? 'bg-gradient-to-br from-[#12183b] to-[#0a142d] border-2 border-indigo-500/50 shadow-sm'
                  : 'bg-gradient-to-br from-indigo-50/90 to-white border-2 border-indigo-300 shadow-xs'
                : isDark
                ? 'bg-[#091936] hover:bg-[#0c224a] border border-[#132c58]'
                : 'bg-white hover:bg-slate-50/80 border border-slate-100 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-xs font-semibold ${
                  card.highlight ? 'text-indigo-500 dark:text-indigo-400 font-bold' : isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {card.title}
              </span>
              <Icon className={`w-5 h-5 shrink-0 ${card.highlight ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : isDark ? 'text-slate-200' : 'text-slate-700'}`} />
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
                    card.highlight ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : isDark ? 'text-white' : 'text-[#16274b]'
                  }`}
                >
                  {card.value}
                </span>
                {card.highlight && card.value !== '—' && <span className="text-xs font-semibold text-slate-400">/ 100</span>}
              </div>
              <p className={`text-[10px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.subtitle}</p>
            </div>

            <div className="flex items-center justify-end pt-1 border-t border-slate-200/20 dark:border-slate-800/40 mt-1">
              <button
                onClick={onOpenReport}
                disabled={!targetMetrics}
                className={`text-[11px] font-medium transition-colors hover:underline disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark ? 'text-sky-400 hover:text-sky-300' : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                Ver reporte
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
