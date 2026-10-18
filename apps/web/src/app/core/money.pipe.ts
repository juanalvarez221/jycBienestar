import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cop', standalone: true })
export class CopPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    const value = (cents ?? 0) / 100;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
