/**
 * Template Engine Service Tests
 */

import { TemplateEngineService } from './template-engine.service';
import { join } from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

jest.mock('fs');
jest.mock('fs/promises');

describe('TemplateEngineService', () => {
  let service: TemplateEngineService;
  const mockTemplateDir = '/test/templates';

  beforeEach(() => {
    service = new TemplateEngineService({ templateDir: mockTemplateDir });
    jest.clearAllMocks();
  });

  describe('loadHbsTemplate', () => {
    it('should load and compile Handlebars template', async () => {
      const templateContent = 'Hello {{name}}!';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const cached = await (service as any).loadHbsTemplate('greeting', mockTemplateDir);

      expect(cached.format).toBe('hbs');
      expect(typeof cached.template).toBe('function');
      expect(cached.template({ name: 'World' })).toBe('Hello World!');
    });

    it('should throw error when HBS file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        (service as any).loadHbsTemplate('nonexistent', mockTemplateDir),
      ).rejects.toThrow('HBS template not found');
    });
  });

  describe('render', () => {
    it('should render HBS template with data', async () => {
      const templateContent = 'User: {{pascalCase username}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('user', { username: 'john_doe' });

      expect(result).toBe('User: JohnDoe');
    });

    it('should enrich data with helper functions for mjs templates', async () => {
      const enriched = (service as any).enrichData({ name: 'test' });

      expect(typeof enriched.pascalCase).toBe('function');
      expect(typeof enriched.camelCase).toBe('function');
      expect(typeof enriched.snakeCase).toBe('function');
      expect(typeof enriched.kebabCase).toBe('function');
      expect(typeof enriched.upperCase).toBe('function');
      expect(typeof enriched.lowerCase).toBe('function');
      expect(enriched.name).toBe('test');
    });
  });

  describe('registerHelper', () => {
    it('should register custom Handlebars helper', async () => {
      service.registerHelper('double', (n: number) => n * 2);

      const templateContent = 'Result: {{double value}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('calc', { value: 5 });

      expect(result).toBe('Result: 10');
    });

    it('should register multiple helpers at once', async () => {
      service.registerHelpers({
        add: (a: number, b: number) => a + b,
        multiply: (a: number, b: number) => a * b,
      });

      const templateContent = 'Sum: {{add 2 3}}, Product: {{multiply 2 3}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('math', {});

      expect(result).toBe('Sum: 5, Product: 6');
    });
  });

  describe('clearCache', () => {
    it('should clear specific template from cache', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue('Template {{name}}');

      // Load template to cache it
      await service.render('test', { name: 'First' });

      // Clear cache
      service.clearCache('test');

      // Verify cache is empty for this template
      const stats = service.getCacheStats();
      const testEntries = stats.entries.filter((e) => e.name.includes('test'));
      expect(testEntries.length).toBe(0);
    });

    it('should clear all cache when no template specified', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue('Template');

      // Load multiple templates
      await service.render('test1', {});
      await service.render('test2', {});

      // Clear all cache
      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue('Template');

      await service.render('test', {});

      const stats = service.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.entries.length).toBeGreaterThan(0);
      expect(stats.entries[0]).toHaveProperty('name');
      expect(stats.entries[0]).toHaveProperty('format');
      expect(stats.entries[0]).toHaveProperty('age');
    });
  });

  describe('templateExists', () => {
    it('should return true when HBS template exists', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.template.hbs');
      });

      const exists = await service.templateExists('test', 'hbs');

      expect(exists).toBe(true);
    });

    it('should return true when MJS template exists', async () => {
      (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.template.mjs');
      });

      const exists = await service.templateExists('test', 'mjs');

      expect(exists).toBe(true);
    });

    it('should check both formats when format not specified', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const exists = await service.templateExists('test');

      expect(exists).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('default helpers', () => {
    it('should provide pascalCase helper', async () => {
      const templateContent = '{{pascalCase name}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('test', { name: 'hello_world' });

      expect(result).toBe('HelloWorld');
    });

    it('should provide camelCase helper', async () => {
      const templateContent = '{{camelCase name}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('test', { name: 'hello_world' });

      expect(result).toBe('helloWorld');
    });

    it('should provide comparison helpers', async () => {
      const templateContent = '{{#if (eq status "active")}}Active{{else}}Inactive{{/if}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('test', { status: 'active' });

      expect(result).toBe('Active');
    });

    it('should provide array helpers', async () => {
      const templateContent = 'Count: {{length items}}, First: {{first items}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('test', { items: ['a', 'b', 'c'] });

      expect(result).toBe('Count: 3, First: a');
    });

    it('should provide join helper', async () => {
      const templateContent = '{{join items ", "}}';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(templateContent);

      const result = await service.render('test', { items: ['a', 'b', 'c'] });

      expect(result).toBe('a, b, c');
    });
  });
});
