export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">feedback-widget API</h1>
        <p className="text-zinc-400 text-sm">
          Esta é a API do <code className="text-zinc-200">@feedback-widget</code> — não é uma página pra visitar
          diretamente. Endpoints: <code className="text-zinc-200">/api/health</code>,{" "}
          <code className="text-zinc-200">/api/config</code>, <code className="text-zinc-200">/api/feedback</code>.
        </p>
      </div>
    </main>
  );
}
