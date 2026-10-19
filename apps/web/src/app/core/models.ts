export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description: string;
  netContent: string;
  ingredients: string;
  usageText: string;
  manufacturer?: string | null;
  priceCents: number;
  stock: number;
  imageUrl?: string | null;
  active?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Department {
  code: string;
  name: string;
}

export interface Municipality {
  code: string;
  name: string;
  departmentCode: string;
  isPriority: boolean;
}

export interface ShippingQuote {
  feeCents: number;
  etaLabel: string;
  zoneLabel?: string | null;
}

export interface SiteConfig {
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactEmail?: string | null;
  termsVersion?: string;
  termsHtml: string;
  privacyHtml: string;
}

export interface OrderResult {
  id: string;
  orderNumber: string;
  totalCents: number;
  shippingCents: number;
  status: string;
}

export interface OpsOrderItem {
  id: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface OpsStatusEvent {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface OpsOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  neighborhood?: string | null;
  municipalityName?: string;
  departmentName?: string;
  notes?: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OpsOrderItem[];
  statusEvents?: OpsStatusEvent[];
}

export interface OpsCustomer {
  phoneKey: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  neighborhood?: string | null;
  municipalityName?: string;
  departmentName?: string;
  ordersCount: number;
  openCount: number;
  spentCents: number;
  lastOrderAt: string;
  orders?: OpsOrder[];
}

export interface AbandonedCart {
  id: string;
  visitorId: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  subtotalCents: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  addressLine?: string | null;
  neighborhood?: string | null;
  updatedAt: string;
}

export interface AdminNotifyEmail {
  id: string;
  email: string;
  name?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpsMetrics {
  total: number;
  recibidos: number;
  enPreparacion: number;
  enviados: number;
  entregados: number;
  cancelados: number;
  devueltos: number;
  ingresosCentavos: number;
  clientes: number;
  porAtender: number;
  carritosAbandonados?: number;
  valorCarritosAbandonadosCentavos?: number;
  carritos?: AbandonedCart[];
  visitantes7d?: number;
  vistas7d?: number;
  clics7d?: number;
  topClics?: { label: string; count: number }[];
  topPaginas?: { label: string; count: number }[];
  topUbicaciones?: { label: string; count: number }[];
  mapaClics?: { x: number; y: number; count: number; intensity: number }[];
  pedidosPorMunicipio?: {
    name: string;
    department: string;
    orders: number;
    revenueCents: number;
  }[];
  eventosRecientes?: {
    id: string;
    type: string;
    path: string;
    label?: string | null;
    city?: string | null;
    region?: string | null;
    createdAt: string;
    xPercent?: number | null;
    yPercent?: number | null;
  }[];
}
