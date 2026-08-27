import { ThemeMode } from '../types';

interface AmbientBackgroundProps {
  theme: ThemeMode;
}

export function AmbientBackground({ theme }: AmbientBackgroundProps) {
  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Dynamic atmospheric radial gradients */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark
            ? 'bg-gradient-to-br from-[#040814] via-[#07132a] to-[#030917]'
            : 'bg-gradient-to-br from-[#eff6ff] via-[#e8effd] to-[#f1f5f9]'
        }`}
      />

      {/* Floating 3D Bubble Spheres matching screenshot art */}
      {/* Top Left Sphere */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #2563eb 0%, #1e3a8a 50%, #0f172a 100%)'
            : 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #60a5fa 40%, #3b82f6 100%)',
          boxShadow: isDark
            ? 'inset -5px -5px 15px rgba(0,0,0,0.6), 0 10px 30px rgba(37,99,235,0.2)'
            : 'inset -8px -8px 20px rgba(30,58,138,0.2), 0 15px 35px rgba(59,130,246,0.25)',
        }}
        className="absolute -top-10 -left-10 w-44 h-44 rounded-full opacity-70 blur-[1px] animate-pulse"
      />

      {/* Top Right Bubble (Indigo / Violet) */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #6366f1 0%, #4338ca 50%, #1e1b4b 100%)'
            : 'radial-gradient(circle at 35% 35%, #c7d2fe 0%, #818cf8 45%, #6366f1 100%)',
          boxShadow: isDark
            ? 'inset -5px -5px 15px rgba(0,0,0,0.6), 0 10px 30px rgba(99,102,241,0.2)'
            : 'inset -8px -8px 20px rgba(67,56,202,0.2), 0 15px 35px rgba(99,102,241,0.25)',
        }}
        className="absolute top-12 right-6 w-32 h-32 rounded-full opacity-65 blur-[1px]"
      />

      {/* Center Left Bubble (Light Blue / Teal) */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0284c7 50%, #082f49 100%)'
            : 'radial-gradient(circle at 35% 35%, #bae6fd 0%, #38bdf8 50%, #0284c7 100%)',
        }}
        className="absolute top-1/3 left-4 w-24 h-24 rounded-full opacity-50 blur-[2px]"
      />

      {/* Center Right Indigo Bubble */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #4f46e5 0%, #3730a3 50%, #1e1b4b 100%)'
            : 'radial-gradient(circle at 35% 35%, #e0e7ff 0%, #a5b4fc 45%, #6366f1 100%)',
        }}
        className="absolute top-1/2 right-12 w-36 h-36 rounded-full opacity-60 blur-[1px]"
      />

      {/* Bottom Left Sphere (Cyan) */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #0ea5e9 0%, #0369a1 60%, #082f49 100%)'
            : 'radial-gradient(circle at 35% 35%, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%)',
        }}
        className="absolute -bottom-10 left-16 w-48 h-48 rounded-full opacity-65 blur-[1px]"
      />

      {/* Bottom Right Floating Orb (Deep Indigo) */}
      <div
        style={{
          background: isDark
            ? 'radial-gradient(circle at 35% 35%, #6366f1 0%, #3730a3 60%, #1e1b4b 100%)'
            : 'radial-gradient(circle at 35% 35%, #e0e7ff 0%, #818cf8 50%, #4f46e5 100%)',
        }}
        className="absolute bottom-6 right-20 w-36 h-36 rounded-full opacity-60 blur-[1px]"
      />
    </div>
  );
}
