import { motion } from 'framer-motion'
import { Mail, Linkedin, Github } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Contact section — heading, short line, and placeholder links.
 * No backend; mailto: and external links only.
 */

const links = [
  {
    icon: Mail,
    label: 'Email',
    href: 'mailto:charliecanson@gmail.com',
    display: 'charliecanson@gmail.com',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/charliecanson/',
    display: 'LinkedIn',
  },
  {
    icon: Github,
    label: 'GitHub',
    href: 'https://github.com/charliecanson-alt',
    display: 'GitHub',
  },
]

export function Contact() {
  const prefersReduced = useReducedMotion()

  return (
    <section id="contact" className="px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-display text-3xl sm:text-4xl font-bold tracking-display text-text mb-4"
        >
          Get in touch
        </motion.h2>

        <motion.p
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="font-body text-text-muted mb-10"
        >
          Open to projects and conversations about practical automation.
        </motion.p>

        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-lg border border-border bg-surface text-text hover:border-accent/50 hover:text-accent transition-all duration-200 font-body text-sm"
            >
              <link.icon size={16} className="text-text-muted group-hover:text-accent transition-colors" />
              {link.display}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
