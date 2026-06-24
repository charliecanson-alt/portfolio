import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { projects } from '@/data/projects'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useEffect } from 'react'

/**
 * Renders a prose string as one or more paragraphs, splitting on blank lines
 * (\n\n) so multi-paragraph case-study copy keeps its structure.
 */
function Prose({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="font-body text-text-muted leading-relaxed">
          {para}
        </p>
      ))}
    </>
  )
}

/**
 * Case study page — one per project, accessed via /work/:slug.
 * Displays: title, result, problem, what I built, media slot,
 * the result, tools used, and what I learned.
 */
export function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = projects.find((p) => p.slug === slug)
  const prefersReduced = useReducedMotion()

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!project) {
    return <Navigate to="/" replace />
  }

  const fadeUp = prefersReduced
    ? {}
    : { initial: { opacity: 0, y: 20 } as const }

  return (
    <main className="min-h-screen bg-base px-6 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <motion.div
          {...fadeUp}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 font-mono text-sm text-text-muted hover:text-accent transition-colors mb-12"
          >
            <ArrowLeft size={14} />
            Back to work
          </Link>
        </motion.div>

        {/* Title */}
        <motion.h1
          {...fadeUp}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-display text-text mb-4"
        >
          {project.title}
        </motion.h1>

        {/* One-line result */}
        <motion.p
          {...fadeUp}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="font-body text-lg text-accent mb-12"
        >
          {project.result}
        </motion.p>

        {/* Sections */}
        <div className="space-y-12">
          {/* The problem */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              The problem
            </h2>
            <div className="space-y-4">
              <Prose text={project.problem} />
            </div>
          </motion.section>

          {/* What I built */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              What I built
            </h2>
            <div className="space-y-4">
              <Prose text={project.whatIBuilt} />
              {slug === 'content-repurposer' && (
                <Link
                  to={`/work/${slug}/spec`}
                  className="inline-flex items-center gap-2 font-mono text-sm text-accent hover:underline underline-offset-4"
                >
                  Try the live tool demo →
                </Link>
              )}
            </div>
          </motion.section>

          {/* See it in action — media placeholder */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              See it in action
            </h2>
            {project.mediaVideo ? (
              <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
                <video
                  src={project.mediaVideo}
                  className="w-full h-auto block"
                  controls
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : project.mediaImage ? (
              <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
                <img
                  src={project.mediaImage}
                  alt={project.mediaAlt ?? project.title}
                  className="w-full h-auto block"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-2 p-8 flex items-center justify-center min-h-[200px]">
                <p className="font-mono text-sm text-text-muted text-center">
                  {project.mediaPlaceholder}
                </p>
              </div>
            )}
          </motion.section>

          {/* The result */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              The result
            </h2>
            <div className="space-y-4">
              <Prose text={project.theResult} />
            </div>
          </motion.section>

          {/* Tools used */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              Tools used
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span
                  key={tool}
                  className="font-mono text-sm px-3 py-1.5 rounded-md bg-surface-2 text-text-muted border border-border"
                >
                  {tool}
                </span>
              ))}
            </div>
          </motion.section>

          {/* What I learned */}
          <motion.section
            {...fadeUp}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="font-display text-xl font-semibold text-text mb-4">
              What I learned
            </h2>
            <div className="space-y-4">
              <Prose text={project.whatILearned} />
            </div>
          </motion.section>
        </div>

        {/* Bottom back link */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link
            to="/#work"
            className="inline-flex items-center gap-2 font-mono text-sm text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft size={14} />
            Back to all work
          </Link>
        </div>
      </div>
    </main>
  )
}
