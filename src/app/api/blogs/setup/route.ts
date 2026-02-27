import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Crear la tabla de blogs si no existe
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up nutritional_blogs table...');

    // Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'nutritional_blogs');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return NextResponse.json(
        { error: 'Error checking database tables', details: tablesError.message },
        { status: 500 }
      );
    }

    if (tables && tables.length > 0) {
      console.log('✅ Table nutritional_blogs already exists');
      return NextResponse.json({ 
        message: 'Table nutritional_blogs already exists',
        exists: true 
      });
    }

    // Crear la tabla usando SQL directo
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS nutritional_blogs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        author VARCHAR(100) NOT NULL,
        reading_time INTEGER NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        featured_image_url TEXT,
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('Error creating table:', createError);
      
      // Intentar con un enfoque diferente
      const { error: directError } = await supabase
        .from('nutritional_blogs')
        .select('id')
        .limit(1);

      if (directError && directError.message.includes('relation "nutritional_blogs" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Table does not exist and cannot be created automatically',
            details: 'Please create the table manually in your Supabase dashboard',
            sql: createTableSQL
          },
          { status: 500 }
        );
      }
    }

    // Crear índices
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_published 
      ON nutritional_blogs(is_published, published_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_nutritional_blogs_slug 
      ON nutritional_blogs(slug);
    `;

    await supabase.rpc('exec_sql', { sql: createIndexSQL });

    console.log('✅ Table nutritional_blogs created successfully');

    return NextResponse.json({ 
      message: 'Table nutritional_blogs created successfully',
      exists: false,
      created: true
    });

  } catch (error) {
    console.error('Error in setup:', error);
    return NextResponse.json(
      { 
        error: 'Error setting up table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Verificar el estado de la tabla
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('nutritional_blogs')
      .select('id, title, created_at')
      .limit(1);

    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message,
        details: 'Table nutritional_blogs does not exist or has issues'
      });
    }

    return NextResponse.json({
      exists: true,
      count: data?.length || 0,
      message: 'Table nutritional_blogs is working correctly'
    });

  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Cannot connect to nutritional_blogs table'
    });
  }
}
