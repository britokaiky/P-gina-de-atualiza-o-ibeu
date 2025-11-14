'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userSector, setUserSector] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState('');

  useEffect(() => {
    const name = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_name='))
      ?.split('=')[1];
    if (name) {
      const fullName = decodeURIComponent(name);
      // Extrair apenas nome e sobrenome (primeiras duas palavras)
      const nameParts = fullName.trim().split(/\s+/);
      const shortName = nameParts.length > 1 
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` 
        : nameParts[0];
      setUserName(shortName);
    }
    
    // Buscar setor do usuário
    async function fetchUserSector() {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        if (data.success && data.user?.tipo) {
          setUserSector(data.user.tipo);
        }
      } catch (error) {
        console.error('Erro ao buscar setor do usuário:', error);
      }
    }
    
    fetchUserSector();
    
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
        {/* Seletor de páginas - sempre habilitado para visualização */}
        <div className="relative">
          <select
            value={selectedPage}
            onChange={handlePageChange}
            className="appearance-none rounded-xl border border-white/20 bg-white/10 px-4 py-2 pr-10 text-sm font-medium text-white outline-none transition hover:bg-white/15 focus:border-white/40 focus:bg-white/20 focus:ring-2 focus:ring-white/30 cursor-pointer min-w-[140px] [&>option]:bg-slate-800 [&>option]:text-white [&>option]:py-2 [&>option]:px-3"
            title={userSector ? `Você pode editar apenas o setor: ${userSector.toUpperCase()}` : ''}
          >
            <option value="ti">TI</option>
            <option value="financeiro">Financeiro</option>
            <option value="rh">RH</option>
            <option value="comercial">Comercial</option>
            <option value="marketing">Marketing</option>
            <option value="operacoes">Operações</option>
            <option value="administrativo">Administrativo</option>
            <option value="academico">Acadêmico</option>
            <option value="cultural">Cultural</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/80">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

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

