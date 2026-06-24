import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Work', id: 'work' },
  { label: 'Method', id: 'method' },
  { label: 'About', id: 'about' },
  { label: 'Contact', id: 'contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const prefersReduced = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /** Navigate to a section — handles being on sub-pages */
  const scrollTo = (id: string) => {
    setMobileOpen(false)
    if (location.pathname !== '/') {
      navigate('/#' + id)
      return
    }
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  return (
    <motion.header
      initial={prefersReduced ? {} : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        scrolled
          ? 'bg-base/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      )}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo / Name */}
        <button
          onClick={() => scrollTo('hero')}
          className="font-display text-lg font-semibold tracking-display text-text hover:text-accent transition-colors"
        >
          Charlie Canson
        </button>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => scrollTo(link.id)}
                className="font-body text-sm text-text-muted hover:text-accent transition-colors"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile menu (Sheet via Radix Dialog) */}
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <button
              className="md:hidden p-2 text-text-muted hover:text-text transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content
              className="fixed right-0 top-0 z-50 h-full w-72 bg-surface border-l border-border p-6 shadow-xl"
              aria-describedby={undefined}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>Navigation menu</Dialog.Title>
              </VisuallyHidden.Root>

              <div className="flex justify-end mb-8">
                <Dialog.Close asChild>
                  <button
                    className="p-2 text-text-muted hover:text-text transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={22} />
                  </button>
                </Dialog.Close>
              </div>

              <ul className="flex flex-col gap-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => scrollTo(link.id)}
                      className="font-display text-xl text-text hover:text-accent transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </nav>
    </motion.header>
  )
}
