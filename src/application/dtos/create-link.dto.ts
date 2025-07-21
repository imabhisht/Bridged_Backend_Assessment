import { IsOptional, IsString, IsUrl } from "class-validator";

export class CreateLinkDto {
  @IsUrl()
  longUrl!: string;

  @IsOptional()
  @IsString()
  customShortCode?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
