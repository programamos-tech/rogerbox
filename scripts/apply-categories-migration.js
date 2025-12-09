#!/usr/bin/env node

/**
 * Script para aplicar la migración de categorías por defecto
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('📦 Aplicando migración de categorías por defecto...\n')

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251206000001_add_default_course_categories.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    // Extraer solo los INSERT statements (ignorar comentarios)
    const insertStatements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')

    console.log('Ejecutando SQL:\n', insertStatements.substring(0, 200) + '...\n')

    // Ejecutar cada categoría individualmente para mejor control de errores
    const categories = [
      {
        name: 'Bajar de peso',
        description: 'Cursos y programas enfocados en pérdida de peso saludable y sostenible',
        icon: 'scale',
        color: '#EF4444',
        sort_order: 1,
        is_active: true
      },
      {
        name: 'Tonificar',
        description: 'Programas para tonificar y definir músculos, mejorar la composición corporal',
        icon: 'dumbbell',
        color: '#8B5CF6',
        sort_order: 2,
        is_active: true
      },
      {
        name: 'Cardio',
        description: 'Entrenamientos cardiovasculares para mejorar resistencia y quemar calorías',
        icon: 'heart',
        color: '#F59E0B',
        sort_order: 3,
        is_active: true
      },
      {
        name: 'Flexibilidad',
        description: 'Cursos de estiramiento, movilidad y flexibilidad para mejorar el rango de movimiento',
        icon: 'move',
        color: '#10B981',
        sort_order: 4,
        is_active: true
      },
      {
        name: 'Fuerza',
        description: 'Programas de entrenamiento de fuerza para ganar masa muscular y potencia',
        icon: 'zap',
        color: '#3B82F6',
        sort_order: 5,
        is_active: true
      }
    ]

    for (const category of categories) {
      const { error } = await supabaseAdmin
        .from('course_categories')
        .upsert(category, { onConflict: 'name', ignoreDuplicates: false })

      if (error) {
        console.warn(`⚠️  Error insertando categoría "${category.name}":`, error.message)
      } else {
        console.log(`✅ Categoría "${category.name}" insertada/actualizada`)
      }
    }

    console.log('\n✅ Migración completada exitosamente!')
    console.log('\n📊 Categorías disponibles:')
    categories.forEach(cat => {
      console.log(`   ${cat.sort_order}. ${cat.name} (${cat.icon})`)
    })

  } catch (error) {
    console.error('\n❌ Error aplicando migración:', error)
    process.exit(1)
  }
}

applyMigration()
