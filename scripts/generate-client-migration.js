/**
 * Script de Migración: Clientes y Membresías BigBoss → RogerBox
 * 
 * Genera SQL para importar todos los clientes y su historial de membresías.
 * 
 * Uso: node scripts/generate-client-migration.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_FILE = path.join(__dirname, '..', 'fileRpt_Vencimientos_2026_01_30_17_26_44.xls');
const OUTPUT_SQL = path.join(__dirname, 'migration-clients.sql');

// Mapeo de productos BigBoss → nombres de planes en RogerBox (EXACTOS de la DB)
const PLAN_MAPPING = {
  'cupo ROGERBOX cupo ROGERBOX': 'cupo ROGERBOX',
  'cupo ROGERBOX virtual cupo ROGERBOX virtual': 'cupo ROGERBOX virtual',
  'ASESORIA VIP ASESORIA DE COACHING': 'ASESORIA VIP - COACHING',
  'BOX 15 DIAS BOX 15 DIAS': 'BOX 15 DIAS',
  'LINIMENTO LINIMENTO': 'LINIMENTO',
  'ASESORIA PLATA ASESORIA PLATA': 'ASESORIA PLATA',
  'BANDA BOX BANDA BOX': 'BANDA BOX',
};

// Función para limpiar texto HTML
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Función para parsear precio
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[$.]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) || 0);
}

// Función para parsear fecha
function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = cleanText(dateStr);
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleaned)) {
    return cleaned.replace(/\//g, '-');
  }
  return null;
}

// Escapar texto para SQL
function escapeSql(text) {
  if (!text) return '';
  return text.replace(/'/g, "''").trim();
}

// Función principal para parsear el archivo HTML
function parseHtmlFile(filePath) {
  console.log('📂 Leyendo archivo:', filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const rowRegex = /<tr>\s*<td[^>]*>(?:(?!<\/tr>).)*<\/tr>/gs;
  const rows = content.match(rowRegex) || [];
  
  console.log(`📊 Total de filas encontradas: ${rows.length}`);
  
  const records = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells = [];
    let match;
    
    while ((match = cellRegex.exec(row)) !== null) {
      let cellContent = match[1];
      const linkMatch = cellContent.match(/<a[^>]*>([^<]*)<\/a>/);
      if (linkMatch) {
        cellContent = linkMatch[1];
      }
      cells.push(cleanText(cellContent));
    }
    
    if (cells.length < 15 || cells[0] === 'SEDE' || cells[1] === 'AFILIADO') {
      continue;
    }
    
    if (!cells[0] || cells[0].includes('BigBoss')) {
      continue;
    }
    
    const record = {
      sede: cells[0] || 'ROGERBOX',
      nombre: cells[1] || '',
      documento: cells[2] || '',
      fechaFactura: parseDate(cells[3]),
      fechaInicio: parseDate(cells[4]),
      fechaFin: parseDate(cells[5]),
      producto: cells[6] || '',
      valorPagado: parsePrice(cells[7]),
      diasRestantes: parseInt(cells[8]) || 0,
      tipo: cells[9] || 'AFILIACION',
      fechaNacimiento: parseDate(cells[12]),
      celular: cells[15] || cells[14] || '',
      email: cells[16] || '',
      direccion: cells[17] || '',
    };
    
    if (record.documento && record.nombre && /^\d+$/.test(record.documento)) {
      records.push(record);
    }
  }
  
  console.log(`✅ Registros válidos parseados: ${records.length}`);
  return records;
}

// Agrupar por cliente único
function groupByClient(records) {
  const clients = new Map();
  
  for (const record of records) {
    const key = record.documento;
    
    if (!clients.has(key)) {
      clients.set(key, {
        documento: record.documento,
        nombre: record.nombre,
        email: record.email,
        celular: record.celular,
        fechaNacimiento: record.fechaNacimiento,
        direccion: record.direccion,
        transacciones: [],
      });
    }
    
    // Actualizar datos del cliente si hay info más completa
    const client = clients.get(key);
    if (!client.email && record.email) client.email = record.email;
    if (!client.celular && record.celular) client.celular = record.celular;
    if (!client.fechaNacimiento && record.fechaNacimiento) client.fechaNacimiento = record.fechaNacimiento;
    if (!client.direccion && record.direccion) client.direccion = record.direccion;
    
    // Agregar transacción
    client.transacciones.push({
      fechaFactura: record.fechaFactura,
      fechaInicio: record.fechaInicio,
      fechaFin: record.fechaFin,
      producto: record.producto,
      valorPagado: record.valorPagado,
      diasRestantes: record.diasRestantes,
      tipo: record.tipo,
    });
  }
  
  return Array.from(clients.values());
}

// Determinar estado de membresía
function getMembershipStatus(fechaFin) {
  if (!fechaFin) return 'expired';
  const today = new Date().toISOString().split('T')[0];
  return fechaFin >= today ? 'active' : 'expired';
}

// Generar SQL
function generateSQL(clients) {
  let sql = '';
  
  sql += `-- =========================================\n`;
  sql += `-- MIGRACIÓN BIGBOSS → ROGERBOX\n`;
  sql += `-- Clientes: ${clients.length}\n`;
  sql += `-- Generado: ${new Date().toISOString()}\n`;
  sql += `-- =========================================\n\n`;
  
  sql += `-- PASO 0: Verificar que existen los planes\n`;
  sql += `-- (Si falta algún plan, créalo primero en el admin)\n`;
  sql += `SELECT id, name FROM gym_plans WHERE name IN (\n`;
  sql += `  'cupo ROGERBOX', 'cupo ROGERBOX virtual', 'ASESORIA VIP - COACHING',\n`;
  sql += `  'BOX 15 DIAS', 'LINIMENTO', 'ASESORIA PLATA', 'BANDA BOX'\n`;
  sql += `);\n\n`;
  
  sql += `-- =========================================\n`;
  sql += `-- PASO 1: INSERTAR CLIENTES\n`;
  sql += `-- =========================================\n\n`;
  
  // Generar INSERTs para clientes
  for (const client of clients) {
    const whatsapp = client.celular ? client.celular.replace(/\D/g, '') : '0000000000';
    const birthDate = client.fechaNacimiento ? `'${client.fechaNacimiento}'` : 'NULL';
    const notes = client.direccion ? `Dirección: ${escapeSql(client.direccion)}` : '';
    
    sql += `INSERT INTO gym_client_info (document_id, name, email, whatsapp, birth_date, medical_restrictions)\n`;
    sql += `VALUES (\n`;
    sql += `  '${escapeSql(client.documento)}',\n`;
    sql += `  '${escapeSql(client.nombre)}',\n`;
    sql += `  ${client.email ? `'${escapeSql(client.email)}'` : 'NULL'},\n`;
    sql += `  '${whatsapp.length >= 10 ? whatsapp : '0000000000'}',\n`;
    sql += `  ${birthDate},\n`;
    sql += `  ${notes ? `'${notes}'` : 'NULL'}\n`;
    sql += `) ON CONFLICT (document_id) DO NOTHING;\n\n`;
  }
  
  sql += `-- =========================================\n`;
  sql += `-- PASO 2: INSERTAR MEMBRESÍAS Y PAGOS\n`;
  sql += `-- =========================================\n\n`;
  
  let membershipCount = 0;
  
  for (const client of clients) {
    // Ordenar transacciones por fecha
    const sortedTx = client.transacciones.sort((a, b) => {
      const dateA = a.fechaInicio || a.fechaFactura || '';
      const dateB = b.fechaInicio || b.fechaFactura || '';
      return dateA.localeCompare(dateB);
    });
    
    for (const tx of sortedTx) {
      if (!tx.fechaInicio || !tx.fechaFin || !tx.producto) continue;
      
      const planName = PLAN_MAPPING[tx.producto];
      if (!planName) {
        console.log(`⚠️  Producto no mapeado: "${tx.producto}"`);
        continue;
      }
      
      const status = getMembershipStatus(tx.fechaFin);
      const paymentDate = tx.fechaFactura || tx.fechaInicio;
      
      membershipCount++;
      
      sql += `-- Cliente: ${client.nombre} (${client.documento}) - ${planName}\n`;
      sql += `DO $$\n`;
      sql += `DECLARE\n`;
      sql += `  v_client_id UUID;\n`;
      sql += `  v_plan_id UUID;\n`;
      sql += `  v_membership_id UUID;\n`;
      sql += `BEGIN\n`;
      sql += `  -- Obtener client_info_id\n`;
      sql += `  SELECT id INTO v_client_id FROM gym_client_info WHERE document_id = '${escapeSql(client.documento)}';\n`;
      sql += `  \n`;
      sql += `  -- Obtener plan_id\n`;
      sql += `  SELECT id INTO v_plan_id FROM gym_plans WHERE name = '${planName}';\n`;
      sql += `  \n`;
      sql += `  IF v_client_id IS NOT NULL AND v_plan_id IS NOT NULL THEN\n`;
      sql += `    -- Crear membresía\n`;
      sql += `    INSERT INTO gym_memberships (client_info_id, plan_id, start_date, end_date, status)\n`;
      sql += `    VALUES (v_client_id, v_plan_id, '${tx.fechaInicio}', '${tx.fechaFin}', '${status}')\n`;
      sql += `    RETURNING id INTO v_membership_id;\n`;
      sql += `    \n`;
      sql += `    -- Crear pago asociado\n`;
      sql += `    INSERT INTO gym_payments (membership_id, client_info_id, plan_id, amount, payment_method, payment_date, period_start, period_end, notes)\n`;
      sql += `    VALUES (v_membership_id, v_client_id, v_plan_id, ${tx.valorPagado || 0}, 'cash', '${paymentDate}', '${tx.fechaInicio}', '${tx.fechaFin}', 'Migrado desde BigBoss');\n`;
      sql += `  END IF;\n`;
      sql += `END $$;\n\n`;
    }
  }
  
  sql += `-- =========================================\n`;
  sql += `-- VERIFICACIÓN FINAL\n`;
  sql += `-- =========================================\n\n`;
  sql += `SELECT 'Clientes migrados:' as info, COUNT(*) as total FROM gym_client_info;\n`;
  sql += `SELECT 'Membresías migradas:' as info, COUNT(*) as total FROM gym_memberships;\n`;
  sql += `SELECT 'Pagos migrados:' as info, COUNT(*) as total FROM gym_payments;\n`;
  
  console.log(`\n📊 Estadísticas:`);
  console.log(`   - Clientes: ${clients.length}`);
  console.log(`   - Membresías/Pagos: ${membershipCount}`);
  
  return sql;
}

// Función principal
async function main() {
  console.log('🚀 Generando SQL de migración de clientes\n');
  
  // 1. Parsear archivo
  const records = parseHtmlFile(INPUT_FILE);
  
  if (records.length === 0) {
    console.log('❌ No se encontraron registros válidos.');
    return;
  }
  
  // 2. Agrupar por cliente
  const clients = groupByClient(records);
  console.log(`\n👥 Clientes únicos: ${clients.length}`);
  
  // 3. Generar SQL
  const sql = generateSQL(clients);
  
  // 4. Guardar archivo
  fs.writeFileSync(OUTPUT_SQL, sql);
  console.log(`\n✅ SQL guardado en: ${OUTPUT_SQL}`);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Asegúrate de que todos los planes existan en gym_plans');
  console.log('   2. Ejecuta el SQL en Supabase SQL Editor');
}

main().catch(console.error);
