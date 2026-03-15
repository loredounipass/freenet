import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from './hash.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Profile, ProfileSchema } from 'src/profile/schemas/profile.schema';
import { AuthService } from '../auth/auth.service';
import { TwoFactorAuthModule } from 'src/two-factor/verification.module';
import { EmailModule } from './email.module';
import { ForgotPasswordService } from './forgot.password.service';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';

export { UserRepository, ProfileRepository };

@Module({
  imports: [
    EmailModule,
    TwoFactorAuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    HashService,
    AuthService,
    ForgotPasswordService,
    UserRepository,
    ProfileRepository,
  ],
  exports: [UserService, HashService, UserRepository, ProfileRepository],
})
export class UserModule { }
