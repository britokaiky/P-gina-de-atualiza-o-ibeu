
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Roadmap IBEU - Kanban',
  description: 'Board de projetos com Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div className="flex min-h-[calc(100vh-48px)] w-full flex-col px-8 pb-12 pt-10">
          <header className="mb-10 flex flex-col gap-6 text-white md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2 md:max-w-2xl">
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Roadmap de Projetos TI
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-white/85">
                Acompanhe as iniciativas em andamento com um fluxo claro entre
                as etapas do time de TI.
              </p>
            </div>
            <div className="flex items-start justify-end md:justify-center">
              <img
                src="/ibeu-logo.png"
                alt="Logotipo IBEU"
                className="w-24 max-w-[140px] drop-shadow-lg md:w-28"
              />
            </div>
          </header>
          <div className="flex flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
