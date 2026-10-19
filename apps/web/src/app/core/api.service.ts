import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Department,
  Municipality,
  OpsCustomer,
  OpsMetrics,
  OpsOrder,
  AbandonedCart,
  AdminNotifyEmail,
  OrderResult,
  Product,
  ShippingQuote,
  SiteConfig,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getProducts() {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  getProduct(slug: string) {
    return this.http.get<Product>(`${this.base}/products/${slug}`);
  }

  getDepartments() {
    return this.http.get<Department[]>(`${this.base}/geo/departments`);
  }

  getMunicipalities(departmentCode: string) {
    return this.http.get<Municipality[]>(
      `${this.base}/geo/municipalities/${departmentCode}`,
    );
  }

  getShipping(municipalityCode: string) {
    return this.http.get<ShippingQuote>(`${this.base}/geo/shipping`, {
      params: { municipalityCode },
    });
  }

  getSiteConfig() {
    return this.http.get<SiteConfig>(`${this.base}/site/config`);
  }

  createOrder(body: unknown) {
    return this.http.post<OrderResult>(`${this.base}/orders`, body);
  }

  saveCart(body: {
    visitorId: string;
    items: {
      productId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
    }[];
    subtotalCents: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    addressLine?: string;
    neighborhood?: string;
    departmentCode?: string;
    municipalityCode?: string;
  }) {
    return this.http.post(`${this.base}/carts`, body);
  }

  adminCarts(token: string) {
    return this.http.get<AbandonedCart[]>(
      `${this.base}/admin/carts`,
      this.authHeaders(token),
    );
  }

  login(email: string, password: string) {
    return this.http.post<{
      accessToken: string;
      user: { id: string; email: string; name: string };
    }>(`${this.base}/auth/login`, { email, password });
  }

  adminMetrics(token: string) {
    return this.http.get<OpsMetrics>(
      `${this.base}/admin/metrics`,
      this.authHeaders(token),
    );
  }

  adminOrders(token: string) {
    return this.http.get<OpsOrder[]>(
      `${this.base}/admin/orders`,
      this.authHeaders(token),
    );
  }

  adminOrder(token: string, id: string) {
    return this.http.get<OpsOrder>(
      `${this.base}/admin/orders/${id}`,
      this.authHeaders(token),
    );
  }

  updateOrder(token: string, id: string, data: Partial<OpsOrder> & { status?: string }) {
    return this.http.patch<OpsOrder>(
      `${this.base}/admin/orders/${id}`,
      data,
      this.authHeaders(token),
    );
  }

  deleteOrder(token: string, id: string) {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/admin/orders/${id}`,
      this.authHeaders(token),
    );
  }

  adminCustomers(token: string) {
    return this.http.get<OpsCustomer[]>(
      `${this.base}/admin/customers`,
      this.authHeaders(token),
    );
  }

  adminCustomer(token: string, phoneKey: string) {
    return this.http.get<OpsCustomer>(
      `${this.base}/admin/customers/${phoneKey}`,
      this.authHeaders(token),
    );
  }

  updateCustomer(
    token: string,
    phoneKey: string,
    data: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      addressLine: string;
      neighborhood?: string;
    },
  ) {
    return this.http.patch<OpsCustomer>(
      `${this.base}/admin/customers/${phoneKey}`,
      data,
      this.authHeaders(token),
    );
  }

  deleteCustomer(token: string, phoneKey: string) {
    return this.http.delete<{ ok: boolean; removed: number }>(
      `${this.base}/admin/customers/${phoneKey}`,
      this.authHeaders(token),
    );
  }

  adminProducts(token: string) {
    return this.http.get<Product[]>(
      `${this.base}/admin/products`,
      this.authHeaders(token),
    );
  }

  updateOrderStatus(token: string, id: string, status: string, note?: string) {
    return this.http.patch(
      `${this.base}/admin/orders/${id}/status`,
      { status, note },
      this.authHeaders(token),
    );
  }

  updateProduct(token: string, id: string, data: Partial<Product>) {
    return this.http.patch(`${this.base}/admin/products/${id}`, data, {
      ...this.authHeaders(token),
    });
  }

  createProduct(token: string, data: Partial<Product> & { sku: string; slug: string }) {
    return this.http.post<Product>(`${this.base}/admin/products`, data, {
      ...this.authHeaders(token),
    });
  }

  deleteProduct(token: string, id: string) {
    return this.http.delete<{ ok: boolean; softDeleted?: boolean }>(
      `${this.base}/admin/products/${id}`,
      this.authHeaders(token),
    );
  }

  deleteCart(token: string, id: string) {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/admin/carts/${id}`,
      this.authHeaders(token),
    );
  }

  trackEvent(body: {
    visitorId: string;
    sessionId?: string;
    type: string;
    path: string;
    label?: string;
    element?: string;
    xPercent?: number;
    yPercent?: number;
    viewportW?: number;
    viewportH?: number;
    referrer?: string;
    city?: string;
    region?: string;
    country?: string;
    metaJson?: string;
  }) {
    return this.http.post(`${this.base}/analytics/events`, body);
  }

  adminNotifyEmails(token: string) {
    return this.http.get<AdminNotifyEmail[]>(
      `${this.base}/admin/notify-emails`,
      this.authHeaders(token),
    );
  }

  createNotifyEmail(
    token: string,
    data: { email: string; name?: string; active?: boolean },
  ) {
    return this.http.post<AdminNotifyEmail>(
      `${this.base}/admin/notify-emails`,
      data,
      this.authHeaders(token),
    );
  }

  updateNotifyEmail(
    token: string,
    id: string,
    data: { email?: string; name?: string; active?: boolean },
  ) {
    return this.http.patch<AdminNotifyEmail>(
      `${this.base}/admin/notify-emails/${id}`,
      data,
      this.authHeaders(token),
    );
  }

  deleteNotifyEmail(token: string, id: string) {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/admin/notify-emails/${id}`,
      this.authHeaders(token),
    );
  }

  testNotifyEmails(token: string) {
    return this.http.post<{ ok: boolean; recipients: string[] }>(
      `${this.base}/admin/notify-emails/test`,
      {},
      this.authHeaders(token),
    );
  }

  private authHeaders(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}
