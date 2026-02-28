import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  owner: Types.ObjectId;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ type: [{ label: String, url: String }], default: [] })
  links: Array<{ label?: string; url: string }>;

  @Prop()
  gender: string;

  @Prop()
  relationshipStatus: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop()
  bio: string;

  // Arrays of user refs for followers / following
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  following: Types.ObjectId[];

  @Prop({ default: 0 })
  likes: number;

  @Prop()
  profilePhotoUrl?: string;

  @Prop()
  coverPhotoUrl?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
