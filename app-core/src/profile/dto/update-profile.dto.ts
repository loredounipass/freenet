import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  links?: Array<{ label?: string; url: string }>;

  @IsOptional()
  @IsString()
  gender?: string;

  // Nombre similar a Facebook
  @IsOptional()
  @IsString()
  relationshipStatus?: string;

  @IsOptional()
  @IsArray()
  interests?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  likes?: number;
}
