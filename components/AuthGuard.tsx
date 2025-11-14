'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from './Header';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          // Se estiver autenticado e na página de login ou cadastro, redireciona
          if (pathname === '/login' || pathname === '/cadastro') {
            router.push('/');
          }
        } else {
          // Se não estiver autenticado e não estiver em páginas públicas, redireciona
          if (pathname !== '/login' && pathname !== '/cadastro') {
            router.push('/login');
          }
        }
      } catch (error) {
        if (pathname !== '/login' && pathname !== '/cadastro') {
          router.push('/login');
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Páginas públicas não precisam do layout padrão
  if (pathname === '/login' || pathname === '/cadastro') {
    return <>{children}</>;
  }

  // Outras páginas precisam estar autenticadas
  if (!isAuthenticated) {
    return null;
  }

  // Layout padrão para páginas autenticadas
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1 px-8 pb-12 pt-6">
        {children}
      </div>
    </div>
  );
}

