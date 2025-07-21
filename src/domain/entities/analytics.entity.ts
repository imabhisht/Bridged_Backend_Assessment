export class Analytics {
  constructor(
    public shortCode: string,
    public timestamp: Date,
    public referrer: string,
    public ipAddress?: string,
    public country?: string,
    public userAgent?: string
  ) {}
}
