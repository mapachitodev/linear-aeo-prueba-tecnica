import { useState } from 'react';
import { X, Download, Sparkles, Printer, CheckCircle2, Compass, FileText } from 'lucide-react';
import { SurveyStatus, ThemeMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  survey: SurveyStatus | null;
}

export function ReportModal({ isOpen, onClose, theme, survey }: ReportModalProps) {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const brandMetrics = survey?.brand_metrics ?? [];
  const targetMetrics = brandMetrics.find((m) => m.brand === survey?.target_brand);

  const handleDownloadCSV = () => {
    const header = 'Marca,Visibilidad,ShareOfVoice,PosicionPromedio,DesviacionEstandar,AEOScore';
    const rows = brandMetrics.map(
      (m) => `${m.brand},${m.visibility_rate}%,${m.share_of_voice}%,${m.avg_position},${m.position_std_dev},${m.aeo_score}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SearchBrand_Linear_AEO_${survey?.survey_id ?? 'snapshot'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyInsights = () => {
    const lines = [
      `INFORME DE POSICIONAMIENTO AEO · ${survey?.target_brand ?? 'Linear'}`,
      targetMetrics ? `AEO Score: ${targetMetrics.aeo_score}/100` : 'Sin datos',
      targetMetrics
        ? `Visibilidad: ${targetMetrics.visibility_rate}% | Share of Voice: ${targetMetrics.share_of_voice}% | Posición: ${targetMetrics.avg_position} (σ=${targetMetrics.position_std_dev})`
        : '',
      '',
      ...(survey?.key_findings ?? []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl p-6 md:p-8 shadow-2xl border z-10 overflow-hidden ${isDark ? 'bg-[#081730] border-[#183566] text-white' : 'bg-white border-slate-100 text-slate-800'}`}
        >
          <div className="flex items-start justify-between pb-4 border-b border-slate-200/40 dark:border-slate-700/60 shrink-0">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SearchBrand · Reporte ejecutivo AEO
              </span>
              <h3 className="text-xl font-bold mt-1">Informe de decisiones de negocio & AEO</h3>
              {targetMetrics && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  n={targetMetrics.sample_size_n} muestras · Survey {survey?.survey_id}
                </p>
              )}
            </div>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-5 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {!targetMetrics ? (
              <p className="text-sm text-slate-400">Ejecutá una auditoría primero para generar el reporte.</p>
            ) : (
              <>
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#0c2044] border-indigo-500/30' : 'bg-indigo-50/70 border-indigo-200'}`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Evaluación global de marca</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {targetMetrics.brand}: {targetMetrics.aeo_score >= 60 ? 'posición sólida' : 'oportunidad de mejora'} en Gemini (Score {targetMetrics.aeo_score.toFixed(1)}/100)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {targetMetrics.visibility_rate.toFixed(0)}% de visibilidad · {targetMetrics.share_of_voice.toFixed(0)}% share of voice · Posición media {targetMetrics.avg_position.toFixed(1)}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-mono font-bold text-center shrink-0">
                    <span className="text-2xl font-black">{targetMetrics.aeo_score.toFixed(1)}</span>
                    <span className="text-[10px] block opacity-80">AEO SCORE</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Hallazgos clave
                  </h5>
                  <div className={`p-4 rounded-2xl text-xs space-y-2 border ${isDark ? 'bg-[#051126] border-[#132c58] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    {(survey?.key_findings ?? []).map((finding, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{finding}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                    <Compass className="w-3.5 h-3.5 text-sky-400" /> Comparativa por marca
                  </h5>
                  <div className={`rounded-2xl border overflow-hidden text-xs ${isDark ? 'border-[#132c58]' : 'border-slate-200'}`}>
                    <table className="w-full text-left">
                      <thead className={isDark ? 'bg-[#0b2046] text-slate-300' : 'bg-slate-50 text-slate-500'}>
                        <tr>
                          <th className="px-3 py-2 font-semibold">Marca</th>
                          <th className="px-3 py-2 font-semibold text-right">Visib.</th>
                          <th className="px-3 py-2 font-semibold text-right">SoV</th>
                          <th className="px-3 py-2 font-semibold text-right">Pos.</th>
                          <th className="px-3 py-2 font-semibold text-right">AEO</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'text-slate-200' : 'text-slate-700'}>
                        {[...brandMetrics].sort((a, b) => b.aeo_score - a.aeo_score).map((m) => (
                          <tr key={m.brand} className="border-t border-slate-200/20 dark:border-slate-800/40">
                            <td className="px-3 py-2 font-semibold">{m.brand}</td>
                            <td className="px-3 py-2 text-right">{m.visibility_rate.toFixed(0)}%</td>
                            <td className="px-3 py-2 text-right">{m.share_of_voice.toFixed(0)}%</td>
                            <td className="px-3 py-2 text-right">{m.avg_position > 0 ? m.avg_position.toFixed(1) : '—'}</td>
                            <td className="px-3 py-2 text-right font-bold">{m.aeo_score.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/40 dark:border-slate-700/60 shrink-0">
            <button
              onClick={handleCopyInsights}
              disabled={!targetMetrics}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40 ${copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{copied ? '¡Copiado!' : 'Copiar resumen'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} disabled={!targetMetrics} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-40 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>Imprimir / PDF</span>
              </button>
              <button onClick={handleDownloadCSV} disabled={!targetMetrics} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition-all">
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
