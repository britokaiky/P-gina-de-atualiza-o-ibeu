'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SETORES = [
  { value: 'ti', label: 'TI' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'rh', label: 'RH' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'academico', label: 'Acadêmico' },
  { value: 'cultural', label: 'Cultural' }
];

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [setor, setSetor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    // Validações
    if (!nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!emailPrefix || !emailPrefix.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!login.trim()) {
      setError('Login é obrigatório');
      return;
    }

    if (!senha.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    if (senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (!setor) {
      setError('Selecione um setor');
      return;
    }

    // Garantir que o email está completo
    const emailCompleto = emailPrefix.trim().endsWith('@ibeu.org.br') 
      ? emailPrefix.trim() 
      : `${emailPrefix.trim()}@ibeu.org.br`;

    setLoading(true);

    try {
      const email = emailCompleto;
      
      console.log('Email sendo enviado:', email);
      console.log('Email prefix:', emailPrefix);
      console.log('Email completo:', emailCompleto);
      
      const response = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email,
          login: login.trim(),
          senha: senha.trim(),
          tipo: setor
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.needsEmailConfirmation) {
          setError('');
          // Mostrar mensagem de sucesso com aviso sobre confirmação de email
          router.push(`/login?cadastro=success&email_confirmation=${data.needsEmailConfirmation}`);
        } else {
          router.push('/login?cadastro=success');
        }
      } else {
        setError(data.error || 'Erro ao criar conta');
      }
    } catch (err) {
      console.error('Cadastro error:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/95 p-8 shadow-[0px_28px_60px_-35px_rgba(15,23,42,0.65)] backdrop-blur-xl">
        <div className="mb-8 text-center">
          <img
            src="/ibeu-logo.png"
            alt="Logotipo IBEU"
            className="mx-auto mb-6 w-32 drop-shadow-lg"
          />
          <h1 className="text-2xl font-semibold text-[var(--text)]">Criar Conta</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Preencha os dados para criar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nome" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Nome Completo *
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Email *
            </label>
            <div className="flex items-center rounded-xl border border-white/40 bg-white/90 shadow-inner transition focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]">
              <input
                id="email"
                type="text"
                value={emailPrefix}
                onChange={(e) => {
                  const value = e.target.value.replace(/[@]/g, '');
                  setEmailPrefix(value);
                }}
                required
                className="flex-1 rounded-l-xl bg-transparent px-4 py-3 text-sm text-[var(--text)] outline-none"
                placeholder="seu.usuario"
              />
              <span className="px-3 text-sm text-[var(--muted)]">@ibeu.org.br</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Apenas emails @ibeu.org.br são permitidos
            </p>
          </div>

          <div>
            <label htmlFor="login" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Login *
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
            <label htmlFor="setor" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Setor *
            </label>
            <select
              id="setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              required
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            >
              <option value="">Selecione um setor</option>
              {SETORES.map((s) => (
                <option key={s.value} value={s.value} className="bg-white text-[var(--text)]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Senha *
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="mb-2 block text-sm font-medium text-[var(--text)]">
              Confirmar Senha *
            </label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              className="w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-sm text-[var(--text)] shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Digite a senha novamente"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--muted)]">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

