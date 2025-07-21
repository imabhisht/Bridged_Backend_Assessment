import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ 
  timestamps: true,
  collection: 'links',
  versionKey: false
})
export class LinkDocument extends Document {
  @Prop({ required: true, unique: true, index: true })
  shortCode!: string;

  @Prop({ required: true })
  longUrl!: string;

  @Prop({ index: true })
  userId?: string;

  @Prop({ index: true })
  expiresAt?: Date;
}

export const LinkSchema = SchemaFactory.createForClass(LinkDocument);

// Optimized indexes for high-volume operations
LinkSchema.index({ shortCode: 1 }, { unique: true }); // Primary lookup
LinkSchema.index({ userId: 1, createdAt: -1 }); // User's links with newest first
LinkSchema.index({ expiresAt: 1 }); // TTL cleanup queries
LinkSchema.index({ createdAt: -1 }); // Recent links queries

// TTL index for automatic cleanup of expired links
LinkSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0, // Remove immediately when expiresAt is reached
  partialFilterExpression: { expiresAt: { $exists: true } } // Only apply to docs with expiresAt
});

// Disable auto-indexing in production for better write performance
LinkSchema.set('autoIndex', false);
