import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  mediaUrls?: string[];
}
