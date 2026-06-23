export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CRX UI</h1>
        <p className="text-gray-600">Constitutional Replay Kernel Interface</p>
        <div className="mt-8">
          <a href="/chat" className="bg-blue-500 text-white px-6 py-2 rounded">
            Go to Chat
          </a>
        </div>
      </div>
    </main>
  )
}
