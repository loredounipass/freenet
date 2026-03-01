import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { UserModule } from '../user/user.module';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import { FeedAndMultimediaModule } from '../feed-and-multimedia/feed-and-multimedia.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => FeedAndMultimediaModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, LocalStorageProvider],
  exports: [ProfileService],
})
export class ProfileModule {}
