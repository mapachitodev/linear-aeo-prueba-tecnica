import type { ComponentType } from 'react';
import { FileText, Bookmark, Star, Grid2X2, Moon, Sun } from 'lucide-react';
import { NavTab, ThemeMode } from '../types';
import { LinearMarkIllustration } from './LinearMarkIllustration';
import { SearchBrandMark } from './SearchBrandMark';
import { motion } from 'motion/react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Panel', icon: Grid2X2 },
  { id: 'live', label: 'Consulta en vivo', icon: FileText },
  { id: 'methodology', label: 'Metodología', icon: Bookmark },
  { id: 'sensitivity', label: 'Visibilidad', icon: Star },
];

export function Sidebar({ currentTab, onSelectTab, theme, onToggleTheme }: SidebarProps) {
  const isDark = theme === 'dark';

  return (
    <aside
      className={`relative w-full md:w-60 lg:w-64 flex flex-col md:justify-between p-4 md:p-6 transition-colors duration-300 select-none z-20 ${
        isDark
          ? 'bg-[#060b18] text-slate-200 border-b md:border-b-0 md:border-r border-[#15233e]'
          : 'bg-[#183a8b] text-white border-b md:border-b-0 md:border-r border-blue-900/40'
      }`}
    >
      <div className="space-y-4 md:space-y-6">
        <div className="px-1 md:px-2 pt-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <SearchBrandMark className="w-full h-full" />
              </div>
              <span className="text-lg font-bold tracking-[0.18em] text-white font-sans uppercase">
                SearchBrand
              </span>
            </div>
            <p className="hidden md:block text-[11px] font-medium text-blue-200/70 tracking-wider pl-11 -mt-1">
              AEO · Linear
            </p>
          </div>

          {/* Compact theme toggle shown only on mobile, where the full switch at the bottom is hidden to save vertical space */}
          <button
            type="button"
            aria-label="Toggle light and dark mode"
            onClick={onToggleTheme}
            className="md:hidden p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
          </button>
        </div>

        <nav
          className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`shrink-0 md:w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 text-left relative group ${
                  isActive
                    ? isDark
                      ? 'border border-[#264478] bg-[#0c1833] text-white shadow-sm'
                      : 'border border-blue-400/50 bg-[#254ea8] text-white shadow-inner'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    : 'text-blue-200/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-blue-200'
                  }`}
                />
                <span className="tracking-wide whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden md:block my-auto py-2">
        <LinearMarkIllustration theme={theme} />
      </div>

      <div className="hidden md:flex pt-2 border-t border-white/10 items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={onToggleTheme}
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-orange-500' : 'bg-orange-400'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
                isDark ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span
            onClick={onToggleTheme}
            className="text-[11px] cursor-pointer font-medium tracking-wide text-slate-300 hover:text-white select-none"
          >
            {isDark ? 'Switch to light' : 'Switch to dark'}
          </span>
        </div>
      </div>
    </aside>
  );
}
