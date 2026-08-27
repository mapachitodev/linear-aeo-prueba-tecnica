import { useEffect, useRef, useState } from 'react';
import { Search, FileText, RotateCw, AlertTriangle, CheckCircle2, Bell, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { SurveyStatus, ThemeMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  theme: ThemeMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  survey: SurveyStatus | null;
  isAuditRunning: boolean;
  auditError: string | null;
  onRunAudit: () => void;
  onOpenReport: () => void;
}

export function Header({
  theme,
  searchQuery,
  onSearchChange,
  survey,
  isAuditRunning,
  auditError,
  onRunAudit,
  onOpenReport,
}: HeaderProps) {
  const isDark = theme === 'dark';
  const hasData = survey?.status === 'completed';
  const isSimulated = survey?.results?.some((r) => r.is_simulated) ?? false;
  const targetMetrics = survey?.brand_metrics?.find((m) => m.brand === survey.target_brand) ?? null;

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const findings = survey?.key_findings ?? [];
  // A real, computed variability read - high std-dev means Gemini places the
  // brand in very different spots run to run, which is exactly the kind of
  // instability worth flagging (not a simulated toggle).
  const isHighVariance = (targetMetrics?.position_std_dev ?? 0) > 1.0;

  return (
    <header className="w-full flex flex-col gap-3 pb-3 relative z-30">
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
              SearchBrand / AEO · Linear
            </span>
            {hasData && isSimulated && (
              <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Modo simulado — configurá GEMINI_API_KEY para datos reales
              </span>
            )}
          </div>
          <h1 className={`text-xl md:text-2xl font-bold tracking-tight mt-1 ${isDark ? 'text-white' : 'text-[#16274b]'}`}>
            Visibilidad de Linear en Gemini
          </h1>
        </div>

        <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2.5 lg:gap-3">
          <div className="relative flex-1 md:w-48 lg:w-60">
            <input
              type="text"
              placeholder="Buscar prompt o marca..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full h-9 pl-4 pr-9 rounded-full text-xs transition-all duration-200 outline-none ${
                isDark
                  ? 'bg-[#061226] text-slate-100 placeholder-slate-400 border border-[#162d55] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
                  : 'bg-indigo-50/70 text-slate-800 placeholder-slate-400/80 border border-indigo-200/60 focus:border-indigo-400 shadow-sm focus:shadow-md'
              }`}
            />
            <Search className={`w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-300' : 'text-indigo-400'}`} />
          </div>

          {/* Notifications: real findings from the last completed audit */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Ver hallazgos de la última auditoría"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-full transition-all duration-200 ${
                isDark ? 'hover:bg-slate-800/80 text-sky-300' : 'hover:bg-slate-100 text-sky-500'
              }`}
            >
              <Bell className="w-4 h-4 fill-current" />
              {findings.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-[#07152b]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 ${
                    isDark ? 'bg-[#081730] border-[#1a335e] text-slate-200' : 'bg-white border-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/40 dark:border-slate-700/60">
                    <span className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Hallazgos de la auditoría
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {findings.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Todavía no hay auditorías completadas.</p>
                    ) : (
                      findings.map((finding, i) => (
                        <div key={i} className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${isDark ? 'bg-[#0f254b]/60' : 'bg-slate-50'}`}>
                          <span className="text-indigo-500 font-bold shrink-0">•</span>
                          <p className="text-[11px] leading-relaxed">{finding}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onOpenReport}
            disabled={!hasData}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#0f254b] hover:bg-[#18396e] text-slate-200 border border-[#1e3c70]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="w-3 h-3 text-indigo-500" />
            <span>Reporte ejecutivo</span>
          </button>

          <button
            onClick={onRunAudit}
            disabled={isAuditRunning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold shadow-md shadow-indigo-500/20 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60 text-white transition-all shrink-0"
          >
            <RotateCw className={`w-3 h-3 ${isAuditRunning ? 'animate-spin' : ''}`} />
            <span>{isAuditRunning ? 'Auditando…' : 'Ejecutar auditoría'}</span>
          </button>
        </div>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-2 pt-1 pb-1 border-b text-xs ${
          isDark ? 'border-slate-800/60' : 'border-slate-200/40'
        }`}
      >
        {hasData ? (
          <p className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              Snapshot: {new Date(survey!.completed_at!).toLocaleString('es-ES')}
            </span>{' '}
            · {survey!.results?.length ?? 0} consultas · modelo{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-blue-500">
              {survey!.results?.[0]?.model_name ?? '—'}
            </code>
          </p>
        ) : (
          <p className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Todavía no ejecutaste ninguna auditoría en esta sesión.
          </p>
        )}
        {isAuditRunning && survey && (
          <span className="text-[11px] font-mono text-indigo-500">
            {survey.progress}/{survey.total} consultas
          </span>
        )}
      </div>

      {auditError && (
        <div
          className={`w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border ${
            isDark ? 'bg-[#2b101b]/90 border-rose-500/40 text-rose-300' : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {hasData && !auditError && !isAuditRunning && targetMetrics && (
        <div
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
            isHighVariance
              ? isDark
                ? 'bg-[#2b1d10]/90 border-amber-500/40 text-amber-300'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
              : isDark
              ? 'bg-[#091a35]/80 border-emerald-500/30 text-emerald-300'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {isHighVariance ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
            <span>
              {isHighVariance
                ? `Alta variabilidad: la posición de ${targetMetrics.brand} osciló con desvío estándar ${targetMetrics.position_std_dev.toFixed(2)} entre repeticiones.`
                : `Posición estable: desvío estándar ${targetMetrics.position_std_dev.toFixed(2)} sobre ${targetMetrics.sample_size_n} muestras.`}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
