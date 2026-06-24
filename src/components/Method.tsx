import { motion } from 'framer-motion'
import { Search, Wrench, TrendingUp } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Method section — "Spot → Build → Save"
 * This is the page's signature visual element.
 * Animated three-step flow that reveals on scroll with lime accent.
 */

const steps = [
  {
    icon: Search,
    title: 'Spot',
    description:
      'I look for one repetitive task that\'s eating time or causing errors.',
  },
  {
    icon: Wrench,
    title: 'Build',
    description:
      'I build a small, focused AI automation to handle it, using tools like Claude.',
  },
  {
    icon: TrendingUp,
    title: 'Save',
    description:
      'We measure what\'s saved — hours, clicks, mistakes — and decide what to automate next.',
  },
]

export function Method() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="method" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-display text-3xl sm:text-4xl font-bold tracking-display text-text mb-16 text-center"
        >
          My approach:{' '}
          <span className="text-accent">Spot</span>
          <span className="text-text-muted mx-2">→</span>
          <span className="text-accent">Build</span>
          <span className="text-text-muted mx-2">→</span>
          <span className="text-accent">Save</span>
        </motion.h2>

        {/* Three-step flow */}
        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-border"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={
                prefersReduced
                  ? {}
                  : { opacity: 0, y: 32, scale: 0.95 }
              }
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: prefersReduced ? 0 : i * 0.2,
              }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number + icon circle */}
              <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full border-2 border-accent/30 bg-surface mb-6 group">
                {/* Glow ring on the signature element */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(182,255,60,0.08) 0%, transparent 70%)',
                  }}
                  aria-hidden="true"
                />
                <step.icon size={28} className="text-accent relative z-10" />
              </div>

              {/* Step label */}
              <div className="font-mono text-xs text-accent/70 uppercase tracking-widest mb-2">
                Step {i + 1}
              </div>

              {/* Step title */}
              <h3 className="font-display text-2xl font-semibold text-text mb-3">
                {step.title}
              </h3>

              {/* Step description */}
              <p className="font-body text-sm text-text-muted leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
