import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderSuccessComponent } from './pages/order-success/order-success.component';
import { OpsShellComponent } from './pages/ops/ops-shell.component';
import { OpsHomeComponent } from './pages/ops/ops-home.component';
import { OpsOrdersComponent } from './pages/ops/ops-orders.component';
import { OpsOrderComponent } from './pages/ops/ops-order.component';
import { OpsCustomersComponent } from './pages/ops/ops-customers.component';
import { OpsCustomerComponent } from './pages/ops/ops-customer.component';
import { OpsCartsComponent } from './pages/ops/ops-carts.component';
import { OpsMetricsComponent } from './pages/ops/ops-metrics.component';
import { OpsProductsComponent } from './pages/ops/ops-products.component';
import { OpsEmailsComponent } from './pages/ops/ops-emails.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'producto/:slug', redirectTo: '', pathMatch: 'full' },
  { path: 'carrito', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'pedido-ok', component: OrderSuccessComponent },
  { path: 'terminos', redirectTo: '', pathMatch: 'full' },
  { path: 'privacidad', redirectTo: '', pathMatch: 'full' },
  {
    path: environment.opsPath,
    component: OpsShellComponent,
    children: [
      { path: '', component: OpsHomeComponent },
      { path: 'pedidos', component: OpsOrdersComponent },
      { path: 'pedidos/:id', component: OpsOrderComponent },
      { path: 'metricas', component: OpsMetricsComponent },
      { path: 'productos', component: OpsProductsComponent },
      { path: 'productos/:id', component: OpsProductsComponent },
      { path: 'correos', component: OpsEmailsComponent },
      { path: 'carritos', component: OpsCartsComponent },
      { path: 'clientes', component: OpsCustomersComponent },
      { path: 'clientes/:phoneKey', component: OpsCustomerComponent },
      // Rutas desconocidas del panel → inicio admin (nunca a la tienda pública).
      { path: '**', redirectTo: '' },
    ],
  },
  { path: '**', redirectTo: '' },
];
