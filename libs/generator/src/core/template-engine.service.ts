/**
 * Template Engine Service
 *
 * Supports both Handlebars (.hbs) and ES Module (.mjs) templates
 * Provides template loading, caching, and rendering
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import * as Handlebars from 'handlebars';
import { Logger } from '../utils/logger.util';
import { pascalCase, camelCase, snakeCase, kebabCase } from '../utils/string.util';

export type TemplateFormat = 'mjs' | 'hbs' | 'auto';

export interface TemplateData {
  [key: string]: any;
}

export interface TemplateOptions {
  format?: TemplateFormat;
  customHelpers?: Record<string, (...args: any[]) => any>;
  templateDir?: string;
}

interface CachedTemplate {
  format: 'mjs' | 'hbs';
  template: ((data: any) => string) | HandlebarsTemplateDelegate;
  timestamp: number;
}

export class TemplateEngineService {
  private templateCache: Map<string, CachedTemplate> = new Map();
  private handlebarsInstance: typeof Handlebars;
  private readonly defaultTemplateDir: string;
  private readonly cacheTTL: number;

  constructor(options?: {
    templateDir?: string;
    cacheTTL?: number;
    enableCache?: boolean;
  }) {
    this.defaultTemplateDir = options?.templateDir || join(__dirname, '../templates');
    this.cacheTTL = options?.cacheTTL || 3600000; // 1 hour default
    this.handlebarsInstance = Handlebars.create();

    // Register default helpers
    this.registerDefaultHelpers();
  }

  /**
   * Register default Handlebars helpers
   */
  private registerDefaultHelpers(): void {
    // String transformation helpers
    this.handlebarsInstance.registerHelper('pascalCase', (str: string) => pascalCase(str));
    this.handlebarsInstance.registerHelper('camelCase', (str: string) => camelCase(str));
    this.handlebarsInstance.registerHelper('snakeCase', (str: string) => snakeCase(str));
    this.handlebarsInstance.registerHelper('kebabCase', (str: string) => kebabCase(str));
    this.handlebarsInstance.registerHelper('upperCase', (str: string) => str.toUpperCase());
    this.handlebarsInstance.registerHelper('lowerCase', (str: string) => str.toLowerCase());

    // Comparison helpers
    this.handlebarsInstance.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebarsInstance.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebarsInstance.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebarsInstance.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebarsInstance.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebarsInstance.registerHelper('lte', (a: number, b: number) => a <= b);

    // Logical helpers
    this.handlebarsInstance.registerHelper('and', (...args: any[]) => {
      const values = args.slice(0, -1); // Remove options object
      return values.every((v) => !!v);
    });
    this.handlebarsInstance.registerHelper('or', (...args: any[]) => {
      const values = args.slice(0, -1); // Remove options object
      return values.some((v) => !!v);
    });
    this.handlebarsInstance.registerHelper('not', (value: any) => !value);

    // Array/Collection helpers
    this.handlebarsInstance.registerHelper('length', (array: any[]) => array?.length || 0);
    this.handlebarsInstance.registerHelper('isEmpty', (array: any[]) => !array || array.length === 0);
    this.handlebarsInstance.registerHelper('isNotEmpty', (array: any[]) => array && array.length > 0);
    this.handlebarsInstance.registerHelper('first', (array: any[]) => array?.[0]);
    this.handlebarsInstance.registerHelper('last', (array: any[]) => array?.[array.length - 1]);

    // Join helper for arrays
    this.handlebarsInstance.registerHelper('join', (array: any[], separator: string) => {
      return array?.join(separator || ', ') || '';
    });

    // Conditional helper
    this.handlebarsInstance.registerHelper('if_eq', function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    Logger.debug('Registered default Handlebars helpers');
  }

  /**
   * Register custom helper
   */
  registerHelper(name: string, fn: (...args: any[]) => any): void {
    this.handlebarsInstance.registerHelper(name, fn);
    Logger.debug(`Registered custom helper: ${name}`);
  }

  /**
   * Register multiple custom helpers
   */
  registerHelpers(helpers: Record<string, (...args: any[]) => any>): void {
    Object.entries(helpers).forEach(([name, fn]) => {
      this.registerHelper(name, fn);
    });
  }

  /**
   * Load template file (auto-detect format or use specified)
   */
  async loadTemplate(
    templateName: string,
    options?: TemplateOptions,
  ): Promise<CachedTemplate> {
    const format = options?.format || 'auto';
    const templateDir = options?.templateDir || this.defaultTemplateDir;
    const cacheKey = `${templateDir}:${templateName}:${format}`;

    // Check cache
    const cached = this.templateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      Logger.debug(`Template cache hit: ${templateName}`);
      return cached;
    }

    // Load template
    let template: CachedTemplate;

    if (format === 'auto') {
      // Try .mjs first, then .hbs
      template = await this.loadTemplateAutoDetect(templateName, templateDir);
    } else if (format === 'mjs') {
      template = await this.loadMjsTemplate(templateName, templateDir);
    } else {
      template = await this.loadHbsTemplate(templateName, templateDir);
    }

    // Cache template
    this.templateCache.set(cacheKey, template);
    Logger.debug(`Template loaded and cached: ${templateName} (${template.format})`);

    return template;
  }

  /**
   * Auto-detect template format (.mjs priority, .hbs fallback)
   */
  private async loadTemplateAutoDetect(
    templateName: string,
    templateDir: string,
  ): Promise<CachedTemplate> {
    // Try .mjs first
    try {
      return await this.loadMjsTemplate(templateName, templateDir);
    } catch (mjsError) {
      Logger.debug(`MJS template not found: ${templateName}.mjs, trying HBS...`);

      // Fallback to .hbs
      try {
        return await this.loadHbsTemplate(templateName, templateDir);
      } catch (hbsError) {
        throw new Error(
          `Template not found: ${templateName} (tried .mjs and .hbs in ${templateDir})`,
        );
      }
    }
  }

  /**
   * Load ES Module (.mjs) template
   */
  private async loadMjsTemplate(
    templateName: string,
    templateDir: string,
  ): Promise<CachedTemplate> {
    const templatePath = join(templateDir, `${templateName}.template.mjs`);

    if (!existsSync(templatePath)) {
      throw new Error(`MJS template not found: ${templatePath}`);
    }

    try {
      // Dynamic import for .mjs
      const module = await import(templatePath);
      const templateFn = module.default;

      if (typeof templateFn !== 'function') {
        throw new Error(`MJS template must export default function: ${templateName}`);
      }

      return {
        format: 'mjs',
        template: templateFn,
        timestamp: Date.now(),
      };
    } catch (error) {
      Logger.error(`Failed to load MJS template: ${templateName}`, error as Error);
      throw error;
    }
  }

  /**
   * Load Handlebars (.hbs) template
   */
  private async loadHbsTemplate(
    templateName: string,
    templateDir: string,
  ): Promise<CachedTemplate> {
    const templatePath = join(templateDir, `${templateName}.template.hbs`);

    if (!existsSync(templatePath)) {
      throw new Error(`HBS template not found: ${templatePath}`);
    }

    try {
      const content = await readFile(templatePath, 'utf-8');
      const compiled = this.handlebarsInstance.compile(content);

      return {
        format: 'hbs',
        template: compiled,
        timestamp: Date.now(),
      };
    } catch (error) {
      Logger.error(`Failed to load HBS template: ${templateName}`, error as Error);
      throw error;
    }
  }

  /**
   * Render template with data
   */
  async render(
    templateName: string,
    data: TemplateData,
    options?: TemplateOptions,
  ): Promise<string> {
    try {
      // Register custom helpers if provided
      if (options?.customHelpers) {
        this.registerHelpers(options.customHelpers);
      }

      // Load template
      const cachedTemplate = await this.loadTemplate(templateName, options);

      // Prepare data with helper functions
      const enrichedData = this.enrichData(data);

      // Render based on format
      let result: string;
      if (cachedTemplate.format === 'mjs') {
        result = cachedTemplate.template(enrichedData);
      } else {
        result = (cachedTemplate.template as HandlebarsTemplateDelegate)(enrichedData);
      }

      Logger.debug(`Template rendered: ${templateName}`);
      return result;
    } catch (error) {
      Logger.error(`Failed to render template: ${templateName}`, error as Error);
      throw error;
    }
  }

  /**
   * Enrich data with helper functions for .mjs templates
   */
  private enrichData(data: TemplateData): TemplateData {
    return {
      ...data,
      // String transformation helpers
      pascalCase,
      camelCase,
      snakeCase,
      kebabCase,
      upperCase: (str: string) => str.toUpperCase(),
      lowerCase: (str: string) => str.toLowerCase(),

      // Utility helpers
      join: (array: any[], separator: string = ', ') => array?.join(separator) || '',
      isEmpty: (value: any) => !value || (Array.isArray(value) && value.length === 0),
      isNotEmpty: (value: any) => !!value && (!Array.isArray(value) || value.length > 0),
    };
  }

  /**
   * Clear template cache
   */
  clearCache(templateName?: string): void {
    if (templateName) {
      // Clear specific template (all formats)
      const keys = Array.from(this.templateCache.keys()).filter((k) =>
        k.includes(templateName),
      );
      keys.forEach((k) => this.templateCache.delete(k));
      Logger.debug(`Cache cleared for template: ${templateName}`);
    } else {
      // Clear all cache
      this.templateCache.clear();
      Logger.debug('All template cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: { name: string; format: string; age: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.templateCache.entries()).map(([key, cached]) => ({
      name: key,
      format: cached.format,
      age: now - cached.timestamp,
    }));

    return {
      size: this.templateCache.size,
      entries,
    };
  }

  /**
   * Check if template exists
   */
  async templateExists(templateName: string, format?: 'mjs' | 'hbs'): Promise<boolean> {
    const templateDir = this.defaultTemplateDir;

    if (format) {
      const ext = format === 'mjs' ? '.template.mjs' : '.template.hbs';
      return existsSync(join(templateDir, `${templateName}${ext}`));
    }

    // Check both formats
    const mjsExists = existsSync(join(templateDir, `${templateName}.template.mjs`));
    const hbsExists = existsSync(join(templateDir, `${templateName}.template.hbs`));

    return mjsExists || hbsExists;
  }
}
