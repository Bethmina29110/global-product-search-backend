import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-meta')
  testMeta() {
    return {
      data: [{ id: 1 }],
      meta: { total: 10, page: 1, limit: 20 }
    };
  }
}
