import { getTodayYmdColombia } from '@/lib/dateUtils';
import { isPlaceholderGymWhatsapp } from '@/lib/gymClientDisplay';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export type BirthdayClientRow = {
  id: string;
  name: string;
  document_id?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  birth_date: string;
  age: number;
  birthDayMonthLabel: string;
};

/** Normaliza birth_date a YYYY-MM-DD (zona local, sin UTC). */
export function parseBirthDateYmd(
  birthDate: string | Date | null | undefined,
): string | null {
  if (!birthDate) return null;

  if (typeof birthDate === 'string') {
    const birthDateStr = birthDate.split('T')[0].split(' ')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) return null;
    return birthDateStr;
  }

  const tempDate = new Date(birthDate);
  if (Number.isNaN(tempDate.getTime())) return null;
  const year = tempDate.getFullYear();
  const month = String(tempDate.getMonth() + 1).padStart(2, '0');
  const day = String(tempDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Mes/día (1-12, 1-31) para cada fecha del rango inclusive YYYY-MM-DD. */
export function getMonthDayPairsInRange(
  startYmd: string,
  endYmd: string,
): { month: number; day: number }[] {
  const [startYear, startMonth, startDay] = startYmd.split('-').map(Number);
  const [endYear, endMonth, endDay] = endYmd.split('-').map(Number);
  const pairs: { month: number; day: number }[] = [];

  let y = startYear;
  let m = startMonth;
  let d = startDay;
  const endNum = endYear * 10000 + endMonth * 100 + endDay;

  while (true) {
    const cur = y * 10000 + m * 100 + d;
    if (cur > endNum) break;
    pairs.push({ month: m, day: d });

    d += 1;
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d > daysInMonth) {
      d = 1;
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }

  return pairs;
}

export function formatBirthDayMonthLabel(birthYmd: string): string {
  const parts = birthYmd.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!month || !day) return birthYmd;
  return `${day} de ${MONTH_NAMES[month - 1] ?? ''}`;
}

export function computeAgeOnDate(birthYmd: string, referenceYmd: string): number {
  const [birthYear] = birthYmd.split('-').map(Number);
  const [refYear, refMonth, refDay] = referenceYmd.split('-').map(Number);
  const [, birthMonth, birthDay] = birthYmd.split('-').map(Number);

  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function filterBirthdayClients<T extends { birth_date?: string | null }>(
  clients: T[],
  startYmd: string,
  endYmd: string,
  referenceYmd: string = endYmd,
): (T & BirthdayClientRow)[] {
  const rangePairs = getMonthDayPairsInRange(startYmd, endYmd);

  return (clients || [])
    .map((client) => {
      const birthYmd = parseBirthDateYmd(client.birth_date);
      if (!birthYmd) return null;

      const [, birthMonth, birthDay] = birthYmd.split('-').map(Number);
      const matches = rangePairs.some(
        (p) => p.month === birthMonth && p.day === birthDay,
      );
      if (!matches) return null;

      return {
        ...client,
        birth_date: birthYmd,
        age: computeAgeOnDate(birthYmd, referenceYmd),
        birthDayMonthLabel: formatBirthDayMonthLabel(birthYmd),
      } as T & BirthdayClientRow;
    })
    .filter(Boolean) as (T & BirthdayClientRow)[];
}

export function buildRogerboxBirthdayWhatsappMessage(name: string): string {
  const firstName = (name || 'amigo').trim().split(/\s+/)[0] || 'amigo';
  return `Hola ${firstName}! 🎉 Felicidades desde RogerBox. Gracias por hacer parte de este equipo. ¡Que tengas un excelente día!`;
}

export function buildBirthdayWhatsappUrl(
  name: string,
  whatsapp: string | null | undefined,
): string | null {
  if (!whatsapp || isPlaceholderGymWhatsapp(whatsapp)) return null;
  let phone = whatsapp.replace(/\D/g, '');
  if (!phone) return null;
  if (phone.length === 10) phone = `57${phone}`;
  const message = buildRogerboxBirthdayWhatsappMessage(name);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getTodayBirthdayRange(): { start: string; end: string } {
  const today = getTodayYmdColombia();
  return { start: today, end: today };
}
