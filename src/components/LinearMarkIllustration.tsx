import { motion } from 'motion/react';
import { LinearMark } from './BrandLogo';

interface LinearMarkIllustrationProps {
  theme: 'light' | 'dark';
}

// Sidebar centerpiece: a large glowing rendition of Linear's mark - the brand
// this whole tool audits - replacing the generic rocket mascot inherited from
// the original template.
export function LinearMarkIllustration({ theme }: LinearMarkIllustrationProps) {
  return (
    <div className="relative w-full flex items-center justify-center py-3 select-none">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute top-2 right-4 text-xs text-yellow-300 font-bold"
        >
          ✦
        </motion.div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-4 left-3 text-xs text-sky-200"
        >
          ✦
        </motion.div>
        <motion.div
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 1 }}
          className="absolute top-8 left-2 text-[10px] text-indigo-300"
        >
          ✧
        </motion.div>

        {/* Pulsing glow ring behind the mark */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute w-24 h-24 rounded-full"
          style={{
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0) 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)',
          }}
        />

        <div
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
          }}
        >
          <LinearMark className="w-10 h-10 text-white" />
        </div>
      </div>
    </div>
  );
}
