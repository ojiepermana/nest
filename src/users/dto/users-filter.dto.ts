/**
 * Filter users DTO
 * Auto-generated from metadata
 * Supports query operators: _eq, _ne, _gt, _gte, _lt, _lte, _like, _in, _between, _null
 */

export class FilterUsersDto {
  /**
   * Equal to
   */
  @ApiProperty({ description: 'Equal to', required: false, type: 'string' })
  @IsOptional()
  username_eq?: string;

  /**
   * Not equal to
   */
  @ApiProperty({ description: 'Not equal to', required: false, type: 'string' })
  @IsOptional()
  username_ne?: string;

  /**
   * Greater than
   */
  @ApiProperty({ description: 'Greater than', required: false, type: 'string' })
  @IsOptional()
  username_gt?: string;

  /**
   * Greater than or equal
   */
  @ApiProperty({ description: 'Greater than or equal', required: false, type: 'string' })
  @IsOptional()
  username_gte?: string;

  /**
   * Less than
   */
  @ApiProperty({ description: 'Less than', required: false, type: 'string' })
  @IsOptional()
  username_lt?: string;

  /**
   * Less than or equal
   */
  @ApiProperty({ description: 'Less than or equal', required: false, type: 'string' })
  @IsOptional()
  username_lte?: string;

  /**
   * Pattern match
   */
  @ApiProperty({ description: 'Pattern match', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  username_like?: string;

  /**
   * In array
   */
  @ApiProperty({ description: 'In array', required: false, type: 'string[]' })
  @IsOptional()
  @IsArray()
  username_in?: string[];

  /**
   * Between two values
   */
  @ApiProperty({ description: 'Between two values', required: false, type: '[string, string]' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  username_between?: [string, string];

  /**
   * Is null/not null
   */
  @ApiProperty({ description: 'Is null/not null', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  username_null?: boolean;

  /**
   * Equal to
   */
  @ApiProperty({ description: 'Equal to', required: false, type: 'string' })
  @IsOptional()
  email_eq?: string;

  /**
   * Not equal to
   */
  @ApiProperty({ description: 'Not equal to', required: false, type: 'string' })
  @IsOptional()
  email_ne?: string;

  /**
   * Greater than
   */
  @ApiProperty({ description: 'Greater than', required: false, type: 'string' })
  @IsOptional()
  email_gt?: string;

  /**
   * Greater than or equal
   */
  @ApiProperty({ description: 'Greater than or equal', required: false, type: 'string' })
  @IsOptional()
  email_gte?: string;

  /**
   * Less than
   */
  @ApiProperty({ description: 'Less than', required: false, type: 'string' })
  @IsOptional()
  email_lt?: string;

  /**
   * Less than or equal
   */
  @ApiProperty({ description: 'Less than or equal', required: false, type: 'string' })
  @IsOptional()
  email_lte?: string;

  /**
   * Pattern match
   */
  @ApiProperty({ description: 'Pattern match', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  email_like?: string;

  /**
   * In array
   */
  @ApiProperty({ description: 'In array', required: false, type: 'string[]' })
  @IsOptional()
  @IsArray()
  email_in?: string[];

  /**
   * Between two values
   */
  @ApiProperty({ description: 'Between two values', required: false, type: '[string, string]' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  email_between?: [string, string];

  /**
   * Is null/not null
   */
  @ApiProperty({ description: 'Is null/not null', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  email_null?: boolean;

  /**
   * Equal to
   */
  @ApiProperty({ description: 'Equal to', required: false, type: 'boolean' })
  @IsOptional()
  isActive_eq?: boolean;

  /**
   * Not equal to
   */
  @ApiProperty({ description: 'Not equal to', required: false, type: 'boolean' })
  @IsOptional()
  isActive_ne?: boolean;

  /**
   * Greater than
   */
  @ApiProperty({ description: 'Greater than', required: false, type: 'boolean' })
  @IsOptional()
  isActive_gt?: boolean;

  /**
   * Greater than or equal
   */
  @ApiProperty({ description: 'Greater than or equal', required: false, type: 'boolean' })
  @IsOptional()
  isActive_gte?: boolean;

  /**
   * Less than
   */
  @ApiProperty({ description: 'Less than', required: false, type: 'boolean' })
  @IsOptional()
  isActive_lt?: boolean;

  /**
   * Less than or equal
   */
  @ApiProperty({ description: 'Less than or equal', required: false, type: 'boolean' })
  @IsOptional()
  isActive_lte?: boolean;

  /**
   * Pattern match
   */
  @ApiProperty({ description: 'Pattern match', required: false, type: 'string' })
  @IsOptional()
  @IsString()
  isActive_like?: string;

  /**
   * In array
   */
  @ApiProperty({ description: 'In array', required: false, type: 'boolean[]' })
  @IsOptional()
  @IsArray()
  isActive_in?: boolean[];

  /**
   * Between two values
   */
  @ApiProperty({ description: 'Between two values', required: false, type: '[boolean, boolean]' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  isActive_between?: [boolean, boolean];

  /**
   * Is null/not null
   */
  @ApiProperty({ description: 'Is null/not null', required: false, type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  isActive_null?: boolean;
}
