import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Para operações admin, precisamos da service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, login, senha, tipo } = body;

    console.log('Dados recebidos na API:', { nome, email, login, tipo, senhaLength: senha?.length });

    // Validações
    if (!nome || !email || !login || !senha || !tipo) {
      console.log('Campos faltando:', { nome: !!nome, email: !!email, login: !!login, senha: !!senha, tipo: !!tipo });
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email @ibeu.org.br
    if (!email.endsWith('@ibeu.org.br')) {
      console.log('Email inválido recebido:', email);
      return NextResponse.json(
        { success: false, error: 'Apenas emails @ibeu.org.br são permitidos' },
        { status: 400 }
      );
    }

    // Validar senha
    if (senha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se email já existe na tabela usuario_feedz
    const { data: existingEmail } = await supabase
      .from('usuario_feedz')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se login já existe
    const { data: existingLogin } = await supabase
      .from('usuario_feedz')
      .select('id')
      .eq('login', login.trim())
      .maybeSingle();

    if (existingLogin) {
      return NextResponse.json(
        { success: false, error: 'Este login já está em uso' },
        { status: 400 }
      );
    }

    // Criar usuário no Supabase Auth (com validação de email)
    // O signUp do Supabase Auth automaticamente valida o formato do email
    // e envia email de confirmação se configurado no painel
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?email_confirmed=true`,
        data: {
          nome: nome.trim(),
          login: login.trim(),
          tipo: tipo
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      
      // Tratar erros específicos do Supabase
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'Este email já está cadastrado' },
          { status: 400 }
        );
      }
      
      if (authError.message.includes('Invalid email')) {
        return NextResponse.json(
          { success: false, error: 'Email inválido' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: authError.message || 'Erro ao criar conta. Tente novamente.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário. Tente novamente.' },
        { status: 500 }
      );
    }

    // Criar registro na tabela usuario_feedz
    // Nota: A tabela usa int8 como ID, então vamos manter o ID auto-incrementado
    // e armazenar o auth_id do Supabase Auth em uma coluna separada (se necessário)
    const { data: userData, error: dbError } = await supabase
      .from('usuario_feedz')
      .insert({
        nome: nome.trim(),
        email: email.trim(),
        login: login.trim(),
        senha: senha.trim(), // Manter senha na tabela para compatibilidade com login tradicional
        tipo: tipo
      })
      .select('id, nome, email, login, tipo')
      .single();

    if (dbError) {
      console.error('Erro ao criar registro na tabela usuario_feedz:', dbError);
      
      // Se falhar ao criar na tabela, tentar remover o usuário do Auth usando admin
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Erro ao remover usuário do Auth:', deleteError);
      }
      
      return NextResponse.json(
        { success: false, error: 'Erro ao criar conta. Tente novamente.' },
        { status: 500 }
      );
    }

    // Verificar se o email precisa ser confirmado
    // Se não houver session, significa que o email precisa ser confirmado
    const needsEmailConfirmation = !authData.session;

    return NextResponse.json({
      success: true,
      user: userData,
      needsEmailConfirmation,
      message: needsEmailConfirmation 
        ? 'Conta criada com sucesso! Verifique seu email para confirmar sua conta.'
        : 'Conta criada com sucesso!'
    });
  } catch (error) {
    console.error('Cadastro error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
