import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductComponent } from './pages/product/product.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { LegalComponent } from './pages/legal/legal.component';
import { OrderSuccessComponent } from './pages/order-success/order-success.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'producto/:slug', component: ProductComponent },
  { path: 'carrito', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'pedido-ok', component: OrderSuccessComponent },
  {
    path: 'terminos',
    component: LegalComponent,
    data: { kind: 'terms' },
  },
  {
    path: 'privacidad',
    component: LegalComponent,
    data: { kind: 'privacy' },
  },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' },
];
