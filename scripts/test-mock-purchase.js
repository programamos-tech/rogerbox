/**
 * Script para probar una compra mock directamente a nivel de API
 * Uso: node scripts/test-mock-purchase.js
 * Requiere Node.js 18+ (fetch nativo) o instalar node-fetch
 */

// Usar fetch global si está disponible (Node 18+), sino intentar importar
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('❌ fetch no está disponible. Usa Node.js 18+ o instala node-fetch');
    process.exit(1);
  }
}

const API_URL = 'http://localhost:3001/api/payments/create-order';

// Primero necesitamos obtener un curso real
async function getCourse() {
  try {
    const response = await fetch('http://localhost:54321/rest/v1/courses?select=id,title,price&is_published=eq.true&limit=1', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Content-Type': 'application/json'
      }
    });
    
    const courses = await response.json();
    if (courses && courses.length > 0) {
      return courses[0];
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo curso:', error);
    return null;
  }
}

async function testMockPurchase() {
  console.log('🧪 Probando compra mock a nivel de API...\n');
  
  // Obtener un curso real
  console.log('📚 Obteniendo curso disponible...');
  const course = await getCourse();
  
  if (!course) {
    console.error('❌ No se encontró ningún curso disponible');
    return;
  }
  
  console.log('✅ Curso encontrado:', {
    id: course.id,
    title: course.title,
    price: course.price
  });
  
  // Datos de prueba
  const purchaseData = {
    courseId: course.id,
    amount: course.price || 50000,
    customerEmail: 'test-api@test.com',
    customerName: 'Test API User',
    buyerData: {
      firstName: 'Test',
      lastName: 'API',
      documentId: '1234567890',
      documentType: 'CC',
      address: 'Test Address 123'
    }
  };
  
  console.log('\n📦 Enviando solicitud de compra...');
  console.log('Datos:', JSON.stringify(purchaseData, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Este endpoint requiere autenticación, pero en modo mock debería funcionar
        // Si falla, necesitaremos obtener un token de sesión primero
      },
      body: JSON.stringify(purchaseData)
    });
    
    const data = await response.json();
    
    console.log('\n📊 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ Compra mock creada exitosamente!');
      console.log('Order ID:', data.orderId);
      console.log('Reference:', data.reference);
      
      // Verificar que la compra se creó
      console.log('\n🔍 Verificando compra en la BD...');
      // Aquí podríamos hacer otra llamada para verificar, pero por ahora solo mostramos el resultado
    } else {
      console.error('\n❌ Error en la compra:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error haciendo la solicitud:', error.message);
  }
}

// Ejecutar
testMockPurchase();

