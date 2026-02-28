import { Injectable } from '@nestjs/common';

@Injectable()
export class DonationsService {
  // Reads wallet addresses from environment variables. Keep this file very small
  // so that there's no accidental exposure in the frontend build.
  getWallets() {
    return {
      btc: process.env.BTC_ADDRESS || null,
      usdt: process.env.USDT_ADDRESS || null,
    };
  }
}
