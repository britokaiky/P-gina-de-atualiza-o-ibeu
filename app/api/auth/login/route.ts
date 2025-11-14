import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login: loginValue, senha } = body;

    console.log('Login attempt:', { login: loginValue, hasSenha: !!senha });

    if (!loginValue || !senha) {
      return NextResponse.json(
        { success: false, error: 'Login e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await login(loginValue, senha);

    console.log('Login result:', { success: result.success, error: result.error });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

