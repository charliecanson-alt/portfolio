/**
 * Footer — minimal single line: name, year, tech credit.
 */
export function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-border">
      <div className="mx-auto max-w-6xl flex items-center justify-center">
        <p className="font-mono text-xs text-text-muted">
          Charlie Canson · {new Date().getFullYear()} · Built with React.
        </p>
      </div>
    </footer>
  )
}
