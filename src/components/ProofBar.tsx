import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Proof bar — three small stat items in mono font with lime-accented numbers.
 * Sits directly below the hero. Quiet, confident, not boastful.
 */

const stats = [
  { value: '15', label: 'automations built' },
  { value: '55', label: 'hrs/month saved' },
  { value: '4', label: 'yrs in digital advertising' },
]

export function ProofBar() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="px-6 pb-20" aria-label="Key stats">
      <motion.div
        initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
        className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-medium text-accent">
              {stat.value}
            </span>
            <span className="font-mono text-sm text-text-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
