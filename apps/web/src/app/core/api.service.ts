import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  Department,
  Municipality,
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

  login(email: string, password: string) {
    return this.http.post<{
      accessToken: string;
      user: { id: string; email: string; name: string };
    }>(`${this.base}/auth/login`, { email, password });
  }

  adminMetrics(token: string) {
    return this.http.get<Record<string, number>>(`${this.base}/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  adminOrders(token: string) {
    return this.http.get<any[]>(`${this.base}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  adminProducts(token: string) {
    return this.http.get<Product[]>(`${this.base}/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  updateOrderStatus(
    token: string,
    id: string,
    status: string,
    note?: string,
  ) {
    return this.http.patch(
      `${this.base}/admin/orders/${id}/status`,
      { status, note },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  updateProduct(token: string, id: string, data: Partial<Product>) {
    return this.http.patch(`${this.base}/admin/products/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
