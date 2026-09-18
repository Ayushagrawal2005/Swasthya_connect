// Quick test to verify .env is loaded
console.log('=== ENV TEST ===')
console.log('VITE_GROQ_API_KEY:', import.meta.env.VITE_GROQ_API_KEY ? 'PRESENT (length: ' + import.meta.env.VITE_GROQ_API_KEY.length + ')' : 'MISSING')
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'MISSING')
console.log('VITE_ML_API_URL:', import.meta.env.VITE_ML_API_URL || 'MISSING')
console.log('All env vars:', import.meta.env)
