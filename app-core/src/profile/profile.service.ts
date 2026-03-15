import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { FeedAndMultimediaService } from 'src/feed-and-multimedia/feed-and-multimedia.service';
import { UserService } from 'src/user/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    private readonly storage: LocalStorageProvider,
    private readonly feedService: FeedAndMultimediaService,
    private readonly userService: UserService,
  ) {}

  async getByOwner(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc = await this.profileModel.findOne({ owner: new Types.ObjectId(userId) }).lean().exec();
    return doc;
  }

  // Public view for other users: expose only non-sensitive fields and counts
  async getPublicById(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const doc: any = await this.profileModel.findOne({ owner: new Types.ObjectId(userId) }).lean().exec();

    // Fetch user record to use as name/avatar fallback (in case profile doc has no firstName)
    let userFallback: any = null;
    try {
      userFallback = await this.userService.getUserById(userId);
    } catch (_) {}

    if (doc) {
      const publicView = {
        owner: doc.owner?.toString(),
        firstName: doc.firstName || userFallback?.firstName || undefined,
        lastName: doc.lastName || userFallback?.lastName || undefined,
        links: doc.links || [],
        gender: doc.gender,
        relationshipStatus: doc.relationshipStatus,
        interests: doc.interests || [],
        bio: doc.bio,
        likes: doc.likes || 0,
        profilePhotoUrl: doc.profilePhotoUrl || userFallback?.profilePhotoUrl || undefined,
        coverPhotoUrl: doc.coverPhotoUrl,
        followersCount: Array.isArray(doc.followers) ? doc.followers.length : 0,
        followingCount: Array.isArray(doc.following) ? doc.following.length : 0,
        createdAt: doc.createdAt,
      };
      return publicView;
    }

    // If no profile document exists, build a minimal public view from the User
    if (userFallback) {
      return {
        owner: userFallback._id?.toString(),
        firstName: userFallback.firstName || undefined,
        lastName: userFallback.lastName || undefined,
        links: [],
        gender: undefined,
        relationshipStatus: undefined,
        interests: [],
        bio: undefined,
        likes: 0,
        profilePhotoUrl: userFallback.profilePhotoUrl || undefined,
        coverPhotoUrl: undefined,
        followersCount: 0,
        followingCount: 0,
        createdAt: userFallback.createdAt,
      };
    }

    throw new NotFoundException('Profile not found');
  }

  // Public: get photos/videos posted by a given user (for profile media tab)
  async getPostsForProfile(userId: string, limit = 50) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const posts = await this.feedService.getPostsByAuthor(userId, limit);
    return posts;
  }

  /** Returns whether the current user follows the target profile owner. */
  async getFollowStatus(currentUserId: string, targetUserId: string): Promise<{ following: boolean }> {
    if (!currentUserId || !Types.ObjectId.isValid(currentUserId)) throw new BadRequestException('Invalid current user id');
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) throw new BadRequestException('Invalid target user id');
    const target = await this.profileModel.findOne({ owner: new Types.ObjectId(targetUserId) }).lean().exec();
    if (!target) throw new NotFoundException('Profile not found');
    const followers = (target as any).followers || [];
    const following = followers.some((id: Types.ObjectId) => id.toString() === currentUserId);
    return { following };
  }

  /** Adds current user as follower of target and adds target to current user's following. */
  async follow(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !Types.ObjectId.isValid(currentUserId)) throw new BadRequestException('Invalid current user id');
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) throw new BadRequestException('Invalid target user id');
    if (currentUserId === targetUserId) throw new BadRequestException('Cannot follow yourself');
    const currentOid = new Types.ObjectId(currentUserId);
    const targetOid = new Types.ObjectId(targetUserId);
    await this.profileModel.findOneAndUpdate(
      { owner: targetOid },
      { $addToSet: { followers: currentOid } },
      { upsert: true, new: true },
    ).exec();
    await this.profileModel.findOneAndUpdate(
      { owner: currentOid },
      { $addToSet: { following: targetOid } },
      { upsert: true, new: true },
    ).exec();
    const target = await this.profileModel.findOne({ owner: targetOid }).lean().exec();
    const followersCount = Array.isArray((target as any).followers) ? (target as any).followers.length : 0;
    return { following: true, followersCount };
  }

  /** Removes current user from target's followers and target from current user's following. */
  async unfollow(currentUserId: string, targetUserId: string) {
    if (!currentUserId || !Types.ObjectId.isValid(currentUserId)) throw new BadRequestException('Invalid current user id');
    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) throw new BadRequestException('Invalid target user id');
    const currentOid = new Types.ObjectId(currentUserId);
    const targetOid = new Types.ObjectId(targetUserId);
    await this.profileModel.findOneAndUpdate(
      { owner: targetOid },
      { $pull: { followers: currentOid } },
      { new: true },
    ).exec();
    await this.profileModel.findOneAndUpdate(
      { owner: currentOid },
      { $pull: { following: targetOid } },
      { new: true },
    ).exec();
    const target = await this.profileModel.findOne({ owner: targetOid }).lean().exec();
    const followersCount = target ? (Array.isArray((target as any).followers) ? (target as any).followers.length : 0) : 0;
    return { following: false, followersCount };
  }


  // Update profile
  async upsert(userId: string, dto: UpdateProfileDto) {
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');
    const data: any = { ...dto };
    const res = await this.profileModel.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, data, { upsert: true, new: true }).exec();
    return res;
  }

  // Uploads and processes profile or cover image. fieldName is ignored here; call-specific endpoints will update the correct property.
  async uploadImage(userId: string, file: Express.Multer.File, type: 'profile' | 'cover') {
    if (!file) throw new BadRequestException('File missing');
    if (!userId || !Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid user id');

    const baseKey = `${type}/${crypto.randomUUID()}-${file.originalname}`;

    // Optimize image and create thumbnail
    const tmpOptimized = await sharp(file.buffer).toBuffer();
    const thumbBuf = await sharp(file.buffer).resize({ width: 400 }).jpeg().toBuffer();

    // Upload optimized + thumbnail
    const uploadRes = await this.storage.upload(tmpOptimized, `final/${baseKey}`, file.mimetype);
    const thumbRes = await this.storage.upload(thumbBuf, `thumbs/${crypto.randomUUID()}-${file.originalname}`, 'image/jpeg');

    const publicUrl = uploadRes.url;

    const update: any = {};
    if (type === 'profile') update.profilePhotoUrl = publicUrl;
    if (type === 'cover') update.coverPhotoUrl = publicUrl;

    const profile = await this.profileModel.findOneAndUpdate({ owner: new Types.ObjectId(userId) }, { $set: update }, { upsert: true, new: true }).exec();

    return { profile, url: publicUrl, thumbnailUrl: thumbRes.url };
  }
}

export default {};
