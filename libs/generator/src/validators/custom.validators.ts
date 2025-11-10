/**
 * Custom Validators
 *
 * Custom class-validator decorators for enhanced validation
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * IsSafeString Validator
 * Validates that string doesn't contain SQL injection patterns
 */
@ValidatorConstraint({ name: 'isSafeString', async: false })
export class IsSafeStringConstraint implements ValidatorConstraintInterface {
  private readonly UNSAFE_PATTERNS = [
    /--/,
    /;/,
    /\/\*/,
    /\*\//,
    /xp_/i,
    /sp_/i,
    /exec/i,
    /execute/i,
    /drop/i,
    /delete.*from/i,
    /insert.*into/i,
    /update.*set/i,
    /union.*select/i,
  ];

  validate(text: string, args: ValidationArguments): boolean {
    if (!text || typeof text !== 'string') {
      return true; // Let @IsString handle this
    }

    // Check for unsafe patterns
    return !this.UNSAFE_PATTERNS.some((pattern) => pattern.test(text));
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains potentially unsafe characters`;
  }
}

export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeStringConstraint,
    });
  };
}

/**
 * IsUnique Validator (to be implemented with database check)
 * Validates that a value is unique in the database
 */
@ValidatorConstraint({ name: 'isUnique', async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    // This should be implemented with actual database check
    // For now, always return true
    // TODO: Implement database uniqueness check
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be unique`;
  }
}

export function IsUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueConstraint,
    });
  };
}

/**
 * IsStrongPassword Validator
 * Validates password strength
 */
@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // At least 8 characters
    if (password.length < 8) return false;

    // Must contain uppercase
    if (!/[A-Z]/.test(password)) return false;

    // Must contain lowercase
    if (!/[a-z]/.test(password)) return false;

    // Must contain number
    if (!/[0-9]/.test(password)) return false;

    // Must contain special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be at least 8 characters and contain uppercase, lowercase, number and special character`;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

/**
 * IsValidIdentifier Validator
 * Validates SQL identifiers (table names, column names)
 */
@ValidatorConstraint({ name: 'isValidIdentifier', async: false })
export class IsValidIdentifierConstraint implements ValidatorConstraintInterface {
  private readonly IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  validate(identifier: string, args: ValidationArguments): boolean {
    if (!identifier || typeof identifier !== 'string') {
      return false;
    }

    return this.IDENTIFIER_PATTERN.test(identifier) && identifier.length <= 63;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid identifier (alphanumeric and underscore, max 63 chars)`;
  }
}

export function IsValidIdentifier(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidIdentifierConstraint,
    });
  };
}
