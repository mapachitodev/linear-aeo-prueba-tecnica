import { useCallback, useEffect, useState } from 'react';
import { NavTab, SurveyStatus, ThemeMode } from './types';
import { estimateAuditDurationMs, getLatestSurvey, runSurvey, RunSurveyParams } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BrandRankingList } from './components/BrandRankingList';
import { StatCards } from './components/StatCards';
import { VisibilityTrendChart } from './components/VisibilityTrendChart';
import { BrandComparisonChart } from './components/BrandComparisonChart';
import { LiveQueryView } from './components/LiveQueryView';
import { MethodologyView } from './components/MethodologyView';
import { SensitivityView } from './components/SensitivityView';
import { ReportModal } from './components/ReportModal';
import { AmbientBackground } from './components/AmbientBackground';
import { Maximize2, Minimize2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFramedView, setIsFramedView] = useState(true);

  const [survey, setSurvey] = useState<SurveyStatus | null>(null);
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    setSurvey(getLatestSurvey());
  }, []);

  const runAudit = useCallback(async (params: RunSurveyParams = {}) => {
    setIsAuditRunning(true);
    setAuditError(null);

    const iterations = params.iterations_per_prompt ?? 5;
    const total = 18 * iterations;
    const estimatedMs = estimateAuditDurationMs(iterations);
    const startedAt = Date.now();

    // The backend runs the audit synchronously now (no BackgroundTasks, no
    // survey_id to poll - see lib/api.ts) so there's no real progress to
    // report while the request is in flight. This eases a time-based
    // estimate toward (never reaching) 100% so the UI isn't just a static
    // spinner for the 1-3 minutes a full audit takes.
    // Cards/charts go back to their empty state for the duration of the run
    // (brand_metrics/results/key_findings: null) instead of showing stale
    // numbers from the previous audit next to a "running" progress count -
    // matches how the old server-reported "pending"/"running" state looked.
    const ticker = window.setInterval(() => {
      const fraction = Math.min(0.96, (Date.now() - startedAt) / estimatedMs);
      setSurvey({
        survey_id: 'pending',
        status: 'running',
        created_at: new Date().toISOString(),
        completed_at: null,
        progress: Math.round(fraction * total),
        total,
        error: null,
        target_brand: null,
        brand_metrics: null,
        results: null,
        key_findings: null,
      });
    }, 400);

    try {
      const finalSurvey = await runSurvey(params);
      setSurvey(finalSurvey);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'No se pudo conectar con el backend.');
      setSurvey(getLatestSurvey());
    } finally {
      window.clearInterval(ticker);
      setIsAuditRunning(false);
    }
  }, []);

  const brandMetrics = survey?.brand_metrics ?? null;
  const targetMetrics = brandMetrics?.find((m) => m.brand === survey?.target_brand) ?? null;

  return (
    <div
      id="app-root"
      className={`min-h-screen w-full relative flex items-center justify-center transition-colors duration-500 font-sans ${
        isDark ? 'bg-[#040814] text-slate-100' : 'bg-[#e5effd] text-slate-900'
      }`}
    >
      <AmbientBackground theme={theme} />

      <div className="fixed top-3 right-3 z-40 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle light and dark mode"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md transition-all ${
            isDark
              ? 'bg-[#091834]/90 hover:bg-[#0e254e] text-amber-300 border border-blue-500/30'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={() => setIsFramedView(!isFramedView)}
          title={isFramedView ? 'Expand Full Screen' : 'Frame Presentation View'}
          className={`p-2 rounded-full backdrop-blur-md shadow-md transition-all ${
            isDark
              ? 'bg-[#091834]/90 hover:bg-[#0e254e] text-slate-300 border border-blue-500/30'
              : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {isFramedView ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      <main
        className={`relative z-10 w-full transition-all duration-300 ${
          isFramedView ? 'max-w-[1240px] my-4 md:my-8 mx-auto px-2 sm:px-4' : 'max-w-none w-full min-h-screen'
        }`}
      >
        <div
          className={`w-full overflow-hidden transition-all duration-300 flex flex-col md:flex-row ${
            isFramedView
              ? `rounded-[28px] md:rounded-[36px] shadow-2xl min-h-[740px] md:h-[840px] ${
                  isDark ? 'ring-1 ring-[#1b396e]/60 bg-[#07152b]' : 'ring-1 ring-black/5 bg-[#fbfcfe]'
                }`
              : isDark
              ? 'bg-[#07152b] min-h-screen'
              : 'bg-[#fbfcfe] min-h-screen'
          }`}
        >
          <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} theme={theme} onToggleTheme={toggleTheme} />

          <div
            className={`flex-1 p-5 md:p-8 flex flex-col transition-colors duration-300 overflow-hidden ${
              isDark ? 'bg-[#07152b]' : 'bg-[#fbfcfe]'
            }`}
          >
            <Header
              theme={theme}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              survey={survey}
              isAuditRunning={isAuditRunning}
              auditError={auditError}
              onRunAudit={() => runAudit()}
              onOpenReport={() => setIsReportOpen(true)}
            />

            <div className="flex-1 mt-4 overflow-y-auto pr-1 custom-scrollbar">
              {/* mode="wait" would delay mounting the new tab until the old
                  one's exit animation finishes - if the tab is backgrounded
                  mid-transition, requestAnimationFrame throttling can freeze
                  that exit indefinitely and strand the user on stale content.
                  Default (concurrent) mode never blocks on that. */}
              <AnimatePresence>
                {currentTab === 'dashboard' && (
                  <motion.div
                    key="dashboard-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    <BrandRankingList brandMetrics={brandMetrics} theme={theme} searchQuery={searchQuery} />
                    <StatCards targetMetrics={targetMetrics} theme={theme} onOpenReport={() => setIsReportOpen(true)} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">
                      <VisibilityTrendChart theme={theme} refreshKey={survey?.completed_at ?? null} />
                      <BrandComparisonChart brandMetrics={brandMetrics} theme={theme} />
                    </div>
                  </motion.div>
                )}

                {currentTab === 'live' && (
                  <motion.div
                    key="live-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <LiveQueryView
                      theme={theme}
                      searchQuery={searchQuery}
                      survey={survey}
                      isAuditRunning={isAuditRunning}
                      onRunAudit={runAudit}
                    />
                  </motion.div>
                )}

                {currentTab === 'methodology' && (
                  <motion.div
                    key="methodology-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <MethodologyView theme={theme} targetMetrics={targetMetrics} results={survey?.results ?? null} />
                  </motion.div>
                )}

                {currentTab === 'sensitivity' && (
                  <motion.div
                    key="sensitivity-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    <SensitivityView theme={theme} targetMetrics={targetMetrics} results={survey?.results ?? null} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} theme={theme} survey={survey} />
    </div>
  );
}
