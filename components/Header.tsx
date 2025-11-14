'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [selectedPage, setSelectedPage] = useState('');

  useEffect(() => {
    const name = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_name='))
      ?.split('=')[1];
    if (name) {
      setUserName(decodeURIComponent(name));
    }
    
    // Definir página atual baseada no pathname
    if (pathname === '/') {
      setSelectedPage('ti');
    } else {
      setSelectedPage(pathname.replace('/', ''));
    }
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function handlePageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const page = event.target.value;
    setSelectedPage(page);
    if (page === 'ti') {
      router.push('/');
    } else {
      router.push(`/${page}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 mb-6 flex h-16 items-center justify-between border-b border-white/10 bg-white/5 px-6 backdrop-blur-md">
      {/* Logo IBEU - Esquerda */}
      <div className="flex items-center gap-4">
        <img
          src="/ibeu-logo.png"
          alt="Logotipo IBEU"
          className="h-14 w-auto drop-shadow-sm"
        />
      </div>

      {/* Título centralizado */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-xl font-semibold text-white">ROADMAP PROJETOS IBEU</h1>
      </div>

      {/* Navegação e usuário - Direita */}
      <div className="flex items-center gap-4">
        {/* Seletor de páginas */}
        <select
          value={selectedPage}
          onChange={handlePageChange}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none transition hover:bg-white/15 focus:border-white/30 focus:ring-2 focus:ring-white/20"
        >
          <option value="ti" className="bg-slate-800 text-white">
            TI
          </option>
          <option value="financeiro" className="bg-slate-800 text-white">
            Financeiro
          </option>
          <option value="rh" className="bg-slate-800 text-white">
            RH
          </option>
          <option value="comercial" className="bg-slate-800 text-white">
            Comercial
          </option>
          <option value="marketing" className="bg-slate-800 text-white">
            Marketing
          </option>
          <option value="operacoes" className="bg-slate-800 text-white">
            Operações
          </option>
          <option value="administrativo" className="bg-slate-800 text-white">
            Administrativo
          </option>
          <option value="academico" className="bg-slate-800 text-white">
            Acadêmico
          </option>
          <option value="cultural" className="bg-slate-800 text-white">
            Cultural
          </option>
        </select>

        {/* Nome do usuário e logout */}
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm font-medium text-white">
              Olá, <span className="font-semibold text-white">{userName}</span>
            </span>
          )}
          <Button
            size="sm"
            onClick={handleLogout}
            className="h-8 px-4 text-sm font-semibold bg-white text-[var(--accent)] transition hover:bg-white/90 hover:text-[var(--accent)]"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}

