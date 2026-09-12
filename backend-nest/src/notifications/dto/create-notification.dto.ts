import { IsEnum, IsString, MinLength } from 'class-validator';

export enum NotificationCategoryDto {
  NAVIGATION = 'NAVIGATION',
  ACCESS = 'ACCESS',
  HELP_SOS = 'HELP_SOS',
}

export class CreateNotificationDto {
  @IsEnum(NotificationCategoryDto)
  category: NotificationCategoryDto;

  @IsString()
  icon: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;
}
