import { BrandMetrics, PromptEvaluationResult, ThemeMode } from '../types';
import { computeSentimentBreakdown, computePromptStability, Sentiment } from '../lib/breakdown';
import { Hash, Repeat, Activity, MessageSquareQuote } from 'lucide-react';

interface SensitivityViewProps {
  theme: ThemeMode;
  targetMetrics: BrandMetrics | null;
  results: PromptEvaluationResult[] | null;
}

const SENTIMENT_STYLE: Record<Sentiment, { bar: string; text: string }> = {
  Positivo: { bar: 'from-emerald-500 to-emerald-600', text: 'text-emerald-500' },
  Neutro: { bar: 'from-slate-400 to-slate-500', text: 'text-slate-400' },
  Negativo: { bar: 'from-rose-500 to-rose-600', text: 'text-rose-500' },
};

export function SensitivityView({ theme, targetMetrics, results }: SensitivityViewProps) {
  const isDark = theme === 'dark';
  const hasData = !!results && results.length > 0 && !!targetMetrics;
  const cardCls = `p-5 rounded-2xl border ${isDark ? 'bg-[#091834] border-[#132c58]' : 'bg-white border-slate-100 shadow-xs'}`;

  const sentimentBreakdown = results ? computeSentimentBreakdown(results, targetMetrics?.brand ?? 'Linear') : [];
  const stability = results ? computePromptStability(results) : [];
  const unstablePrompts = stability.filter((p) => !p.isStable);

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Análisis de sensibilidad</h2>
        <p className="text-xs text-slate-400">
          Lectura de cómo varían las respuestas de Gemini sobre {targetMetrics?.brand ?? 'la marca'} entre repeticiones de la
          última auditoría. Los parámetros de muestreo (temperatura, repeticiones por prompt) son fijos a nivel de código —
          esta vista es un reporte, no un panel de configuración.
        </p>
      </div>

      {!hasData ? (
        <div className={cardCls}>
          <p className="text-xs text-slate-400">
            Todavía no hay datos. Ejecutá una auditoría desde el botón "Ejecutar auditoría" arriba para ver frecuencia de
            mención, posición, sentimiento y estabilidad calculados sobre respuestas reales de Gemini.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={cardCls}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Hash className="w-4 h-4 text-indigo-500" />
                Frecuencia de mención
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {targetMetrics!.visibility_rate.toFixed(0)}%
                </span>
                <span className="text-xs text-slate-400">
                  {Math.round((targetMetrics!.visibility_rate / 100) * targetMetrics!.sample_size_n)} de {targetMetrics!.sample_size_n} consultas mencionan a {targetMetrics!.brand}
                </span>
              </div>
            </div>

            <div className={cardCls}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Hash className="w-4 h-4 text-indigo-500" />
                Posición promedio
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {targetMetrics!.avg_position > 0 ? `#${targetMetrics!.avg_position.toFixed(1)}` : '—'}
                </span>
                <span className="text-xs text-slate-400">
                  Top-of-mind (1ª posición) en {targetMetrics!.top_of_mind_rate.toFixed(0)}% de las menciones
                </span>
              </div>
            </div>
          </div>

          <div className={cardCls}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <MessageSquareQuote className="w-4 h-4 text-indigo-500" />
              Sentimiento / contexto
            </h3>
            <div className="space-y-3">
              {sentimentBreakdown.map((s) => (
                <div key={s.sentiment}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold w-16 shrink-0 ${SENTIMENT_STYLE[s.sentiment].text}`}>{s.sentiment}</span>
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${SENTIMENT_STYLE[s.sentiment].bar}`} style={{ width: `${Math.max(2, s.rate)}%` }} />
                    </div>
                    <span className={`text-[11px] font-bold w-16 text-right shrink-0 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {s.rate.toFixed(0)}% ({s.count})
                    </span>
                  </div>
                  {s.example && (
                    <p className={`text-[11px] mt-1 ml-[76px] italic line-clamp-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      "…{s.example.trim()}…"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={cardCls}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Activity className="w-4 h-4 text-indigo-500" />
              Estabilidad (varianza)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Desviación estándar de posición: <span className="font-mono font-bold text-indigo-500">{targetMetrics!.position_std_dev.toFixed(2)}</span>
              {' '}(varianza {targetMetrics!.position_variance.toFixed(2)}) · Entropía de Shannon:{' '}
              <span className="font-mono font-bold text-indigo-500">{targetMetrics!.entropy_score.toFixed(2)} bits</span> — más alto significa que
              Gemini varía más dónde ubica a {targetMetrics!.brand} entre repeticiones.
            </p>

            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Repeat className="w-3.5 h-3.5" />
              Misma pregunta, repetida — ¿cambia la respuesta?
            </h4>
            {unstablePrompts.length === 0 ? (
              <p className="text-xs text-slate-400">
                Ninguna de las {stability.length} preguntas de la auditoría cambió de resultado entre sus repeticiones: la mención y el
                tono de {targetMetrics!.brand} fueron consistentes cada vez que se repitió el mismo prompt.
              </p>
            ) : (
              <div className="space-y-2">
                {unstablePrompts.slice(0, 6).map((p) => (
                  <div key={p.promptId} className={`p-2.5 rounded-xl text-xs ${isDark ? 'bg-[#0f254b]/60' : 'bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{p.promptId} · {p.category}</span>
                      <span className="text-[10px] text-amber-500 font-bold shrink-0">inestable</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.promptText}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Mencionado en {p.mentionRate.toFixed(0)}% de las {p.repetitions} repeticiones · tono: {p.sentiments.join(', ')}
                    </p>
                  </div>
                ))}
                {unstablePrompts.length > 6 && (
                  <p className="text-[10px] text-slate-400">+ {unstablePrompts.length - 6} preguntas inestables más.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
