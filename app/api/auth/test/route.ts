import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Testar conexão e listar usuários (sem senha)
    const { data, error } = await supabase
      .from('usuario_feedz')
      .select('id, nome, login, email, tipo, created_at')
      .limit(10);

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      users: data || []
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

