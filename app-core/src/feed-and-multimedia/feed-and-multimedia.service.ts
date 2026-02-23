import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedPost, FeedPostDocument } from './schemas/feed.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Multimedia, MultimediaDocument } from '../messages-and-multimedia/schemas/multimedia.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { LocalStorageProvider } from 'src/storage/local.storage.provider';
import * as crypto from 'crypto';

@Injectable()
export class FeedAndMultimediaService implements OnModuleInit {
  constructor(
    @InjectModel(FeedPost.name) private feedModel: Model<FeedPostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Multimedia.name) private multimediaModel: Model<MultimediaDocument>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('multimedia') private readonly multimediaQueue: Queue,
    private readonly storage: LocalStorageProvider,
  ) {}

  // Listen to multimedia processing events to update feed posts when media becomes ready
  onModuleInit() {
    try {
      this.eventEmitter.on('multimedia.ready', async (payload: any) => {
        try {
          const mmId = payload?.multimediaId;
          const postId = payload?.messageId; // we use messageId slot to carry postId for feed uploads
          if (!mmId) return;
          // Find related feed post either by _id == postId or by multimediaId == mmId
          let postDoc: any = null;
          if (postId && Types.ObjectId.isValid(postId)) {
            postDoc = await this.feedModel.findById(postId).lean().exec();
          }
          if (!postDoc) {
            postDoc = await this.feedModel.findOne({ multimediaId: new Types.ObjectId(mmId) }).lean().exec();
          }
          if (!postDoc) return;

          // build enriched payload
          const multimedia = await this.multimediaModel.findById(mmId).select('_id url thumbnailUrl status').lean().exec();
          const commentsCount = await this.commentModel.countDocuments({ post: postDoc._id }).exec().catch(() => 0);
          const out = {
            _id: postDoc._id?.toString(),
            description: postDoc.description,
            type: postDoc.type,
            author: postDoc.author?.toString(),
            multimediaId: postDoc.multimediaId,
            multimediaUrl: multimedia?.url || undefined,
            thumbnailUrl: multimedia?.thumbnailUrl || undefined,
            likesCount: Array.isArray(postDoc.likes) ? postDoc.likes.length : 0,
            commentsCount,
            shares: postDoc.shares || 0,
            views: postDoc.views || 0,
            createdAt: postDoc.createdAt,
            updatedAt: postDoc.updatedAt,
          };
          this.eventEmitter.emit('post.updated', out);
        } catch (_) {}
      });

      this.eventEmitter.on('multimedia.failed', async (payload: any) => {
        try {
          const mmId = payload?.multimediaId;
          const postId = payload?.messageId;
          if (!mmId) return;
          let postDoc: any = null;
          if (postId && Types.ObjectId.isValid(postId)) {
            postDoc = await this.feedModel.findById(postId).lean().exec();
          }
          if (!postDoc) {
            postDoc = await this.feedModel.findOne({ multimediaId: new Types.ObjectId(mmId) }).lean().exec();
          }
          if (!postDoc) return;

          const commentsCount = await this.commentModel.countDocuments({ post: postDoc._id }).exec().catch(() => 0);
          const out = {
            _id: postDoc._id?.toString(),
            description: postDoc.description,
            type: postDoc.type,
            author: postDoc.author?.toString(),
            multimediaId: postDoc.multimediaId,
            multimediaUrl: payload?.url || undefined,
            thumbnailUrl: payload?.thumbnailUrl || undefined,
            likesCount: Array.isArray(postDoc.likes) ? postDoc.likes.length : 0,
            commentsCount,
            shares: postDoc.shares || 0,
            views: postDoc.views || 0,
            createdAt: postDoc.createdAt,
            updatedAt: postDoc.updatedAt,
          };
          this.eventEmitter.emit('post.updated', out);
        } catch (_) {}
      });
    } catch (_) {}
  }

  async createPost(dto: CreatePostDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');
    const author = await this.userService.getUserById(dto.authorId);
    if (!author) throw new NotFoundException('Author not found');

    const created = await this.feedModel.create({
      description: dto.description,
      type: dto.type,
      author: new Types.ObjectId(authorId),
      multimediaId: dto.multimediaId ? new Types.ObjectId(dto.multimediaId) : undefined,
    });

    // populate multimedia url/thumbnail if multimediaId was provided
    let multimediaUrl: string | undefined = undefined
    let thumbnailUrl: string | undefined = undefined
    if (created.multimediaId) {
      try {
        const m = await this.multimediaModel.findById(created.multimediaId).select('_id url thumbnailUrl status').lean().exec()
        if (m) {
          multimediaUrl = m.url
          thumbnailUrl = m.thumbnailUrl
        }
      } catch (_) {}
    }

    // count initial comments (usually zero)
    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: created._id }).exec() } catch (_) {}

    const out = {
      _id: created._id?.toString(),
      description: created.description,
      type: created.type,
      author: created.author?.toString(),
      multimediaId: created.multimediaId,
      multimediaUrl,
      thumbnailUrl,
      likesCount: Array.isArray((created as any).likes) ? (created as any).likes.length : 0,
      commentsCount,
      shares: (created as any).shares || 0,
      views: (created as any).views || 0,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };

    this.eventEmitter.emit('post.created', out);
    return out;
  }

  // Create a post from an uploaded file: store staging, create Multimedia doc, create FeedPost, enqueue processing
  async createPostWithFile(file: Express.Multer.File, body: any, authorId: string) {
    if (!file) throw new BadRequestException('File is required');
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid authorId');

    const dto: CreatePostDto = {
      description: body.description || '',
      type: body.type || (file.mimetype && file.mimetype.startsWith('video') ? 'video' : 'image'),
      authorId: authorId,
    } as CreatePostDto;

    // upload to staging
    const stagingKey = `staging/${crypto.randomUUID()}-${file.originalname}`;
    const uploadResult = await this.storage.upload(file.buffer, stagingKey, file.mimetype);

    // create multimedia doc
    const multimediaDoc = await this.multimediaModel.create({
      url: uploadResult.url,
      type: dto.type,
      owner: new Types.ObjectId(authorId),
      description: dto.description || undefined,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      status: 'uploading',
    });

    // create feed post referencing multimedia
    const created = await this.feedModel.create({
      description: dto.description,
      type: dto.type,
      author: new Types.ObjectId(authorId),
      multimediaId: multimediaDoc._id,
    });

    // link multimedia -> post
    multimediaDoc.message = created._id;
    multimediaDoc.status = 'processing';
    multimediaDoc.url = uploadResult.url;
    await multimediaDoc.save();

    // enqueue processing job; reuse messageId slot to carry post id so processors/listeners can map back
    await this.multimediaQueue.add('process', {
      stagingKey: uploadResult.key,
      multimediaId: multimediaDoc._id.toString(),
      messageId: created._id.toString(),
      ownerId: authorId,
      mimeType: file.mimetype,
    });

    const out = {
      _id: created._id?.toString(),
      description: created.description,
      type: created.type,
      author: created.author?.toString(),
      multimediaId: created.multimediaId,
      multimediaUrl: uploadResult.url,
      thumbnailUrl: multimediaDoc.thumbnailUrl || undefined,
      likesCount: Array.isArray((created as any).likes) ? (created as any).likes.length : 0,
      commentsCount: 0,
      shares: (created as any).shares || 0,
      views: (created as any).views || 0,
      createdAt: (created as any).createdAt,
      updatedAt: (created as any).updatedAt,
    };

    this.eventEmitter.emit('post.created', out);
    return out;
  }

  async getPostsByUser(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const id = new Types.ObjectId(userId);
    const posts = await this.feedModel
      .find({ author: id })
      .select('_id description type author multimediaId likes shares views createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // populate multimedia URLs where available
    const multimediaIds = posts.filter((p: any) => p.multimediaId).map((p: any) => p.multimediaId.toString());
    const multimediaMap: Map<string, any> = new Map();
    if (multimediaIds.length > 0) {
      const uniq = Array.from(new Set(multimediaIds));
      const mDocs = await this.multimediaModel.find({ _id: { $in: uniq } }).select('_id url thumbnailUrl status').lean().exec();
      for (const m of mDocs) multimediaMap.set(m._id?.toString(), m);
    }

    return posts.map((doc: any) => ({
      _id: doc._id,
      description: doc.description,
      type: doc.type,
      author: doc.author?.toString(),
      multimediaId: doc.multimediaId,
      multimediaUrl: multimediaMap.get(doc.multimediaId?.toString())?.url || undefined,
      thumbnailUrl: multimediaMap.get(doc.multimediaId?.toString())?.thumbnailUrl || undefined,
      likesCount: Array.isArray(doc.likes) ? doc.likes.length : 0,
      shares: doc.shares || 0,
      views: doc.views || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  async getPostById(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).lean().exec();
    if (!post) throw new NotFoundException('Post not found');

    // fetch multimedia doc if present
    let multimediaDoc: any = undefined;
    if (post.multimediaId) {
      try {
        multimediaDoc = await this.multimediaModel.findById(post.multimediaId).select('_id url thumbnailUrl mimeType size width height duration status').lean().exec();
      } catch (_) { multimediaDoc = undefined }
    }

    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: post._id }).exec() } catch (_) { commentsCount = 0 }

    return {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      multimediaUrl: multimediaDoc?.url || undefined,
      thumbnailUrl: multimediaDoc?.thumbnailUrl || undefined,
      multimedia: multimediaDoc || undefined,
      likesCount: Array.isArray(post.likes) ? post.likes.length : 0,
      commentsCount,
      shares: post.shares || 0,
      views: post.views || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    }
  }

  async updatePost(postId: string, data: Partial<CreatePostDto>, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== actorId) throw new ForbiddenException('Not allowed');

    if (data.description !== undefined) post.description = data.description as any;
    if (data.type !== undefined) post.type = data.type as any;
    if ((data as any).multimediaId !== undefined) post.multimediaId = (data as any).multimediaId ? new Types.ObjectId((data as any).multimediaId) : undefined;

    await post.save();
    // attach multimedia urls and comments count for consistency with other endpoints
    let multimediaUrl: string | undefined = undefined
    let thumbnailUrl: string | undefined = undefined
    if (post.multimediaId) {
      try {
        const m = await this.multimediaModel.findById(post.multimediaId).select('_id url thumbnailUrl status').lean().exec()
        if (m) {
          multimediaUrl = m.url
          thumbnailUrl = m.thumbnailUrl
        }
      } catch (_) {}
    }

    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: post._id }).exec() } catch (_) {}

    const out = {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      multimediaUrl,
      thumbnailUrl,
      likesCount: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
      commentsCount,
      shares: (post as any).shares || 0,
      views: (post as any).views || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    };

    this.eventEmitter.emit('post.updated', out);
    return out;
  }

  async deletePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== actorId) throw new ForbiddenException('Not allowed');

    await this.feedModel.findByIdAndDelete(postId).exec();
    this.eventEmitter.emit('post.deleted', { _id: postId, author: actorId });
    return { success: true };
  }

  // Comments
  async addComment(dto: CreateCommentDto, authorId: string) {
    if (!authorId || !Types.ObjectId.isValid(authorId)) throw new BadRequestException('Invalid author');
    const author = await this.userService.getUserById(dto.authorId);
    if (!author) throw new NotFoundException('Author not found');

    const post = await this.feedModel.findById(dto.postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    const created = await this.commentModel.create({
      content: dto.content,
      author: new Types.ObjectId(authorId),
      post: new Types.ObjectId(dto.postId),
    });

    const out = {
      _id: created._id?.toString(),
      content: created.content,
      author: created.author?.toString(),
      post: created.post?.toString(),
      createdAt: (created as any).createdAt,
    };

    this.eventEmitter.emit('comment.created', out);
    return out;
  }

  async getCommentsForPost(postId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const comments = await this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .select('_id content author post createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return comments.map((c: any) => ({
      _id: c._id,
      content: c.content,
      author: c.author?.toString(),
      post: c.post?.toString(),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async deleteComment(commentId: string, actorId: string) {
    if (!commentId || !Types.ObjectId.isValid(commentId)) throw new BadRequestException('Invalid comment id');
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author.toString() !== actorId) throw new ForbiddenException('Not allowed');

    await this.commentModel.findByIdAndDelete(commentId).exec();
    this.eventEmitter.emit('comment.deleted', { _id: commentId, post: comment.post?.toString() });
    return { success: true };
  }

  // Likes
  async likePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    const actorObj = new Types.ObjectId(actorId);
    const exists = Array.isArray((post as any).likes) && (post as any).likes.find((l: any) => l.toString() === actorId);
    if (!exists) {
      (post as any).likes = (post as any).likes || [];
      (post as any).likes.push(actorObj);
      await post.save();
    }

    const multimediaDoc = post.multimediaId ? await this.multimediaModel.findById(post.multimediaId).select('_id url thumbnailUrl mimeType size width height duration status').lean().exec() : undefined;
    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: post._id }).exec() } catch (_) { commentsCount = 0 }

    const out = {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      multimediaUrl: multimediaDoc?.url || undefined,
      thumbnailUrl: multimediaDoc?.thumbnailUrl || undefined,
      multimedia: multimediaDoc || undefined,
      likesCount: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
      commentsCount,
      shares: (post as any).shares || 0,
      views: (post as any).views || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    };

    this.eventEmitter.emit('post.updated', out);
    return out;
  }

  async unlikePost(postId: string, actorId: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    if (!actorId || !Types.ObjectId.isValid(actorId)) throw new BadRequestException('Invalid actor id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    (post as any).likes = (post as any).likes || [];
    const before = (post as any).likes.length;
    (post as any).likes = (post as any).likes.filter((l: any) => l.toString() !== actorId);
    if ((post as any).likes.length !== before) {
      await post.save();
    }

    const multimediaDoc = post.multimediaId ? await this.multimediaModel.findById(post.multimediaId).select('_id url thumbnailUrl mimeType size width height duration status').lean().exec() : undefined;
    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: post._id }).exec() } catch (_) { commentsCount = 0 }

    const out = {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      multimediaUrl: multimediaDoc?.url || undefined,
      thumbnailUrl: multimediaDoc?.thumbnailUrl || undefined,
      multimedia: multimediaDoc || undefined,
      likesCount: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
      commentsCount,
      shares: (post as any).shares || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    };

    this.eventEmitter.emit('post.updated', out);
    return out;
  }

  async incrementView(postId: string, actorId?: string) {
    if (!postId || !Types.ObjectId.isValid(postId)) throw new BadRequestException('Invalid post id');
    const post = await this.feedModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    (post as any).views = ((post as any).views || 0) + 1;
    await post.save();

    const multimediaDoc = post.multimediaId ? await this.multimediaModel.findById(post.multimediaId).select('_id url thumbnailUrl mimeType size width height duration status').lean().exec() : undefined;
    let commentsCount = 0
    try { commentsCount = await this.commentModel.countDocuments({ post: post._id }).exec() } catch (_) { commentsCount = 0 }

    const out = {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      multimediaUrl: multimediaDoc?.url || undefined,
      thumbnailUrl: multimediaDoc?.thumbnailUrl || undefined,
      multimedia: multimediaDoc || undefined,
      likesCount: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
      commentsCount,
      shares: (post as any).shares || 0,
      views: (post as any).views || 0,
      createdAt: (post as any).createdAt,
      updatedAt: (post as any).updatedAt,
    };

    this.eventEmitter.emit('post.updated', out);
    return out;
  }
}
