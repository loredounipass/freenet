import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DonationsModule } from './donations/donations.module';
import { TwoFactorAuthModule  } from './two-factor/verification.module';
import { MessagesAndMultimediaModule } from './messages-and-multimedia/messages-and-multimedia.module';
import { FeedAndMultimediaModule } from './feed-and-multimedia/feed-and-multimedia.module';
import { ProfileModule } from './profile/profile.module';
import { EventEmitterModule } from '@nestjs/event-emitter';


// This is the main application module that imports and configures various modules and services.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
    }),
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.RATE_LIMIT_TTL!),
      limit: parseInt(process.env.RATE_LIMIT!),
    }),
    
    MongooseModule.forRoot(
      process.env.DB_URI!,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    ),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!)
      }
    }),
    UserModule,
    FeedAndMultimediaModule,
    MessagesAndMultimediaModule,
    ProfileModule,
    AuthModule,
    TwoFactorAuthModule,
    DonationsModule
  ],
  providers: [],
})
export class AppModule { }
