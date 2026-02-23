import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FeedPost', required: true })
  post: Types.ObjectId;

  _id?: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ post: 1, createdAt: -1 });

CommentSchema.set('toJSON', {
  transform: function (doc: any, ret: any) {
    ret._id = ret._id?.toString();
    delete ret.__v;
  },
});
