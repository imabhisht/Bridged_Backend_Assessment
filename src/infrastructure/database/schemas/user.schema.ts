import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ 
  timestamps: true,
  collection: 'users',
  versionKey: false
})
export class UserDocument extends Document {
  @Prop({ required: true, unique: true, index: true })
  username!: string;

  @Prop({ required: true })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Optimized indexes
UserSchema.index({ username: 1 }, { unique: true }); // Primary lookup
UserSchema.index({ createdAt: -1 }); // Recent users

// Disable auto-indexing in production
UserSchema.set('autoIndex', false);
