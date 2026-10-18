/** Estados de pedido guardados en la base de datos (español). */
export const ESTADOS_PEDIDO = [
  'RECIBIDO',
  'EN_PREPARACION',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
  'DEVUELTO',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

/** @deprecated usar ESTADOS_PEDIDO */
export const ORDER_STATUSES = ESTADOS_PEDIDO;
export type OrderStatus = EstadoPedido;
