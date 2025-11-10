/**
 * Update users DTO
 * Auto-generated from metadata
 * All fields are optional for partial updates
 */

export class UpdateUsersDto {
  @ApiProperty({ required: false, type: 'string', minimum: null, maximum: null })
  @IsOptional()
  @IsString()
  @IsUUID()
  id?: string;

  @ApiProperty({ required: false, type: 'string', minimum: null, maximum: null })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, type: 'string', minimum: null, maximum: null })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, type: 'string', minimum: null, maximum: null })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ type: 'string', required: false, minimum: null, maximum: null })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false, type: 'boolean', minimum: null, maximum: null })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
