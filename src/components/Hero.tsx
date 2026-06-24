import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Hero section — text-forward with headline, subline, and two CTAs.
 * Includes a very subtle lime radial glow behind the content.
 */
export function Hero() {
  const prefersReduced = useReducedMotion()

  const fadeUp = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
      }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
    >
      {/* Subtle lime radial glow — kept faint */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(182,255,60,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Headline */}
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-display text-text leading-[1.1] mb-6"
        >
          I build simple automations that save marketing teams time.
        </motion.h1>

        {/* Subline */}
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className="font-body text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Coming from digital advertising, I know which manual tasks slow
          campaigns down — and I use AI tools to quietly take them off your
          plate.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA — lime fill, dark text */}
          <button
            onClick={() => scrollTo('work')}
            className="group inline-flex items-center gap-2 bg-accent text-base font-display font-semibold text-sm px-7 py-3 rounded-lg hover:brightness-110 transition-all duration-200"
          >
            See my work
            <ArrowDown
              size={16}
              className="transition-transform group-hover:translate-y-0.5"
            />
          </button>

          {/* Secondary CTA — lime underline text link */}
          <button
            onClick={() => scrollTo('contact')}
            className="text-accent font-body text-sm underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-colors"
          >
            Get in touch
          </button>
        </motion.div>
      </div>
    </section>
  )
}
