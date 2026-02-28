import { Controller, Get } from '@nestjs/common';
import { DonationsService } from './donations.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('wallets')
  getWallets() {
    return this.donationsService.getWallets();
  }
}
