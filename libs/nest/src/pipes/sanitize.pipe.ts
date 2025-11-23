import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Sanitize pipe for input sanitization
 * Prevents XSS attacks by sanitizing HTML
 *
 * NOTE: Requires 'isomorphic-dompurify' package to be installed:
 * npm install isomorphic-dompurify
 *
 * If not installed, this pipe will simply return the value unchanged.
 */
@Injectable()
export class SanitizePipe implements PipeTransform<string, string> {
  private DOMPurify: any;

  constructor() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.DOMPurify = require('isomorphic-dompurify');
    } catch {
      // DOMPurify not installed, sanitization will be skipped
      this.DOMPurify = null;
    }
  }

  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value !== 'string') {
      return value;
    }

    if (!this.DOMPurify) {
      console.warn(
        'SanitizePipe: isomorphic-dompurify not installed. Sanitization skipped. Install with: npm install isomorphic-dompurify',
      );
      return value;
    }

    return this.DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  }
}
