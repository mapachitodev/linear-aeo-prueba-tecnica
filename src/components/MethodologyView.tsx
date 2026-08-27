import { BrandMetrics, PromptEvaluationResult, ThemeMode } from '../types';
import { computeSegments } from '../lib/breakdown';
import { SegmentBreakdown } from './SegmentBreakdown';
import { Sparkles, CheckCircle2, Cpu, BarChart } from 'lucide-react';

interface MethodologyViewProps {
  theme: ThemeMode;
  targetMetrics: BrandMetrics | null;
  results: PromptEvaluationResult[] | null;
}

export function MethodologyView({ theme, targetMetrics, results }: MethodologyViewProps) {
  const isDark = theme === 'dark';
  const byCategory = results ? computeSegments(results, (r) => r.category) : [];
  const byLanguage = results ? computeSegments(results, (r) => (r.language === 'ES' ? 'Español' : 'Inglés')) : [];

  const posScore = targetMetrics && targetMetrics.avg_position > 0
    ? Math.max(0, 100 - (targetMetrics.avg_position - 1) * 25)
    : 0;
  // Sentiment score isn't stored directly on BrandMetrics; the composite score
  // already bakes it in, so we back it out for display purposes only.
  const sentimentScore = targetMetrics && targetMetrics.aeo_score > 0
    ? Math.max(0, (targetMetrics.aeo_score - 0.4 * targetMetrics.visibility_rate - 0.3 * posScore) / 0.3)
    : 0;

  const pillars = [
    {
      title: '1. Visibilidad (ponderación 40%)',
      score: targetMetrics ? `${targetMetrics.visibility_rate.toFixed(0)} / 100` : '— / 100',
      description: 'Probabilidad empírica de que el modelo mencione a la marca al responder un prompt relevante.',
      formula: 'Visibilidad = (Respuestas con mención / Total consultas) × 100',
      badge: '40% del AEO Score',
    },
    {
      title: '2. Posición (ponderación 30%)',
      score: `${posScore.toFixed(0)} / 100`,
      description: 'Orden secuencial de aparición. Aparecer primero otorga el puntaje máximo.',
      formula: 'Posición Score = max(0, 100 − (Posición Promedio − 1) × 25)',
      badge: '30% del AEO Score',
    },
    {
      title: '3. Sentimiento (ponderación 30%)',
      score: `${sentimentScore.toFixed(0)} / 100`,
      description: 'Proporción de menciones con tono favorable frente al total de la muestra.',
      formula: 'Tono Score = (Menciones "Positivo" / N) × 100',
      badge: '30% del AEO Score',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Metodología del Score AEO (Answer Engine Optimization)
          </h2>
          <p className="text-xs text-slate-400">Fórmula usada para cuantificar la relevancia de marca en Gemini.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          AEO Score = 0.4(Visib) + 0.3(Pos) + 0.3(Tono)
        </div>
      </div>

      <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-gradient-to-r from-[#0d2146] to-[#07162d] border-indigo-500/30 shadow-md' : 'bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/50 border-indigo-200 shadow-xs'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {targetMetrics ? `Cálculo del AEO Score: ${targetMetrics.aeo_score.toFixed(1)} / 100` : 'Sin auditoría todavía'}
            </h3>
            <p className="text-xs text-slate-400">
              {targetMetrics
                ? `(0.4 × ${targetMetrics.visibility_rate.toFixed(0)}) + (0.3 × ${posScore.toFixed(0)}) + (0.3 × ${sentimentScore.toFixed(0)}) = ${targetMetrics.aeo_score.toFixed(1)} pts`
                : 'Ejecutá una auditoría desde el panel o la pestaña de Consulta en vivo para ver los números reales acá.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {pillars.map((p) => (
            <div key={p.title} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#061226]/80 border-[#142f5e]' : 'bg-white border-slate-100 shadow-xs'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">{p.badge}</span>
                <span className="text-xs font-bold font-mono text-slate-400">{p.score}</span>
              </div>
              <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.title}</h4>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{p.description}</p>
              <div className={`p-2 rounded-lg text-[10px] font-mono ${isDark ? 'bg-[#091834] text-sky-300' : 'bg-slate-50 text-slate-700'}`}>{p.formula}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091834] border-[#132c58]' : 'bg-white border-slate-100 shadow-xs'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Especificaciones de muestreo</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>18 prompts calibrados de intención de búsqueda</span></li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Temperature configurable (default 0.7) para capturar varianza</span></li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>{targetMetrics ? `${targetMetrics.sample_size_n} consultas en la última auditoría` : 'Sin auditorías corridas todavía'}</span></li>
          </ul>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#091834] border-[#132c58]' : 'bg-white border-slate-100 shadow-xs'}`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-4 h-4 text-emerald-400" />
            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Dispersión de la muestra</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {targetMetrics
              ? `Desviación estándar de la posición: ${targetMetrics.position_std_dev.toFixed(2)} (varianza ${targetMetrics.position_variance.toFixed(2)}). Entropía de Shannon sobre el bucket de rango: ${targetMetrics.entropy_score.toFixed(2)} bits — más alto significa que Gemini varía más dónde ubica a la marca entre repeticiones.`
              : 'Estos valores se calculan a partir de las repeticiones reales de la última auditoría, no son estimaciones fijas.'}
          </p>
        </div>
      </div>

      {results && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SegmentBreakdown title="Visibilidad por categoría de consulta" segments={byCategory} theme={theme} />
          <SegmentBreakdown title="Visibilidad por idioma" segments={byLanguage} theme={theme} />
        </div>
      )}
    </div>
  );
}
