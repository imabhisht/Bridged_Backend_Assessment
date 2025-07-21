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
    // Use lean() for better performance - returns plain JavaScript object
    const link = await this.linkModel.findOne({ shortCode }).lean().exec();
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
    // Use lean() and limit for better performance
    const links = await this.linkModel
      .find({ userId })
      .lean()
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .limit(1000) // Reasonable limit for user links
      .exec();
    
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
    // Use lean(), pagination, and sorting for better performance
    const links = await this.linkModel
      .find()
      .lean()
      .sort({ createdAt: -1 })
      .limit(10000) // Reasonable limit to prevent memory issues
      .exec();
    
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

  // Add pagination support for better performance
  async findAllPaginated(page: number = 1, limit: number = 100): Promise<{
    links: Link[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Use Promise.all for parallel execution
    const [links, total] = await Promise.all([
      this.linkModel
        .find()
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.linkModel.estimatedDocumentCount() // Faster than countDocuments for large collections
    ]);

    const mappedLinks = links.map(
      (link) =>
        new Link(
          link.shortCode,
          link.longUrl,
          link.userId,
          link.expiresAt,
          (link as any).createdAt
        )
    );

    return {
      links: mappedLinks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Bulk operations for high-volume scenarios
  async createBulk(links: Link[]): Promise<Link[]> {
    const createdLinks = await this.linkModel.insertMany(links, { 
      ordered: false // Continue on error
    });
    
    return createdLinks.map(link => new Link(
      link.shortCode,
      link.longUrl,
      link.userId,
      link.expiresAt,
      (link as any).createdAt
    ));
  }

  // Find multiple links by short codes efficiently
  async findByShortCodes(shortCodes: string[]): Promise<Link[]> {
    const links = await this.linkModel
      .find({ shortCode: { $in: shortCodes } })
      .lean()
      .exec();
    
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

  async delete(shortCode: string): Promise<void> {
    await this.linkModel.deleteOne({ shortCode }).exec();
  }
}
