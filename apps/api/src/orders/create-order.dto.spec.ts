import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './dto/create-order.dto';

describe('CreateOrderDto', () => {
  it('rechaza si acceptedTerms no es true', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      customerName: 'Mateo López',
      customerPhone: '3001234567',
      addressLine: 'Calle 50 # 40-10',
      departmentCode: '05',
      municipalityCode: '05001',
      items: [{ productId: 'p1', quantity: 1 }],
      acceptedTerms: false,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'acceptedTerms')).toBe(true);
  });

  it('acepta payload válido con términos', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      customerName: 'Mateo López',
      customerPhone: '3001234567',
      addressLine: 'Calle 50 # 40-10',
      departmentCode: '05',
      municipalityCode: '05001',
      items: [{ productId: 'p1', quantity: 1 }],
      acceptedTerms: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
