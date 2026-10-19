import { environment } from '../../../environments/environment';

export const OPS_PATH = environment.opsPath;

export const ORDER_STATUSES = [
  'RECIBIDO',
  'EN_PREPARACION',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
  'DEVUELTO',
] as const;

const LABELS: Record<string, string> = {
  RECIBIDO: 'Recibido',
  RECEIVED: 'Recibido',
  EN_PREPARACION: 'En preparación',
  PREPARING: 'En preparación',
  ENVIADO: 'Enviado',
  SHIPPED: 'Enviado',
  ENTREGADO: 'Entregado',
  DELIVERED: 'Entregado',
  CANCELADO: 'Cancelado',
  CANCELLED: 'Cancelado',
  DEVUELTO: 'Devuelto',
  RETURNED: 'Devuelto',
};

export function canonicalStatus(status: string) {
  const map: Record<string, string> = {
    RECEIVED: 'RECIBIDO',
    PREPARING: 'EN_PREPARACION',
    SHIPPED: 'ENVIADO',
    DELIVERED: 'ENTREGADO',
    CANCELLED: 'CANCELADO',
    RETURNED: 'DEVUELTO',
  };
  return map[status] ?? status;
}

export function statusOptions(current?: string) {
  const list = [...ORDER_STATUSES] as string[];
  if (current && !list.includes(current)) list.unshift(current);
  return list;
}

export function statusLabel(status: string) {
  return LABELS[status] ?? status;
}

export function formatWhen(value: string | Date) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function phoneKey(phone: string) {
  return phone.replace(/\D/g, '');
}

export function isUnauthorized(error: unknown) {
  return (error as { status?: number })?.status === 401;
}
