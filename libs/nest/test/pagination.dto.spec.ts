import { PaginationDto } from '../src/common/pagination.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

describe('PaginationDto', () => {
  describe('Validation', () => {
    it('should accept valid pagination values', async () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 10 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should use default values when not provided', () => {
      const dto = new PaginationDto();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('should reject page less than 1', async () => {
      const dto = plainToClass(PaginationDto, { page: 0, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject page greater than 10000', async () => {
      const dto = plainToClass(PaginationDto, { page: 10001, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should reject limit less than 1', async () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject limit greater than 100', async () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should reject non-integer page values', async () => {
      const dto = plainToClass(PaginationDto, { page: 1.5, limit: 10 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-integer limit values', async () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 10.5 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Computed Properties', () => {
    it('should calculate correct offset', () => {
      const dto = plainToClass(PaginationDto, { page: 3, limit: 10 });
      expect(dto.offset).toBe(20);
    });

    it('should calculate offset for first page', () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 10 });
      expect(dto.offset).toBe(0);
    });

    it('should return correct take value', () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 25 });
      expect(dto.take).toBe(25);
    });

    it('should return correct skip value', () => {
      const dto = plainToClass(PaginationDto, { page: 5, limit: 20 });
      expect(dto.skip).toBe(80);
    });

    it('should handle edge case: last page', () => {
      const dto = plainToClass(PaginationDto, { page: 10000, limit: 100 });
      expect(dto.offset).toBe(999900);
    });
  });

  describe('Boundary Tests', () => {
    it('should accept minimum valid values', async () => {
      const dto = plainToClass(PaginationDto, { page: 1, limit: 1 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.offset).toBe(0);
    });

    it('should accept maximum valid values', async () => {
      const dto = plainToClass(PaginationDto, { page: 10000, limit: 100 });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.offset).toBe(999900);
    });
  });
});
