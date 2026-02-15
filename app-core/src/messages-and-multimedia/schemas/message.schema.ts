import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop()
  content: string;

  @Prop({ enum: ['text', 'image', 'video', 'audio'], default: 'text' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Multimedia' })
  multimediaId?: Types.ObjectId;

  @Prop({ enum: ['uploading', 'processing', 'ready', 'failed'], required: false })
  multimediaStatus?: string;

  @Prop({ enum: ['sent', 'delivered', 'read'], default: 'sent' })
  status: string;

  _id?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Compound index to support common queries and sort by latest messages
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Additional single-side indexes to allow efficient queries for either side
MessageSchema.index({ receiver: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

// Optional: lean-friendly transform
MessageSchema.set('toJSON', {
  transform: function (doc: any, ret: any) {
    ret._id = ret._id?.toString();
    delete ret.__v;
  },
});
