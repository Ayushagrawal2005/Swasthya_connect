/**
 * Image Placeholder Component
 * Generates gradient placeholders until actual images are sourced
 */

interface ImagePlaceholderProps {
  type: 'hero' | 'citizen' | 'health-worker' | 'facility' | 'feature'
  className?: string
  alt?: string
}

export function ImagePlaceholder({ type, className = '', alt = 'Placeholder' }: ImagePlaceholderProps) {
  const gradients = {
    hero: 'from-orange-400 via-orange-500 to-yellow-500',
    citizen: 'from-blue-400 via-indigo-500 to-purple-500',
    'health-worker': 'from-green-400 via-teal-500 to-cyan-500',
    facility: 'from-primary-400 via-primary-500 to-primary-600',
    feature: 'from-gray-200 via-gray-300 to-gray-400'
  }
  
  const icons = {
    hero: (
      <svg className="w-32 h-32 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    citizen: (
      <svg className="w-24 h-24 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    'health-worker': (
      <svg className="w-24 h-24 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    facility: (
      <svg className="w-24 h-24 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    feature: (
      <svg className="w-16 h-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
  
  return (
    <div 
      className={`bg-gradient-to-br ${gradients[type]} flex items-center justify-center ${className}`}
      role="img"
      aria-label={alt}
    >
      {icons[type]}
    </div>
  )
}

export default ImagePlaceholder
