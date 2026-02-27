'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle, XCircle } from 'lucide-react';

interface WompiPaymentFormProps {
  course: {
    id: string;
    title: string;
    price: number;
  };
  customerEmail: string;
  customerName: string;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

type PaymentMethod = 'CARD' | 'NEQUI' | 'PSE';

export default function WompiPaymentForm({ 
  course, 
  customerEmail, 
  customerName, 
  onPaymentSuccess, 
  onPaymentError 
}: WompiPaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    nequiPhone: '',
    pseBank: '',
    pseDocument: '',
    pseDocumentType: 'CC'
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Crear orden primero
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          amount: course.price,
          customerEmail,
          customerName,
          paymentMethod: selectedMethod,
          paymentData
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Error creando orden');
      }

      const orderResult = await orderResponse.json();
      console.log('✅ Orden creada:', orderResult);

      // Simular procesamiento de pago exitoso
      setTimeout(() => {
        onPaymentSuccess(orderResult.transactionId || 'test-transaction-123');
        setIsProcessing(false);
      }, 2000);

    } catch (error) {
      console.error('❌ Error en el pago:', error);
      onPaymentError(error instanceof Error ? error.message : 'Error desconocido');
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Completar Pago</h2>
        <p className="text-gray-400 text-sm">{course.title}</p>
        <p className="text-2xl font-bold text-[#85ea10] mt-2">
          ${course.price.toLocaleString()} COP
        </p>
      </div>

      {/* Métodos de pago */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Método de pago</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedMethod('CARD')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedMethod === 'CARD'
                ? 'border-[#85ea10] bg-green-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700'
            }`}
          >
            <CreditCard className={`w-6 h-6 mx-auto mb-1 ${selectedMethod === 'CARD' ? 'text-[#85ea10]' : 'text-gray-400'}`} />
            <span className={`text-xs ${selectedMethod === 'CARD' ? 'text-[#85ea10]' : 'text-gray-400'}`}>Tarjeta</span>
          </button>
          
          <button
            onClick={() => setSelectedMethod('NEQUI')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedMethod === 'NEQUI'
                ? 'border-[#85ea10] bg-green-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700'
            }`}
          >
            <Smartphone className={`w-6 h-6 mx-auto mb-1 ${selectedMethod === 'NEQUI' ? 'text-[#85ea10]' : 'text-gray-400'}`} />
            <span className={`text-xs ${selectedMethod === 'NEQUI' ? 'text-[#85ea10]' : 'text-gray-400'}`}>Nequi</span>
          </button>
          
          <button
            onClick={() => setSelectedMethod('PSE')}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedMethod === 'PSE'
                ? 'border-[#85ea10] bg-green-900/20'
                : 'border-gray-600 hover:border-gray-500 bg-gray-700'
            }`}
          >
            <Building2 className={`w-6 h-6 mx-auto mb-1 ${selectedMethod === 'PSE' ? 'text-[#85ea10]' : 'text-gray-400'}`} />
            <span className={`text-xs ${selectedMethod === 'PSE' ? 'text-[#85ea10]' : 'text-gray-400'}`}>PSE</span>
          </button>
        </div>
      </div>

      {/* Formulario de pago */}
      <div className="space-y-4">
        {selectedMethod === 'CARD' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Número de tarjeta
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardNumber: formatCardNumber(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Vencimiento
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={paymentData.cardExpiry}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cardExpiry: formatExpiry(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
                  maxLength={5}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={paymentData.cardCvv}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cardCvv: e.target.value.replace(/\D/g, '')
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
                  maxLength={4}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nombre en la tarjeta
              </label>
              <input
                type="text"
                placeholder="Juan Pérez"
                value={paymentData.cardName}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardName: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </>
        )}

        {selectedMethod === 'NEQUI' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Número de teléfono Nequi
            </label>
            <input
              type="tel"
              placeholder="3001234567"
              value={paymentData.nequiPhone}
              onChange={(e) => setPaymentData({
                ...paymentData,
                nequiPhone: e.target.value.replace(/\D/g, '')
              })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Recibirás una notificación en tu app Nequi para confirmar el pago
            </p>
          </div>
        )}

        {selectedMethod === 'PSE' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Banco
              </label>
              <select
                value={paymentData.pseBank}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  pseBank: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white"
              >
                <option value="">Selecciona tu banco</option>
                <option value="BANCOLOMBIA">Bancolombia</option>
                <option value="BANCO_DE_BOGOTA">Banco de Bogotá</option>
                <option value="BBVA">BBVA</option>
                <option value="DAVIVIENDA">Davivienda</option>
                <option value="SCOTIABANK">Scotiabank</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de documento
                </label>
                <select
                  value={paymentData.pseDocumentType}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    pseDocumentType: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white"
                >
                  <option value="CC">Cédula</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Número de documento
                </label>
                <input
                  type="text"
                  placeholder="12345678"
                  value={paymentData.pseDocument}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    pseDocument: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#85ea10] bg-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botón de pago */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full mt-6 bg-[#85ea10] text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Procesando pago...
          </>
        ) : (
          `Pagar $${course.price.toLocaleString()} COP`
        )}
      </button>

      {/* Información de seguridad */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          🔒 Pago seguro procesado por Wompi
        </p>
      </div>
    </div>
  );
}
