import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Link } from "../../domain/entities/link.entity";
import { LinkRepository } from "../../domain/interfaces/link-repository.interface";
import { LinkDocument } from "../database/schemas/link.schema";

@Injectable()
export class LinkMongoRepository implements LinkRepository {
  constructor(@InjectModel("Link") private linkModel: Model<LinkDocument>) {}

  async create(link: Link): Promise<Link> {
    const createdLink = await this.linkModel.create(link);
    return new Link(
      createdLink.shortCode,
      createdLink.longUrl,
      createdLink.userId,
      createdLink.expiresAt,
      (createdLink as any).createdAt
    );
  }

  async findByShortCode(shortCode: string): Promise<Link | null> {
    const link = await this.linkModel.findOne({ shortCode }).exec();
    if (!link) return null;
    return new Link(
      link.shortCode,
      link.longUrl,
      link.userId,
      link.expiresAt,
      (link as any).createdAt
    );
  }

  async findByUserId(userId: string): Promise<Link[]> {
    const links = await this.linkModel.find({ userId }).exec();
    return links.map(
      (link) =>
        new Link(
          link.shortCode,
          link.longUrl,
          link.userId,
          link.expiresAt,
          (link as any).createdAt
        )
    );
  }

  async findAll(): Promise<Link[]> {
    const links = await this.linkModel.find().exec();
    return links.map(
      (link) =>
        new Link(
          link.shortCode,
          link.longUrl,
          link.userId,
          link.expiresAt,
          (link as any).createdAt
        )
    );
  }
}
