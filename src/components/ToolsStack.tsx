import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Tools & stack section — a simple row of mono-styled labels.
 * Owner can edit this list.
 */

const tools = [
  'Claude',
  'Python',
  'Google Sheets / Apps Script',
  'Make',
  'Zapier',
  'Airtable',
]

export function ToolsStack() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="px-6 py-16" aria-label="Tools and stack">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {tools.map((tool) => (
            <span
              key={tool}
              className="font-mono text-sm px-4 py-2 rounded-lg bg-surface-2 text-text-muted border border-border"
            >
              {tool}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
