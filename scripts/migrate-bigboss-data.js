/**
 * Script de Migración: BigBoss.FIT → RogerBox
 * 
 * Este script parsea el archivo HTML exportado de BigBoss y genera
 * SQL para importar clientes, membresías y pagos a Supabase.
 * 
 * Uso: node scripts/migrate-bigboss-data.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_FILE = path.join(__dirname, '..', 'fileRpt_Vencimientos_2026_01_30_17_26_44.xls');
const OUTPUT_SQL = path.join(__dirname, '..', 'migration-output.sql');
const OUTPUT_JSON = path.join(__dirname, '..', 'migration-data.json');

// Función para limpiar texto HTML
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remover tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Función para parsear precio
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  // "$125.000,00" → 125000
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

// Función principal para parsear el archivo HTML
function parseHtmlFile(filePath) {
  console.log('📂 Leyendo archivo:', filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Buscar todas las filas de datos (skip headers)
  const rowRegex = /<tr>\s*<td[^>]*>(?:(?!<\/tr>).)*<\/tr>/gs;
  const rows = content.match(rowRegex) || [];
  
  console.log(`📊 Total de filas encontradas: ${rows.length}`);
  
  const records = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Extraer todas las celdas <td>...</td>
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells = [];
    let match;
    
    while ((match = cellRegex.exec(row)) !== null) {
      // Limpiar el contenido de la celda
      let cellContent = match[1];
      
      // Extraer texto de enlaces <a>
      const linkMatch = cellContent.match(/<a[^>]*>([^<]*)<\/a>/);
      if (linkMatch) {
        cellContent = linkMatch[1];
      }
      
      cells.push(cleanText(cellContent));
    }
    
    // Skip header rows y filas inválidas
    if (cells.length < 15 || cells[0] === 'SEDE' || cells[1] === 'AFILIADO') {
      continue;
    }
    
    // Validar que sea una fila de datos real (SEDE debe ser ROGERBOX o similar)
    if (!cells[0] || cells[0].includes('BigBoss')) {
      continue;
    }
    
    // Mapear columnas correctamente según el orden del HTML
    // 0: SEDE, 1: AFILIADO, 2: DOCUMENTO, 3: FECHA FACTURA, 4: INICIO, 5: FIN
    // 6: PRODUCTO, 7: VLR. PAGADO, 8: DIAS REST, 9: TIPO, 10: CANT. ENTRADAS
    // 11: CANT. ENTRADAS DISP, 12: FECHA NAC, 13: EDAD, 14: TELEFONO
    // 15: CELULAR, 16: E-MAIL, 17: DIRECCION, 18: ULT. INGRESO, 19: VENDEDOR
    
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
      cantEntradas: parseInt(cells[10]) || 0,
      cantEntradasDisp: parseInt(cells[11]) || 0,
      fechaNacimiento: parseDate(cells[12]),
      edad: parseInt(cells[13]) || 0,
      telefono: cells[14] || '',
      celular: cells[15] || '',
      email: cells[16] || '',
      direccion: cells[17] || '',
      ultimoIngreso: cells[18] || '',
      vendedor: cells[19] || '',
    };
    
    // Validar que tenga datos mínimos (documento debe ser numérico)
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
        celular: record.celular || record.telefono,
        fechaNacimiento: record.fechaNacimiento,
        direccion: record.direccion,
        transacciones: [],
      });
    }
    
    // Agregar transacción
    clients.get(key).transacciones.push({
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

// Identificar productos únicos
function getUniqueProducts(records) {
  const products = new Map();
  
  for (const record of records) {
    const key = record.producto;
    if (!key) continue;
    
    if (!products.has(key)) {
      products.set(key, {
        nombre: key,
        precios: new Set(),
        count: 0,
      });
    }
    
    products.get(key).precios.add(record.valorPagado);
    products.get(key).count++;
  }
  
  return Array.from(products.values()).map(p => ({
    ...p,
    precios: Array.from(p.precios).sort((a, b) => b - a),
  }));
}

// Generar SQL para crear planes
function generatePlanSQL(products) {
  let sql = `-- =========================================\n`;
  sql += `-- PLANES IDENTIFICADOS EN BIGBOSS\n`;
  sql += `-- =========================================\n\n`;
  
  const planMapping = [];
  
  for (const product of products) {
    const maxPrice = product.precios[0] || 145000;
    // Limpiar nombre del producto
    let cleanName = product.nombre
      .replace(/cupo ROGERBOX cupo ROGERBOX/i, 'Plan RogerBox')
      .replace(/ASESORIA VIP ASESORIA DE COACHING/i, 'Plan VIP Coaching')
      .trim();
    
    if (cleanName.length > 50) {
      cleanName = cleanName.substring(0, 50);
    }
    
    sql += `-- Producto original: "${product.nombre}" (${product.count} registros, precio max: $${maxPrice})\n`;
    sql += `INSERT INTO gym_plans (name, description, price, duration_days, is_active)\n`;
    sql += `VALUES ('${cleanName}', 'Migrado desde BigBoss', ${maxPrice}, 30, true)\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
    
    planMapping.push({
      original: product.nombre,
      cleaned: cleanName,
      price: maxPrice,
      count: product.count
    });
  }
  
  return { sql, planMapping };
}

// Función principal
async function main() {
  console.log('🚀 Iniciando migración BigBoss → RogerBox\n');
  
  // 1. Parsear archivo
  const records = parseHtmlFile(INPUT_FILE);
  
  if (records.length === 0) {
    console.log('❌ No se encontraron registros válidos. Revisa el formato del archivo.');
    return;
  }
  
  // 2. Identificar productos únicos (PLANES)
  const products = getUniqueProducts(records);
  console.log('\n📦 PRODUCTOS/PLANES encontrados:');
  console.log('================================');
  for (const p of products) {
    console.log(`   - "${p.nombre}"`);
    console.log(`     Registros: ${p.count}, Precios: $${p.precios.join(', $')}`);
  }
  
  // 3. Agrupar por cliente
  const clients = groupByClient(records);
  console.log(`\n👥 Clientes únicos: ${clients.length}`);
  
  // Estadísticas
  const clientsWithMultipleTx = clients.filter(c => c.transacciones.length > 1);
  console.log(`   - Con múltiples transacciones: ${clientsWithMultipleTx.length}`);
  
  const today = new Date().toISOString().split('T')[0];
  const activeClients = clients.filter(c => {
    const lastTx = c.transacciones[c.transacciones.length - 1];
    return lastTx && lastTx.fechaFin && lastTx.fechaFin >= today;
  });
  console.log(`   - Con membresía activa (hoy): ${activeClients.length}`);
  
  // 4. Generar SQL de planes
  const { sql: planSQL, planMapping } = generatePlanSQL(products);
  
  // 5. Guardar JSON para inspección
  const exportData = {
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    uniqueClients: clients.length,
    products: products,
    planMapping: planMapping,
    sampleClients: clients.slice(0, 10), // Solo primeros 10 para preview
    activeClientsCount: activeClients.length,
  };
  
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(exportData, null, 2));
  console.log(`\n📄 Preview guardado en: ${OUTPUT_JSON}`);
  
  // 6. Guardar SQL de planes
  fs.writeFileSync(OUTPUT_SQL, planSQL);
  console.log(`📄 SQL de planes guardado en: ${OUTPUT_SQL}`);
  
  console.log('\n✅ Análisis completado.');
  console.log('\n⚠️  PRÓXIMOS PASOS:');
  console.log('   1. Revisa migration-data.json para verificar los datos');
  console.log('   2. Revisa los PLANES identificados arriba');
  console.log('   3. Crea los planes manualmente en el admin o ejecuta el SQL');
  console.log('   4. Luego migraremos los clientes');
}

main().catch(console.error);
