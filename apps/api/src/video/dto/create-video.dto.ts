import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsInt()
  @IsNotEmpty()
  durationSeconds: number;

  @IsUUID()
  @IsOptional()
  skillId?: string;

  @IsUUID()
  @IsOptional()
  subskillId?: string;
}
