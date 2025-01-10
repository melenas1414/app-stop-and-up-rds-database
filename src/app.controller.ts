import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './modules/database/database.service';

@Controller()
export class AppController {
  private dbService = new DatabaseService();

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('down-dbs')
  async downDbs(): Promise<string> {
    await this.dbService.databaseDown();
    return 'down';
  }
  @Get('up-dbs')
  async upDbs(): Promise<string> {
    await this.dbService.databaseUp();
    return 'up';
  }
}
