import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/interfaces/user-repository.interface";
import { UserDocument } from "../database/schemas/user.schema";

@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(@InjectModel("User") private userModel: Model<UserDocument>) {}

  async findByUsername(username: string): Promise<User | null> {
    // Use lean() for better performance and select only needed fields
    const user = await this.userModel
      .findOne({ username })
      .lean()
      .select('_id username password createdAt')
      .exec();
    
    if (!user) return null;
    return new User(
      (user._id as any).toString(), 
      user.username, 
      user.password, 
      (user as any).createdAt
    );
  }

  async findById(id: string): Promise<User | null> {
    // Use lean() for better performance and select only needed fields
    const user = await this.userModel
      .findById(id)
      .lean()
      .select('_id username password createdAt')
      .exec();
    
    if (!user) return null;
    return new User(
      (user._id as any).toString(), 
      user.username, 
      user.password, 
      (user as any).createdAt
    );
  }

  async create(user: User): Promise<User> {
    const created = await this.userModel.create({ 
      username: user.username, 
      password: user.password 
    });
    return new User(
      (created._id as any).toString(), 
      created.username, 
      created.password, 
      (created as any).createdAt
    );
  }

  // Batch user lookup for better performance
  async findByIds(ids: string[]): Promise<User[]> {
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .lean()
      .select('_id username password createdAt')
      .exec();
    
    return users.map(user => new User(
      (user._id as any).toString(),
      user.username,
      user.password,
      (user as any).createdAt
    ));
  }

  // Check if username exists without returning full user data
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.userModel
      .countDocuments({ username })
      .limit(1)
      .exec();
    return count > 0;
  }
} 