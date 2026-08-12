import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDateOnlyLocal } from '@/lib/dateUtils';
import { isPlaceholderGymWhatsapp } from '@/lib/gymClientDisplay';
import type { GymPayment } from '@/types/gym';

export async function downloadGymPaymentInvoicePdf(
  payment: GymPayment,
): Promise<void> {
  const invoiceDiv = document.createElement('div');
  invoiceDiv.style.width = '800px';
  invoiceDiv.style.padding = '40px';
  invoiceDiv.style.backgroundColor = '#ffffff';
  invoiceDiv.style.fontFamily = 'Arial, sans-serif';
  invoiceDiv.style.color = '#333';
  invoiceDiv.style.position = 'absolute';
  invoiceDiv.style.left = '-9999px';

  const paymentMethodText =
    payment.payment_method === 'cash'
      ? 'Efectivo'
      : payment.payment_method === 'transfer'
        ? 'Transferencia'
        : 'Mixto';
  const periodStartFormatted = formatDateOnlyLocal(payment.period_start, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const periodEndFormatted = formatDateOnlyLocal(payment.period_end, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const paymentDateFormatted = formatDateOnlyLocal(payment.payment_date, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const clientWa = payment.client_info?.whatsapp;
  const waPdfBlock =
    clientWa && !isPlaceholderGymWhatsapp(clientWa)
      ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">WhatsApp ${clientWa}</div>`
      : clientWa && isPlaceholderGymWhatsapp(clientWa)
        ? `<div style="font-size: 12px; color: #94a3b8; margin-top: 2px; font-style: italic;">WhatsApp pendiente</div>`
        : '';

  const invoiceNo = payment.invoice_number
    ? String(payment.invoice_number).padStart(3, '0')
    : payment.id.substring(0, 8).toUpperCase();

  invoiceDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
        <div style="font-size: 28px; font-weight: 900; color: #164151; letter-spacing: -0.5px; font-family: Arial, sans-serif;">
          <strong style="font-weight: 900;">ROGER</strong><strong style="color: #85ea10; font-weight: 900;">BOX</strong>
        </div>
        <div style="font-size: 13px; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.08em;">
          Comprobante de pago
        </div>
        <div style="font-size: 15px; color: #164151; font-weight: 600; margin-top: 12px;">
          Factura Nº ${invoiceNo}
        </div>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 28px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 220px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Emisor</div>
          <div style="font-size: 14px; color: #164151; font-weight: 600;">ROGERBOX</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">NIT 1102819763-9</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Cr 54 A #25-26, Los Alpes · 3005009487</div>
        </div>
        <div style="flex: 1; min-width: 220px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Cliente</div>
          <div style="font-size: 14px; color: #164151; font-weight: 600;">${payment.client_info?.name || '—'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Doc. ${payment.client_info?.document_id || '—'}</div>
          ${waPdfBlock}
        </div>
      </div>

      <div style="background: #164151; color: #fff; padding: 14px 20px; border-radius: 12px 12px 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
        Detalle del plan y pago
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500; width: 38%;">Plan</td>
            <td style="padding: 14px 20px; color: #164151; font-weight: 600;">${payment.plan?.name || 'Plan'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de inicio</td>
            <td style="padding: 14px 20px; color: #0f172a;">${periodStartFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de finalización</td>
            <td style="padding: 14px 20px; color: #0f172a;">${periodEndFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Fecha de pago</td>
            <td style="padding: 14px 20px; color: #0f172a;">${paymentDateFormatted}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Método de pago</td>
            <td style="padding: 14px 20px; color: #0f172a;">${paymentMethodText}</td>
          </tr>
          ${
            payment.notes
              ? `<tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px 20px; color: #64748b; font-weight: 500;">Notas</td>
            <td style="padding: 14px 20px; color: #0f172a;">${payment.notes}</td>
          </tr>`
              : ''
          }
          <tr style="background: #f0fdf4;">
            <td style="padding: 18px 20px; color: #164151; font-weight: 700; font-size: 15px;">Total pagado</td>
            <td style="padding: 18px 20px; color: #164151; font-weight: 800; font-size: 20px;">$${payment.amount.toLocaleString('es-CO')} COP</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">
          RogerBox · registro interno · exportado ${new Date().toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    `;

  document.body.appendChild(invoiceDiv);

  try {
    const canvas = await html2canvas(invoiceDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `factura-${payment.invoice_number || payment.id.substring(0, 8)}-${payment.payment_date}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(invoiceDiv);
  }
}
