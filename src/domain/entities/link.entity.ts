export class Link {
  constructor(
    public shortCode: string,
    public longUrl: string,
    public userId?: string,
    public expiresAt?: Date,
    public createdAt: Date = new Date(),
  ) {}
}
