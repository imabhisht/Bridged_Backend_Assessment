import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ 
  timestamps: true,
  // Optimize for high-volume writes
  collection: 'analytics',
  // Enable sharding key if using MongoDB sharding
  versionKey: false
})
export class AnalyticsDocument extends Document {
  @Prop({ required: true, index: true })
  shortCode!: string;

  @Prop({ required: true, index: true })
  timestamp!: Date;

  @Prop({ index: true })
  referrer?: string;

  @Prop()
  ipAddress?: string;

  @Prop({ index: true })
  country?: string;

  @Prop()
  userAgent?: string;
}

export const AnalyticsSchema = SchemaFactory.createForClass(AnalyticsDocument);

// Compound indexes for performance optimization
AnalyticsSchema.index({ shortCode: 1, timestamp: -1 }); // Primary query pattern
AnalyticsSchema.index({ shortCode: 1, country: 1 }); // Country stats
AnalyticsSchema.index({ shortCode: 1, referrer: 1 }); // Referrer stats
AnalyticsSchema.index({ timestamp: -1 }); // Time-based queries
AnalyticsSchema.index({ shortCode: 1, timestamp: -1, country: 1 }); // Complex analytics

// TTL index for automatic data expiration (optional - remove old analytics data)
// AnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

// Enable compression for storage efficiency
AnalyticsSchema.set('autoIndex', false); // Disable in production for better performance
