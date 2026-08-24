import { Sparkles } from 'lucide-react'

interface AIPillProps {
  className?: string
}

export function AIPill({ className = '' }: AIPillProps) {
  return (
    <span
      className={`ai-pill ${className}`}
      role="note"
      aria-label="AI-assisted suggestion — confirm with a healthcare worker"
    >
      <Sparkles size={10} aria-hidden="true" />
      AI-assisted — confirm with a healthcare worker
    </span>
  )
}
