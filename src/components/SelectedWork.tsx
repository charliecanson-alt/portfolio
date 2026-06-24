import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { projects } from '@/data/projects'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Selected work section — responsive grid of three case-study cards.
 * Each card shows project name, one-line result, tool tags, and links to its route.
 * Hover: subtle lift + lime border.
 */
export function SelectedWork() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="work" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-display text-3xl sm:text-4xl font-bold tracking-display text-text mb-12"
        >
          Selected work
        </motion.h2>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={prefersReduced ? {} : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
                delay: prefersReduced ? 0 : i * 0.1,
              }}
            >
              <Link
                to={`/work/${project.slug}`}
                className="group block h-full rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-accent/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5"
              >
                {/* Project title */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display text-xl font-semibold text-text">
                    {project.title}
                  </h3>
                  <ArrowUpRight
                    size={18}
                    className="text-text-muted group-hover:text-accent transition-colors mt-1 shrink-0 ml-3"
                  />
                </div>

                {/* One-line result */}
                <p className="font-body text-sm text-text-muted mb-6 leading-relaxed">
                  {project.result}
                </p>

                {/* Tool tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 text-text-muted border border-border"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
