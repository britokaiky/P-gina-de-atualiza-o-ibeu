'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function login(loginValue: string, senha: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Limpar espaços e normalizar
  const loginTrimmed = loginValue.trim();
  const senhaTrimmed = senha.trim();
  
  console.log('Tentando login com:', { login: loginTrimmed, senhaLength: senhaTrimmed.length });
  
  // Primeiro, vamos buscar todos os usuários para debug
  const { data: allUsers, error: allError } = await supabase
    .from('usuario_feedz')
    .select('id, nome, login, email, tipo');
  
  console.log('Todos os usuários:', allUsers);
  console.log('Erro ao buscar todos:', allError);
  
  // Buscar usuário apenas por login primeiro (case-insensitive)
  // Tentar primeiro com case-sensitive
  let { data: userData, error: userError } = await supabase
    .from('usuario_feedz')
    .select('id, nome, login, senha, email, tipo')
    .eq('login', loginTrimmed)
    .maybeSingle();
  
  // Se não encontrou, tentar buscar todos e filtrar manualmente (para debug)
  if (!userData && !userError) {
    console.log('Não encontrou com eq, tentando buscar todos...');
    const { data: allData, error: allErr } = await supabase
      .from('usuario_feedz')
      .select('id, nome, login, senha, email, tipo');
    
    console.log('Todos os registros:', allData);
    console.log('Erro ao buscar todos:', allErr);
    
    if (allData) {
      // Buscar manualmente (case-insensitive)
      userData = allData.find(u => 
        u.login?.toLowerCase().trim() === loginTrimmed.toLowerCase().trim()
      ) || null;
      console.log('Usuário encontrado manualmente:', userData);
    }
  }

  console.log('Query por login - data:', userData);
  console.log('Query por login - error:', userError);
  console.log('Login procurado:', `"${loginTrimmed}"`);
  console.log('Senha procurada:', `"${senhaTrimmed}"`);

  if (userError) {
    console.error('Supabase error:', userError);
    return { success: false, error: `Erro ao consultar banco de dados: ${userError.message}` };
  }

  if (!userData) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  console.log('Senha no banco:', `"${userData.senha}"`);
  console.log('Senhas são iguais?', userData.senha === senhaTrimmed);
  console.log('Tamanho senha banco:', userData.senha?.length);
  console.log('Tamanho senha input:', senhaTrimmed.length);

  // Comparar senha manualmente (case-sensitive)
  if (userData.senha !== senhaTrimmed) {
    return { success: false, error: 'Senha incorreta' };
  }

  // Remover senha do objeto antes de retornar
  const { senha: _, ...user } = userData;
  console.log('Usuário autenticado:', user);

  // Criar sessão simples usando cookies
  const cookieStore = await cookies();
  cookieStore.set('user_id', user.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/'
  });
  cookieStore.set('user_name', user.nome || '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  return { success: true, user };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('user_id');
  cookieStore.delete('user_name');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from('usuario_feedz')
    .select('id, nome, login, email, tipo')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  return !!userId;
}

