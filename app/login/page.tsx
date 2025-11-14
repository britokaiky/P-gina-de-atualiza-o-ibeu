'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cadastro = searchParams.get('cadastro');
    const emailConfirmation = searchParams.get('email_confirmation');
    
    if (cadastro === 'success') {
      if (emailConfirmation === 'true') {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar sua conta antes de fazer login.');
      } else {
        setSuccess('Conta criada com sucesso! Faça login para continuar.');
      }
    }
    
    const emailConfirmed = searchParams.get('email_confirmed');
    if (emailConfirmed === 'true') {
      setSuccess('Email confirmado com sucesso! Faça login para continuar.');
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), senha: senha.trim() })
      });

      const data = await response.json();

      console.log('Login response:', data);

      if (data.success) {
        // Aguardar um pouco para garantir que o cookie foi setado
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erro ao conectar com o servidor. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/95 p-8 shadow-[0px_28px_60px_-35px_rgba(15,23,42,0.65)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <img
            src="/ibeu-logo.png"
            alt="Logotipo IBEU"
            className="mx-auto mb-6 w-32 drop-shadow-lg"
          />
          <h1 className="text-2xl font-semibold text-[var(--text)]">Acesso ao Sistema</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Entre com suas credenciais para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Login
            </label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Digite seu login"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Digite sua senha"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="font-medium text-[var(--accent)] hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

