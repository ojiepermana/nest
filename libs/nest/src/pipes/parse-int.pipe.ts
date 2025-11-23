import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Parse integer pipe with safe validation
 * Validates and converts string to integer
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(
    private readonly options: {
      min?: number;
      max?: number;
      optional?: boolean;
    } = {},
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (this.options.optional && (value === undefined || value === null)) {
      return undefined as any;
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(`${metadata.data || 'Value'} must be a valid integer`);
    }

    if (this.options.min !== undefined && val < this.options.min) {
      throw new BadRequestException(
        `${metadata.data || 'Value'} must be at least ${this.options.min}`,
      );
    }

    if (this.options.max !== undefined && val > this.options.max) {
      throw new BadRequestException(
        `${metadata.data || 'Value'} must not exceed ${this.options.max}`,
      );
    }

    return val;
  }
}
