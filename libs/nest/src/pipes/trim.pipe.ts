import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Trim pipe for string normalization
 * Trims whitespace from strings
 */
@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  }
}
