/**
 * Create users DTO
 * Auto-generated from metadata
 */

export class CreateUsersDto {
  @ApiProperty({ type: 'string', minimum: null, maximum: null })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({ type: 'string', minimum: null, maximum: null })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ type: 'string', minimum: null, maximum: null })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ type: 'string', minimum: null, maximum: null })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ type: 'string', required: false, minimum: null, maximum: null })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ type: 'boolean', minimum: null, maximum: null })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
