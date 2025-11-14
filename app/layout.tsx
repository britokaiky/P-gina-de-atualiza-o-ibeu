
import './globals.css'
import type { Metadata } from 'next'
import AuthGuard from '@/components/AuthGuard'

export const metadata: Metadata = {
  title: 'Roadmap IBEU - Kanban',
  description: 'Board de projetos com Supabase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  )
}
