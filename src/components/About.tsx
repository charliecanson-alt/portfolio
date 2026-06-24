import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * About section — "From advertising to automation"
 * Three paragraphs of verbatim copy. Plain, honest tone.
 */
export function About() {
  const prefersReduced = useReducedMotion()

  const fadeUp = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 20 } as const }

  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-display text-3xl sm:text-4xl font-bold tracking-display text-text mb-10"
        >
          From advertising to automation
        </motion.h2>

        <div className="space-y-6">
          <motion.p
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="font-body text-text-muted leading-relaxed"
          >
            I spent the last few years in digital advertising — building
            campaigns, pulling reports, and doing a lot of the small, repetitive
            tasks that come with the job. Somewhere along the way I realized how
            many of those tasks could be handled by AI, and I got hooked on
            building the tools to do it.
          </motion.p>

          <motion.p
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="font-body text-text-muted leading-relaxed"
          >
            I'm early in this transition, and I'm honest about that. What I bring
            is a real understanding of marketing work and a growing toolkit for
            automating its tedious parts. Each project here is something
            practical I've built to save time or cut down on errors — small wins
            that add up.
          </motion.p>

          <motion.p
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="font-body text-text-muted leading-relaxed"
          >
            I'm enjoying the learning, taking it one automation at a time, and
            looking for chances to put these skills to work on real problems.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
