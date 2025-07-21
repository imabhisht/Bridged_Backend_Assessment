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
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) return null;
    return new User((user._id as any).toString(), user.username, user.password, (user as any).createdAt);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;
    return new User((user._id as any).toString(), user.username, user.password, (user as any).createdAt);
  }

  async create(user: User): Promise<User> {
    const created = await this.userModel.create({ username: user.username, password: user.password });
    return new User((created._id as any).toString(), created.username, created.password, (created as any).createdAt);
  }
} 