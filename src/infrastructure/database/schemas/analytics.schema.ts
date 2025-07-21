import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class AnalyticsDocument extends Document {
  @Prop({ required: true, index: true })
  shortCode!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop()
  referrer?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  country?: string;

  @Prop()
  userAgent?: string;
}

export const AnalyticsSchema = SchemaFactory.createForClass(AnalyticsDocument);

// Indexes for performance
AnalyticsSchema.index({ shortCode: 1, timestamp: -1 });
