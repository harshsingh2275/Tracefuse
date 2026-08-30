import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#0a0d14]">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
          Build Bank Hackathon • Track 2
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-mono">
          TraceFuse
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Financial Crime Investigation Cockpit. Don&apos;t just detect suspicious transactions. Reconstruct the hidden story connecting them.
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Launch Cockpit
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg border border-gray-700 transition-colors"
          >
            Investigator Sign In
          </Link>
        </div>

        <div className="mt-12 p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-left font-mono text-xs text-gray-400 space-y-2">
          <div className="text-gray-300 font-semibold">Repository Status: Scaffolding Phase Completed</div>
          <div>• Backend: FastAPI Service configured (port 8000)</div>
          <div>• Analytics: NetworkX, Pandas, Rule-based detector modules configured</div>
          <div>• Frontend: Next.js App Router, Tailwind CSS, TypeScript configured</div>
        </div>
      </div>
    </main>
  );
}
