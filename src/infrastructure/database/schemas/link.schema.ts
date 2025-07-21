import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class LinkDocument extends Document {
  @Prop({ required: true, unique: true, index: true })
  shortCode!: string;

  @Prop({ required: true })
  longUrl!: string;

  @Prop({ index: true })
  userId?: string;

  @Prop()
  expiresAt?: Date;
}

export const LinkSchema = SchemaFactory.createForClass(LinkDocument);

// Indexes for performance
LinkSchema.index({ shortCode: 1 });
LinkSchema.index({ userId: 1 });
