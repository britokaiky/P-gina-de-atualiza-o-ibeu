'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export async function login(loginValue: string, senha: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Limpar espaços e normalizar
  const loginTrimmed = loginValue.trim();
  const senhaTrimmed = senha.trim();
  
  console.log('Tentando login com:', { login: loginTrimmed, senhaLength: senhaTrimmed.length });
  
  // Buscar usuário na tabela usuario_feedz
  let { data: userData, error: userError } = await supabase
    .from('usuario_feedz')
    .select('id, nome, login, senha, email, tipo')
    .eq('login', loginTrimmed)
    .maybeSingle();
  
  // Se não encontrou, tentar buscar todos e filtrar manualmente (case-insensitive)
  if (!userData && !userError) {
    const { data: allData } = await supabase
      .from('usuario_feedz')
      .select('id, nome, login, senha, email, tipo');
    
    if (allData) {
      userData = allData.find(u => 
        u.login?.toLowerCase().trim() === loginTrimmed.toLowerCase().trim()
      ) || null;
    }
  }

  if (userError) {
    console.error('Supabase error:', userError);
    return { success: false, error: `Erro ao consultar banco de dados: ${userError.message}` };
  }

  if (!userData) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  // Verificar senha
  if (userData.senha !== senhaTrimmed) {
    return { success: false, error: 'Senha incorreta' };
  }

  // Verificar se o email foi confirmado no Supabase Auth
  // Usar signInWithPassword que valida automaticamente se o email foi confirmado
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: senhaTrimmed
    });
    
    if (signInError) {
      // Verificar se o erro é de email não confirmado
      const errorMessage = signInError.message.toLowerCase();
      if (errorMessage.includes('email not confirmed') || 
          errorMessage.includes('email_not_confirmed') ||
          errorMessage.includes('email not verified') ||
          errorMessage.includes('email_not_verified')) {
        return { 
          success: false, 
          error: 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.' 
        };
      }
      
      // Se for erro de credenciais inválidas, mas já validamos a senha na tabela
      // pode ser que o usuário não exista no Auth (usuário antigo)
      if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
        // Tentar verificar usando Admin API se disponível
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(u => u.email === userData.email);
          
          if (authUser) {
            // Usuário existe no Auth mas credenciais não funcionaram
            // Verificar se email foi confirmado
            if (!authUser.email_confirmed_at) {
              return { 
                success: false, 
                error: 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.' 
              };
            }
            // Se email está confirmado mas signIn falhou, pode ser problema de senha no Auth
            // Mas já validamos na tabela, então permitir login
          } else {
            // Usuário não existe no Auth - pode ser usuário antigo
            // Para novos cadastros, isso não deve acontecer
            console.log('Usuário não encontrado no Supabase Auth');
            // Bloquear para novos usuários, mas você pode permitir para compatibilidade
            return { 
              success: false, 
              error: 'Conta não encontrada no sistema de autenticação. Por favor, faça o cadastro novamente.' 
            };
          }
        } catch (adminError) {
          console.error('Erro ao verificar com Admin API:', adminError);
          // Se não conseguir verificar, bloquear por segurança
          return { 
            success: false, 
            error: 'Erro ao verificar status da conta. Tente novamente.' 
          };
        }
      } else {
        // Outros erros
        console.error('Erro ao verificar com signIn:', signInError);
        return { 
          success: false, 
          error: 'Erro ao verificar autenticação. Tente novamente.' 
        };
      }
    } else if (!signInData.session) {
      // Se não retornou sessão, o email provavelmente não está confirmado
      return { 
        success: false, 
        error: 'Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.' 
      };
    }
    
    // Se chegou aqui, o signIn foi bem-sucedido e o email está confirmado
    // Fazer logout do Supabase Auth para não interferir com nosso sistema de cookies
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Erro ao verificar confirmação de email:', error);
    // Em caso de erro, bloquear por segurança
    return { success: false, error: 'Erro ao verificar status da conta. Tente novamente.' };
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

