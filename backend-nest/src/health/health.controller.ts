import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return { status: 'online', service: 'Navora API' };
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'Navora Backend NestJS' };
  }
}
