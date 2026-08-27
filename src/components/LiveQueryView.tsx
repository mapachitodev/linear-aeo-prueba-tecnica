import { useState, type FormEvent } from 'react';
import { PromptEvaluationResult, SurveyStatus, TARGET_BRAND, ThemeMode } from '../types';
import { evaluatePrompt, RunSurveyParams } from '../lib/api';
import {
  Sparkles, Play, CheckCircle2, Clock, MessageSquare, Eye, Copy, Check, X,
  RotateCw, Zap, Send, HelpCircle, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { EvaluateResponse } from '../types';

interface LiveQueryViewProps {
  theme: ThemeMode;
  searchQuery: string;
  survey: SurveyStatus | null;
  isAuditRunning: boolean;
  onRunAudit: (params?: RunSurveyParams) => void;
}

const PRESET_QUESTIONS = [
  '¿Cuál es la mejor herramienta de gestión de proyectos para un equipo de ingeniería en 2026?',
  'Linear vs Jira: ¿cuál es mejor para trackear issues de software y por qué?',
  'Compará Linear, Jira, Asana, Monday y Notion para un equipo de producto mediano.',
  '¿Qué herramienta de gestión de proyectos me recomendás para mi startup?',
];

export function LiveQueryView({ theme, searchQuery, survey, isAuditRunning, onRunAudit }: LiveQueryViewProps) {
  const isDark = theme === 'dark';
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [rankFilter, setRankFilter] = useState('All');

  const [inputPrompt, setInputPrompt] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EvaluateResponse | null>(null);
  const [inspecting, setInspecting] = useState<PromptEvaluationResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const prompts = survey?.results ?? [];
  const categories = Array.from(new Set(prompts.map((p) => p.category)));

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.co_occurring_brands.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesLanguage = languageFilter === 'All' || p.language === languageFilter;
    const matchesRank =
      rankFilter === 'All' ||
      (rankFilter === 'top1' && p.target_rank === 1) ||
      (rankFilter === 'mentioned' && p.target_mentioned) ||
      (rankFilter === 'unmentioned' && !p.target_mentioned);
    return matchesSearch && matchesCategory && matchesLanguage && matchesRank;
  });

  const handleExecutePrompt = async (e?: FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputPrompt;
    if (!query.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setEvaluateError(null);
    try {
      const result = await evaluatePrompt(query);
      setLastResult(result);
      setInputPrompt('');
    } catch (err) {
      setEvaluateError(err instanceof Error ? err.message : 'No se pudo conectar con el backend.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            Live Exploration
          </span>
        </div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Consulta en vivo</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Lanzá cualquier pregunta a Gemini y mirá al instante si menciona a Linear, en qué posición y con qué tono.{' '}
          <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
            Este resultado no se guarda en la auditoría oficial — es solo para explorar.
          </span>
        </p>
      </div>

      <div className={`p-3 rounded-2xl border flex items-center gap-2 text-xs ${isDark ? 'bg-[#081836] border-[#18386e] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
        <span>Modo exploración libre: probá prompts ad-hoc sin alterar la base estadística de la auditoría oficial.</span>
      </div>

      <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-gradient-to-r from-[#0c2452] via-[#091834] to-[#061226] border-indigo-500/40 shadow-xl' : 'bg-gradient-to-r from-indigo-50/80 via-white to-sky-50 border-indigo-200 shadow-md'}`}>
        <form onSubmit={(e) => handleExecutePrompt(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Escribí tu pregunta para Gemini:</span>
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <MessageSquare className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  type="text"
                  placeholder="Ej: ¿Qué herramienta de gestión de proyectos me recomendás para mi startup?"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-2xl text-xs outline-none border transition-colors ${isDark ? 'bg-[#050f22] border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500' : 'bg-white border-indigo-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 shadow-inner'}`}
                />
              </div>
              <button
                type="submit"
                disabled={isEvaluating || !inputPrompt.trim()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                {isEvaluating ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isEvaluating ? 'Consultando Gemini…' : 'Consultar en vivo'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Preguntas de prueba sugeridas:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleExecutePrompt(undefined, question)}
                  className={`text-left text-xs p-3 rounded-2xl border transition-all flex items-start justify-between gap-2 group ${isDark ? 'bg-[#081836]/80 hover:bg-[#0c2452] border-[#18386e] hover:border-indigo-500/50 text-slate-200' : 'bg-white/80 hover:bg-white border-slate-200 hover:border-indigo-300 text-slate-700 shadow-xs'}`}
                >
                  <span className="font-medium line-clamp-2">"{question}"</span>
                  <Play className="w-3 h-3 text-indigo-500 opacity-60 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </form>

        {evaluateError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{evaluateError}</span>
          </div>
        )}

        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-5 rounded-3xl border ${isDark ? 'bg-[#050f22] border-indigo-500/40 shadow-xl' : 'bg-white border-indigo-200 shadow-lg'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/30 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center gap-1.5 ring-1 ring-indigo-500/30">
                  <Sparkles className="w-3 h-3" />
                  Resultado en vivo
                </span>
                <span className="text-xs text-slate-400 font-mono">{lastResult.model_used}</span>
                {lastResult.is_simulated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">simulado</span>
                )}
              </div>
              <button
                onClick={() => handleCopyText(lastResult.response, 'live')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                  copiedId === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {copiedId === 'live' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'live' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#091834]' : 'bg-slate-50'}`}>
                <span className="text-[10px] text-slate-400 block font-medium">Menciona a Linear</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {lastResult.target_mentioned ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">Sí</span></>
                  ) : (
                    <><X className="w-4 h-4 text-slate-400" /><span className="text-sm font-bold text-slate-400">No</span></>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#091834]' : 'bg-slate-50'}`}>
                <span className="text-[10px] text-slate-400 block font-medium">Posición</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                  {lastResult.target_rank ? `#${lastResult.target_rank}` : 'N/A'}
                </span>
              </div>
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#091834]' : 'bg-slate-50'}`}>
                <span className="text-[10px] text-slate-400 block font-medium">Tono</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">{lastResult.target_sentiment}</span>
              </div>
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#091834]' : 'bg-slate-50'}`}>
                <span className="text-[10px] text-slate-400 block font-medium">Otras marcas</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lastResult.other_brands.slice(0, 3).map((brand) => (
                    <span key={brand} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${brand === 'Linear' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-indigo-400">
                Pregunta: <span className="text-slate-200 font-normal">"{lastResult.prompt}"</span>
              </div>
              <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border whitespace-pre-line ${isDark ? 'bg-[#081836] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                {lastResult.response}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Auditoría oficial calibrada (18 prompts)</h3>
          <p className="text-xs text-slate-400">Batch completo contra Gemini con métricas agregadas por marca.</p>
        </div>
        <button
          onClick={() => onRunAudit()}
          disabled={isAuditRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all shrink-0"
        >
          {isAuditRunning ? <Clock className="w-4 h-4 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
          <span>{isAuditRunning ? `Auditando (${survey?.progress ?? 0}/${survey?.total ?? 0})…` : 'Ejecutar auditoría oficial'}</span>
        </button>
      </div>

      {isAuditRunning && survey && (
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#081836] border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 animate-spin" /> Muestreando contra Gemini…
            </span>
            <span className="font-mono font-bold">{survey.total > 0 ? Math.round((survey.progress / survey.total) * 100) : 0}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-150 rounded-full" style={{ width: `${survey.total > 0 ? (survey.progress / survey.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {prompts.length === 0 ? (
        <div className={`p-6 rounded-2xl border text-xs text-center ${isDark ? 'bg-[#091834] border-[#132c58] text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
          Todavía no corriste la auditoría oficial. Los 18 prompts calibrados van a aparecer acá con resultados reales de Gemini.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`text-xs px-3 py-2 rounded-xl outline-none border transition-colors ${isDark ? 'bg-[#091834] border-[#183566] text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                <option value="All">Todas las categorías</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className={`text-xs px-3 py-2 rounded-xl outline-none border transition-colors ${isDark ? 'bg-[#091834] border-[#183566] text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                <option value="All">Todos los idiomas</option>
                <option value="ES">Español (ES)</option>
                <option value="EN">Inglés (EN)</option>
              </select>
              <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} className={`text-xs px-3 py-2 rounded-xl outline-none border transition-colors ${isDark ? 'bg-[#091834] border-[#183566] text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                <option value="All">Todos los rankings</option>
                <option value="top1">#1 Top-of-mind</option>
                <option value="mentioned">Mencionado</option>
                <option value="unmentioned">No mencionado</option>
              </select>
            </div>
            <span className="text-xs text-slate-400 font-medium">Mostrando {filteredPrompts.length} de {prompts.length} consultas</span>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#091834] border-[#132c58]' : 'bg-white border-slate-100 shadow-xs'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${isDark ? 'bg-[#0b2046] border-[#142e5c] text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Prompt</th>
                    <th className="px-4 py-3 font-semibold">Categoría / Idioma</th>
                    <th className="px-4 py-3 font-semibold text-center">Posición Linear</th>
                    <th className="px-4 py-3 font-semibold text-center">Tono</th>
                    <th className="px-4 py-3 font-semibold">Marcas co-mencionadas</th>
                    <th className="px-4 py-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#142e5c]/50">
                  {filteredPrompts.map((p) => (
                    <tr key={p.iteration_id} onClick={() => setInspecting(p)} className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-[#0e244b] text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <td className="px-4 py-3 font-medium max-w-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block line-clamp-2">"{p.prompt_text}"</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{p.iteration_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">{p.category}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-400 uppercase">{p.language}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.target_rank === 1 ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30' : p.target_rank === 2 ? 'bg-sky-500/20 text-sky-400' : p.target_rank === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {p.target_rank ? `#${p.target_rank}` : 'No mencionado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${p.target_sentiment === 'Positivo' ? 'text-emerald-400 bg-emerald-500/10' : p.target_sentiment === 'Neutro' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                          {p.target_sentiment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.co_occurring_brands.map((b) => (
                            <span key={b} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${b === 'Linear' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{b}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setInspecting(p); }} className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors" title="Ver respuesta completa">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {inspecting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspecting(null)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-2xl rounded-3xl p-6 shadow-2xl border z-10 space-y-4 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#081730] border-[#1a335e] text-white' : 'bg-white border-slate-100 text-slate-800'}`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auditoría detallada
                  </span>
                  <h3 className="text-base font-bold mt-1">"{inspecting.prompt_text}"</h3>
                </div>
                <button onClick={() => setInspecting(null)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0e244b]' : 'bg-slate-50'}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Posición Linear</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{inspecting.target_rank ? `#${inspecting.target_rank}` : 'No mencionada'}</span>
                </div>
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0e244b]' : 'bg-slate-50'}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Tono</span>
                  <span className="text-base font-black text-emerald-400">{inspecting.target_sentiment}</span>
                </div>
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#0e244b]' : 'bg-slate-50'}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Latencia</span>
                  <span className="text-base font-black text-sky-400">{inspecting.latency_ms.toFixed(0)}ms</span>
                </div>
              </div>

              {(() => {
                const targetEntity = inspecting.parsed_entities.find(
                  (e) => e.brand_name.toLowerCase() === TARGET_BRAND.toLowerCase()
                );
                if (!targetEntity?.context_snippet) return null;
                return (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-400">
                      Por qué se clasificó así (fragmento citado)
                    </span>
                    <div className="p-4 rounded-2xl text-xs leading-relaxed border border-indigo-500/30 bg-indigo-500/5">
                      <p className="italic text-indigo-600 dark:text-indigo-300">"…{targetEntity.context_snippet.trim()}…"</p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-400">Respuesta del modelo</span>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans border ${isDark ? 'bg-[#050f22] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="whitespace-pre-line">{inspecting.raw_response}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono">{inspecting.iteration_id}</span>
                <button
                  onClick={() => handleCopyText(inspecting.raw_response, inspecting.iteration_id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${copiedId === inspecting.iteration_id ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                >
                  {copiedId === inspecting.iteration_id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === inspecting.iteration_id ? 'Copiado' : 'Copiar respuesta'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
