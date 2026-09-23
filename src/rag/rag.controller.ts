import { Body, Controller, Post, Query, Req, Logger } from '@nestjs/common';
import { RagService } from './rag.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  search(
    @Body() body: { query: string },
    @Req() request: Request,
    @CurrentUser() user: any
  ) {
    this.logger.debug(`\n--- NEW SEARCH REQUEST ---`);
    this.logger.debug(`Source: ${request.headers['user-agent']}`);
    this.logger.debug(`Body payload received: ${JSON.stringify(body)}`);
    this.logger.debug(`Type of query string: ${typeof body.query}`);
    this.logger.debug(`--------------------------\n`);
    const userId = user?.sub ? Number(user.sub) : undefined;
    return this.ragService.search(body.query, userId);
  }
}
