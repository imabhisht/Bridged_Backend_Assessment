import { Link } from "../entities/link.entity";

export interface LinkRepository {
  create(link: Link): Promise<Link>;
  findByShortCode(shortCode: string): Promise<Link | null>;
  findByUserId(userId: string): Promise<Link[]>;
}
