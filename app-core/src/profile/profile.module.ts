import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { UserModule } from '../user/user.module';
import { LocalStorageProvider } from '../storage/local.storage.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
    ]),
    forwardRef(() => UserModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, LocalStorageProvider],
  exports: [ProfileService],
})
export class ProfileModule {}
