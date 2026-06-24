import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ProofBar } from '@/components/ProofBar'
import { SelectedWork } from '@/components/SelectedWork'
import { Method } from '@/components/Method'
import { About } from '@/components/About'
import { ToolsStack } from '@/components/ToolsStack'
import { Contact } from '@/components/Contact'
import { Footer } from '@/components/Footer'
import { CaseStudyPage } from '@/pages/CaseStudyPage'
import { SpecPage } from '@/pages/SpecPage'

/**
 * Home page — single-page scroll layout with all sections.
 */
function HomePage() {
  const location = useLocation()

  // Handle hash-based navigation (e.g., returning from a case study page)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      // Small delay to let the DOM render before scrolling
      setTimeout(() => {
        const el = document.getElementById(id)
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location.hash])

  return (
    <main>
      <Hero />
      <ProofBar />
      <SelectedWork />
      <Method />
      <About />
      <ToolsStack />
      <Contact />
    </main>
  )
}

/**
 * App root — sets up routing with BrowserRouter.
 * Home page is a single-page scroll layout; case studies are routed pages.
 */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base text-text">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/work/:slug" element={<CaseStudyPage />} />
          <Route path="/work/:slug/spec" element={<SpecPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
