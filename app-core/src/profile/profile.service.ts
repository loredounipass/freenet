import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LocalStorageProvider } from '../storage/local.storage.provider';
import sharp from 'sharp';
import * as crypto from 'crypto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    private readonly storage: LocalStorageProvider,
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
    if (!doc) throw new NotFoundException('Profile not found');

    const publicView = {
      owner: doc.owner?.toString(),
      firstName: doc.firstName,
      lastName: doc.lastName,
      links: doc.links || [],
      gender: doc.gender,
      relationshipStatus: doc.relationshipStatus,
      interests: doc.interests || [],
      bio: doc.bio,
      likes: doc.likes || 0,
      profilePhotoUrl: doc.profilePhotoUrl,
      coverPhotoUrl: doc.coverPhotoUrl,
      followersCount: Array.isArray(doc.followers) ? doc.followers.length : 0,
      followingCount: Array.isArray(doc.following) ? doc.following.length : 0,
      createdAt: doc.createdAt,
    };

    return publicView;
  }

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
