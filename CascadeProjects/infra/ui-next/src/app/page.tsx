export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-historical-950">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg className="w-8 h-8 text-constitutional-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h1 className="text-4xl font-bold text-historical-100">Constitutional Command Center</h1>
        </div>
        <p className="text-historical-400">Constitutional Runtime Kernel · Gateway Interface · Mission Control</p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="/command-center" className="bg-runtime-600 hover:bg-runtime-700 text-white px-6 py-2.5 rounded-lg transition-colors text-sm font-medium shadow-lg shadow-runtime-600/20">
            Open Command Center
          </a>
          <a href="/chat" className="text-historical-400 hover:text-historical-300 text-sm px-6 py-2.5 transition-colors">
            Cockpit View
          </a>
        </div>
        <div className="mt-6 text-xs text-historical-600">
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-learning-400" />
            All systems nominal
          </span>
        </div>
      </div>
    </main>
  )
}
