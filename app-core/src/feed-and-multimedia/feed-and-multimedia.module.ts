import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedAndMultimediaService } from './feed-and-multimedia.service';
import { FeedAndMultimediaController } from './feed-and-multimedia.controller';
import { FeedPost, FeedPostSchema } from './schemas/feed.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { MessagesAndMultimediaModule } from '../messages-and-multimedia/messages-and-multimedia.module';
import { FeedGateway } from './feed.gateway';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bull';
import { LocalStorageProvider } from '../storage/local.storage.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedPost.name, schema: FeedPostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    // Reuse the Multimedia model registered in MessagesAndMultimediaModule
    // to avoid OverwriteModelError from multiple registrations.
    // MessagesAndMultimediaModule exports MongooseModule so its providers
    // (including Multimedia) are available here.
    MessagesAndMultimediaModule,
    BullModule.registerQueue({ name: 'multimedia' }),
    forwardRef(() => UserModule),
  ],
  controllers: [FeedAndMultimediaController],
  providers: [FeedAndMultimediaService, FeedGateway, LocalStorageProvider],
  exports: [FeedAndMultimediaService],
})
export class FeedAndMultimediaModule {}
