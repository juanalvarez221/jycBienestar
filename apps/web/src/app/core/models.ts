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
