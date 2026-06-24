import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, Settings, AlertCircle, CheckCircle2, Copy, ShieldAlert, Trash2 } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

/**
 * Interactive tool demo for the Content Repurposer.
 * Takes user inputs and simulates (or actually calls) an LLM to generate platform posts.
 */
export function SpecPage() {
  const { slug } = useParams<{ slug: string }>()
  const prefersReduced = useReducedMotion()

  // Form State
  const [provider, setProvider] = useState<'anthropic' | 'gemini' | 'openai'>('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [coreMessage, setCoreMessage] = useState('')
  const [sourceType, setSourceType] = useState('Blog Post')
  const [brandVoice, setBrandVoice] = useState('Neutral professional')
  const [cta, setCta] = useState('Link in bio')
  const [sourceContent, setSourceContent] = useState('')
  
  // App State
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    linkedin?: string
    instagram?: string
    xSingle?: string
    xThread?: string
    email?: { subject: string; preview: string; body: string; cta: string }
  } | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  // Load saved API key when provider changes
  useEffect(() => {
    const saved = localStorage.getItem(`${provider}_api_key`)
    setApiKey(saved || '')
  }, [provider])

  if (slug !== 'content-repurposer') {
    return <Navigate to="/" replace />
  }

  const fadeUp = prefersReduced ? {} : { initial: { opacity: 0, y: 20 } as const }

  const handleSaveKey = (val: string) => {
    setApiKey(val)
    localStorage.setItem(`${provider}_api_key`, val)
  }

  const handleClearKey = () => {
    setApiKey('')
    localStorage.removeItem(`${provider}_api_key`)
    setError(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const runAutomation = async () => {
    if (!apiKey.trim()) {
      const name = provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Gemini'
      setError(`Please provide your ${name} API key to run this automation.`)
      return
    }

    if (!sourceContent.trim()) {
      setError('Please provide some source content to repurpose.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    // REAL API CALL
    try {
      const prompt = `You are a content repurposing assistant. Take ONE source piece and rewrite it for specific platforms. Your top priority: preserve the CORE MESSAGE in every version. Do not introduce new claims or facts not present in the source.

CORE MESSAGE: ${coreMessage || 'Extract it yourself, state it first, then use it.'}
STRICT FACTUAL RULE: Use ONLY facts, names, places, numbers, dates, and claims that appear in the SOURCE CONTENT. Do not add specifics that are not literally present, even if they sound plausible or you believe them to be true. If a platform format tempts you to add detail, stay general instead of inventing. If you are unsure whether something is in the source, leave it out.

SOURCE TYPE: ${sourceType}
BRAND VOICE: ${brandVoice}
CTA: ${cta}

SOURCE CONTENT:
"""
${sourceContent}
"""

Produce versions ONLY for these platforms: LinkedIn, Instagram, X, Email.
Follow each platform's rules exactly:

TONE CONSTRAINT (All Platforms): Avoid abstract uplift phrases ('beacon of hope,' 'make a difference,' 'fostering community resilience'). Prefer concrete, plain language tied to what the source actually says.

CTA CONSTRAINT (All Platforms): Every version must drive toward the same CTA provided in the input. Adapt only the wording to fit the platform (e.g. 'link in bio' for Instagram, button text for email), never the underlying action.

FIRST LINE RULE (LinkedIn, Instagram, X): Open with a concrete image, a specific detail, or a real number drawn from the source. Do not open with a generic statement of importance (e.g. avoid 'X is a pressing issue,' 'An exciting journey is underway,' 'X deserves our attention').

- LinkedIn: 150–300 words. Strong first-line hook, short paragraphs with line breaks, first-person, soft CTA, 3–5 hashtags at the end. No link in the first line. Angle: the systemic or professional takeaway — why this matters at a community or industry level.
- Instagram: 125–200 words. Punchy hook, scannable, minimal emoji, CTA to "link in bio", 5–10 hashtags grouped at the end. Angle: the human, hopeful, on-the-ground moment — make it personal and visual.
- X: provide BOTH (a) one standalone post ≤280 characters, and (b) a 3–5 tweet thread, one idea per tweet. Direct, no fluff. Angle: one sharp fact or tension, stated plainly. The single post is the hook; the thread adds supporting points.
- Email: subject line (<50 chars), preview text, 80–150 word body, and CTA button text. Angle: a direct, one-to-one note to the reader, leading to a single clear action.

SELF-VERIFICATION: Before returning the output, silently check: does each version keep the core message and meet its length rule? Confirm that every proper noun, place name, number, and statistic in each version appears in the source content. Remove or generalize anything that does not.

Return in this exact JSON format, nothing else (no markdown wrapping, just valid JSON):
{
  "linkedin": "...",
  "instagram": "...",
  "xSingle": "...",
  "xThread": "1/ ...\\n2/ ...",
  "email": {
    "subject": "...",
    "preview": "...",
    "body": "...",
    "cta": "..."
  }
}`

      let textResponse = ''

      if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Anthropic API Error: ${response.status} - ${errText}`)
        }

        const data = await response.json()
        textResponse = data.content[0].text
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: "json_object" },
            messages: [{ role: 'user', content: prompt }]
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`OpenAI API Error: ${response.status} - ${errText}`)
        }

        const data = await response.json()
        textResponse = data.choices[0].message.content
      } else {
        // Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API Error: ${response.status} - ${errText}`)
        }

        const data = await response.json()
        textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
      
      try {
        // Strip markdown code block backticks if the AI included them
        let cleanedText = textResponse.trim()
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.substring(7)
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.substring(3)
        }
        if (cleanedText.endsWith('```')) {
          cleanedText = cleanedText.slice(0, -3)
        }
        cleanedText = cleanedText.trim()

        // Attempt to parse the JSON response
        const parsed = JSON.parse(cleanedText)
        setResults(parsed)
      } catch (e) {
        console.error('Raw AI Response:', textResponse)
        throw new Error('The AI returned a response, but it was not valid JSON. Check the browser console for the raw output.')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong running the automation.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-base px-6 pt-28 pb-24">
      <div className="mx-auto max-w-6xl">
        <motion.div {...fadeUp} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <Link
            to={`/work/${slug}`}
            className="inline-flex items-center gap-2 font-mono text-sm text-text-muted hover:text-accent transition-colors mb-12"
          >
            <ArrowLeft size={14} />
            Back to case study
          </Link>
        </motion.div>

        <motion.div
          {...fadeUp}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-display text-text mb-4">
            Content Repurposer Tool
          </h1>
          <p className="font-body text-text-muted max-w-2xl mb-6">
            This is a functional demo of the automation. Paste your content below to generate platform-specific versions based on my custom prompt rules.
          </p>
          
          {/* Security Explanation Alert */}
          <div className="bg-surface-2 border border-border rounded-xl p-5 max-w-3xl flex gap-4 items-start">
            <ShieldAlert size={20} className="text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-medium text-text mb-1">Why do you need an API key?</h3>
              <p className="font-body text-sm text-text-muted leading-relaxed">
                Because this portfolio is a static frontend website without a backend server, I cannot securely bundle my private API key into the code (it would be exposed to the public). To test this live, you must bring your own key. <strong>Your key is 100% safe:</strong> it is only saved locally in your browser's storage and is sent directly to the AI provider.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT COLUMN: INPUTS */}
          <motion.div
            {...fadeUp}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="space-y-6 bg-surface border border-border rounded-2xl p-6 sm:p-8"
          >
            {/* Settings / API Key */}
            <div className="pb-6 border-b border-border mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 font-display text-sm font-semibold text-text">
                  <Settings size={16} className="text-text-muted" />
                  AI Provider Settings
                </label>
                <div className="flex bg-surface-2 rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setProvider('anthropic')}
                    className={cn(
                      "px-3 py-1 text-xs font-mono rounded-md transition-colors",
                      provider === 'anthropic' ? "bg-surface border border-border text-text shadow-sm" : "text-text-muted hover:text-text"
                    )}
                  >
                    Anthropic
                  </button>
                  <button
                    onClick={() => setProvider('openai')}
                    className={cn(
                      "px-3 py-1 text-xs font-mono rounded-md transition-colors",
                      provider === 'openai' ? "bg-surface border border-border text-text shadow-sm" : "text-text-muted hover:text-text"
                    )}
                  >
                    OpenAI
                  </button>
                  <button
                    onClick={() => setProvider('gemini')}
                    className={cn(
                      "px-3 py-1 text-xs font-mono rounded-md transition-colors",
                      provider === 'gemini' ? "bg-surface border border-border text-text shadow-sm" : "text-text-muted hover:text-text"
                    )}
                  >
                    Gemini
                  </button>
                </div>
              </div>
              
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder={provider === 'anthropic' ? "sk-ant-..." : provider === 'openai' ? "sk-proj-..." : "AIza..."}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
              />
              <div className="flex items-center justify-between gap-3 mt-2">
                <p className="text-xs text-text-muted">
                  Required. Keys are saved locally in your browser.
                </p>
                {apiKey && (
                  <button
                    onClick={handleClearKey}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear key
                  </button>
                )}
              </div>
            </div>

            {/* Automation Parameters */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-text-muted mb-2 uppercase tracking-wider">Source Type</label>
                <input
                  type="text"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  placeholder="e.g. Blog Post"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-text-muted mb-2 uppercase tracking-wider">Brand Voice</label>
                <input
                  type="text"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  placeholder="e.g. Neutral professional"
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs text-text-muted mb-2 uppercase tracking-wider">Core Message (Must survive)</label>
              <input
                type="text"
                value={coreMessage}
                onChange={(e) => setCoreMessage(e.target.value)}
                placeholder="What is the single most important takeaway?"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-text-muted mb-2 uppercase tracking-wider">Call to Action (CTA)</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. Read the full guide at the link in bio"
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-text-muted mb-2 uppercase tracking-wider">Source Content</label>
              <textarea
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                placeholder="Paste your raw content here..."
                rows={8}
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm text-text focus:outline-none focus:border-accent transition-colors resize-y"
              />
            </div>

            <button
              onClick={runAutomation}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2 bg-accent text-base font-display font-semibold text-sm px-7 py-3.5 rounded-lg transition-all duration-200",
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-base/30 border-t-base rounded-full animate-spin" />
              ) : (
                <>
                  <Play size={16} />
                  Run Automation
                </>
              )}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm flex items-start gap-3"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT COLUMN: OUTPUTS */}
          <motion.div
            {...fadeUp}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="flex flex-col h-full"
          >
            {!results && !isLoading && (
              <div className="flex-1 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle2 size={32} className="text-text-muted mb-4 opacity-50" />
                <h3 className="font-display text-lg text-text mb-2">Ready to repurpose</h3>
                <p className="font-body text-sm text-text-muted">
                  Provide your API key and source content, then run the automation.
                </p>
              </div>
            )}

            {isLoading && !results && (
              <div className="flex-1 border border-border bg-surface rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
                <p className="font-mono text-sm text-text-muted animate-pulse">Processing content...</p>
              </div>
            )}

            {results && (
              <div className="space-y-6">
                <OutputCard title="LinkedIn" content={results.linkedin || ''} onCopy={() => copyToClipboard(results.linkedin || '')} />
                <OutputCard title="Instagram" content={results.instagram || ''} onCopy={() => copyToClipboard(results.instagram || '')} />
                <OutputCard title="X (Standalone)" content={results.xSingle || ''} onCopy={() => copyToClipboard(results.xSingle || '')} />
                <OutputCard title="X (Thread)" content={results.xThread || ''} onCopy={() => copyToClipboard(results.xThread || '')} />
                
                {results.email && (
                  <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="bg-surface-2 px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">Email Newsletter</span>
                    </div>
                    <div className="p-5 space-y-4 font-body text-sm text-text whitespace-pre-wrap">
                      <div><span className="text-text-muted">Subject:</span> {results.email.subject}</div>
                      <div><span className="text-text-muted">Preview:</span> {results.email.preview}</div>
                      <div className="pt-2">{results.email.body}</div>
                      <div className="pt-2"><span className="inline-block px-4 py-2 bg-surface-2 border border-border rounded-md text-accent">{results.email.cta}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  )
}

function OutputCard({ title, content, onCopy }: { title: string; content: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden group">
      <div className="bg-surface-2 px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
        <button 
          onClick={handleCopy}
          className="text-text-muted hover:text-accent transition-colors flex items-center gap-1.5"
        >
          {copied ? <CheckCircle2 size={14} className="text-accent" /> : <Copy size={14} />}
          <span className="text-xs font-mono">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-5 font-body text-sm text-text leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  )
}
