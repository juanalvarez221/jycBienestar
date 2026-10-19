import { Controller, Get, Param, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('departments')
  departments() {
    return this.geo.departments();
  }

  @Get('municipalities/:departmentCode')
  municipalities(@Param('departmentCode') departmentCode: string) {
    return this.geo.municipalities(departmentCode);
  }

  @Get('shipping')
  shipping(@Query('municipalityCode') municipalityCode: string) {
    return this.geo.shippingQuote(municipalityCode);
  }
}
