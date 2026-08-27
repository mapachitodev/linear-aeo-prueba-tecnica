import { BRAND_COLORS, BrandMetrics, TARGET_BRAND, ThemeMode } from '../types';
import { BrandLogo } from './BrandLogo';

interface BrandRankingListProps {
  brandMetrics: BrandMetrics[] | null;
  theme: ThemeMode;
  searchQuery: string;
}

const TIERS = ['Leader', 'Gold', 'Silver', 'Challenger', 'Niche'];
const TIER_STYLES: Record<string, string> = {
  Leader: 'text-indigo-600 dark:text-indigo-400',
  Gold: 'text-amber-600 dark:text-amber-400',
  Silver: 'text-sky-600 dark:text-sky-400',
  Challenger: 'text-slate-500 dark:text-slate-400',
  Niche: 'text-slate-400 dark:text-slate-500',
};

export function BrandRankingList({ brandMetrics, theme, searchQuery }: BrandRankingListProps) {
  const isDark = theme === 'dark';

  if (!brandMetrics || brandMetrics.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className={`text-sm md:text-base font-semibold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          Tasa de visibilidad y Share of Voice por marca
        </h2>
        <div className={`p-6 rounded-2xl border text-xs ${isDark ? 'bg-[#091834] border-[#132c58] text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
          Todavía no hay datos. Ejecutá una auditoría desde el botón "Ejecutar auditoría" arriba para comparar Linear
          contra Jira, Asana, Monday y Notion en Gemini.
        </div>
      </section>
    );
  }

  // Tier is just the real leaderboard position relabeled - not a separate
  // fabricated score, so it always agrees with the visibility numbers shown.
  const ranked = [...brandMetrics].sort((a, b) => b.visibility_rate - a.visibility_rate);
  const tierByBrand = new Map(ranked.map((b, i) => [b.brand, TIERS[Math.min(i, TIERS.length - 1)]]));
  const leader = ranked[0];

  const visible = ranked.filter((b) => b.brand.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-sm md:text-base font-semibold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Tasa de visibilidad y Share of Voice por marca
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Comparativa directa de menciones en Gemini</p>
        </div>
        {leader && (
          <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-full">
            {leader.brand} lidera con {leader.visibility_rate.toFixed(0)}% visibilidad
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {visible.map((brand) => {
          const color = BRAND_COLORS[brand.brand] ?? '#64748b';
          const isTarget = brand.brand === TARGET_BRAND;
          const tier = tierByBrand.get(brand.brand) ?? 'Niche';

          return (
            <div
              key={brand.brand}
              className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isTarget
                  ? isDark
                    ? 'bg-[#102048] border-2 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                    : 'bg-gradient-to-r from-indigo-50/80 to-white border-2 border-indigo-300 shadow-sm'
                  : isDark
                  ? 'bg-[#0a1b38] border border-[#142e5c]/80 shadow-sm'
                  : 'bg-white border border-slate-100 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-[160px] lg:min-w-[180px]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    boxShadow: `0 2px 10px ${color}55`,
                  }}
                >
                  <BrandLogo brand={brand.brand} className={isTarget ? 'w-4 h-4' : ''} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs md:text-sm font-bold block tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {brand.brand}
                    </span>
                    {isTarget && (
                      <span className="text-[9px] bg-indigo-600 text-white font-semibold px-1.5 py-0.2 rounded-full">Target</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">n={brand.sample_size_n}</span>
                </div>
              </div>

              <div className="min-w-[100px] text-left sm:text-center">
                <span className={`text-xs md:text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#16274b]'}`}>
                  {brand.visibility_rate.toFixed(0)}% <span className="text-[10px] font-normal text-slate-400">visibilidad</span>
                </span>
              </div>

              <div className="min-w-[100px] text-left sm:text-center">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {brand.share_of_voice.toFixed(0)}% <span className="text-[10px] text-slate-400">SoV</span>
                </span>
              </div>

              <div className="min-w-[100px] text-left sm:text-center">
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {brand.avg_position > 0 ? brand.avg_position.toFixed(1) : '—'} <span className="text-[10px] text-slate-400">pos. prom</span>
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[110px]">
                <span className={`text-xs font-bold tracking-wide select-none ${TIER_STYLES[tier]}`}>+{tier}</span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {brand.aeo_score.toFixed(1)} <span className="text-[10px] text-slate-400">AEO</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
