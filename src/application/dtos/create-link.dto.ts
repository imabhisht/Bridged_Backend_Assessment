import { IsOptional, IsString, IsUrl, IsDateString } from "class-validator";

export class CreateLinkDto {
  @IsUrl()
  longUrl!: string;

  @IsOptional()
  @IsString()
  customShortCode?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
