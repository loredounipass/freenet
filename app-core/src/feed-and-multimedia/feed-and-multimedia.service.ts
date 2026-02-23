import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeedPost, FeedPostDocument } from './schemas/feed.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Multimedia, MultimediaDocument } from '../messages-and-multimedia/schemas/multimedia.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserService } from 'src/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeedAndMultimediaService {
  constructor(
    @InjectModel(FeedPost.name) private feedModel: Model<FeedPostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Multimedia.name) private multimediaModel: Model<MultimediaDocument>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

    const out = {
      _id: created._id?.toString(),
      description: created.description,
      type: created.type,
      author: created.author?.toString(),
      multimediaId: created.multimediaId,
      likesCount: Array.isArray((created as any).likes) ? (created as any).likes.length : 0,
      shares: (created as any).shares || 0,
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
      .select('_id description type author multimediaId likes shares createdAt updatedAt')
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
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
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
    const out = {
      _id: post._id?.toString(),
      description: post.description,
      type: post.type,
      author: post.author?.toString(),
      multimediaId: post.multimediaId,
      likesCount: Array.isArray((post as any).likes) ? (post as any).likes.length : 0,
      shares: (post as any).shares || 0,
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
}
