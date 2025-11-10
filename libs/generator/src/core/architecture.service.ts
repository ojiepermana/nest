/**
 * Architecture Detection Service
 *
 * Detects and analyzes NestJS project architecture:
 * - Standalone: Single application
 * - Monorepo: Multiple applications and libraries
 * - Microservices: Distributed services with gateway pattern
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { Logger } from '../utils/logger.util';

export type ArchitectureType = 'standalone' | 'monorepo' | 'microservices';

export interface NestCliConfig {
  collection?: string;
  sourceRoot?: string;
  compilerOptions?: {
    webpack?: boolean;
    tsConfigPath?: string;
  };
  projects?: {
    [key: string]: {
      type: 'application' | 'library';
      root: string;
      entryFile?: string;
      sourceRoot?: string;
      compilerOptions?: {
        webpack?: boolean;
      };
    };
  };
}

export interface ProjectStructure {
  type: ArchitectureType;
  rootPath: string;
  apps: AppInfo[];
  libs: LibInfo[];
  gatewayApp?: string;
  nestCliConfig?: NestCliConfig;
}

export interface AppInfo {
  name: string;
  path: string;
  sourceRoot: string;
  type: 'application';
  isGateway?: boolean;
}

export interface LibInfo {
  name: string;
  path: string;
  sourceRoot: string;
  type: 'library';
}

export class ArchitectureDetectionService {
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  /**
   * Detect project architecture
   */
  async detect(): Promise<ProjectStructure> {
    Logger.info('Detecting project architecture...');

    try {
      // Check if nest-cli.json exists
      const nestCliPath = join(this.rootPath, 'nest-cli.json');
      const hasNestCli = existsSync(nestCliPath);

      if (!hasNestCli) {
        throw new Error(
          'nest-cli.json not found. This does not appear to be a NestJS project.',
        );
      }

      // Parse nest-cli.json
      const nestCliConfig = await this.parseNestCliConfig(nestCliPath);

      // Detect architecture type
      const type = this.detectArchitectureType(nestCliConfig);
      Logger.success(`Detected architecture: ${type}`);

      // Build project structure
      const structure: ProjectStructure = {
        type,
        rootPath: this.rootPath,
        apps: [],
        libs: [],
        nestCliConfig,
      };

      if (type === 'standalone') {
        structure.apps = await this.detectStandaloneApp(nestCliConfig);
      } else if (type === 'monorepo' || type === 'microservices') {
        const { apps, libs } =
          await this.detectMonorepoStructure(nestCliConfig);
        structure.apps = apps;
        structure.libs = libs;

        // Detect gateway for microservices
        if (type === 'microservices') {
          structure.gatewayApp = await this.detectGatewayApp(apps);
        }
      }

      Logger.success('Architecture detection completed');
      this.logStructure(structure);

      return structure;
    } catch (error) {
      Logger.error('Failed to detect architecture', error as Error);
      throw error;
    }
  }

  /**
   * Parse nest-cli.json configuration
   */
  private async parseNestCliConfig(configPath: string): Promise<NestCliConfig> {
    try {
      const content = await readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as NestCliConfig;
      Logger.debug('Parsed nest-cli.json configuration');
      return config;
    } catch (error) {
      Logger.error('Failed to parse nest-cli.json', error as Error);
      throw error;
    }
  }

  /**
   * Detect architecture type from nest-cli.json
   */
  private detectArchitectureType(config: NestCliConfig): ArchitectureType {
    // If has projects config, it's monorepo or microservices
    if (config.projects && Object.keys(config.projects).length > 0) {
      const apps = Object.values(config.projects).filter(
        (p) => p.type === 'application',
      );

      // If multiple apps, could be microservices
      if (apps.length > 1) {
        // Check if any app has microservice keywords in path
        const hasMicroservicePattern = apps.some(
          (app) =>
            app.root.includes('service') ||
            app.root.includes('gateway') ||
            app.root.includes('microservice'),
        );

        return hasMicroservicePattern ? 'microservices' : 'monorepo';
      }

      return 'monorepo';
    }

    // Single application
    return 'standalone';
  }

  /**
   * Detect standalone application structure
   */
  private async detectStandaloneApp(config: NestCliConfig): Promise<AppInfo[]> {
    const sourceRoot = config.sourceRoot || 'src';

    return [
      {
        name: 'main',
        path: this.rootPath,
        sourceRoot: join(this.rootPath, sourceRoot),
        type: 'application',
      },
    ];
  }

  /**
   * Detect monorepo structure (apps and libs)
   */
  private async detectMonorepoStructure(
    config: NestCliConfig,
  ): Promise<{ apps: AppInfo[]; libs: LibInfo[] }> {
    const apps: AppInfo[] = [];
    const libs: LibInfo[] = [];

    if (!config.projects) {
      return { apps, libs };
    }

    for (const [name, project] of Object.entries(config.projects)) {
      const projectPath = join(this.rootPath, project.root);
      const sourceRoot = project.sourceRoot
        ? join(this.rootPath, project.sourceRoot)
        : join(projectPath, 'src');

      if (project.type === 'application') {
        apps.push({
          name,
          path: projectPath,
          sourceRoot,
          type: 'application',
        });
      } else if (project.type === 'library') {
        libs.push({
          name,
          path: projectPath,
          sourceRoot,
          type: 'library',
        });
      }
    }

    Logger.info(
      `Found ${apps.length} applications and ${libs.length} libraries`,
    );
    return { apps, libs };
  }

  /**
   * Detect gateway application in microservices architecture
   */
  private async detectGatewayApp(apps: AppInfo[]): Promise<string | undefined> {
    // Look for app with "gateway" in name
    const gatewayByName = apps.find((app) =>
      app.name.toLowerCase().includes('gateway'),
    );

    if (gatewayByName) {
      Logger.info(`Detected gateway app by name: ${gatewayByName.name}`);
      return gatewayByName.name;
    }

    // Check if any app has @nestjs/microservices in gateway mode
    for (const app of apps) {
      const hasGatewayPattern = await this.checkForGatewayPattern(
        app.sourceRoot,
      );
      if (hasGatewayPattern) {
        Logger.info(`Detected gateway app by pattern: ${app.name}`);
        app.isGateway = true;
        return app.name;
      }
    }

    // If only one app, assume it's the gateway
    if (apps.length === 1) {
      Logger.warn('Only one app found, assuming it is the gateway');
      return apps[0].name;
    }

    Logger.warn('No gateway app detected');
    return undefined;
  }

  /**
   * Check if source contains gateway patterns
   */
  private async checkForGatewayPattern(sourceRoot: string): Promise<boolean> {
    try {
      const mainFilePath = join(sourceRoot, 'main.ts');
      if (!existsSync(mainFilePath)) {
        return false;
      }

      const content = await readFile(mainFilePath, 'utf-8');

      // Check for gateway patterns
      const hasClientProxy =
        content.includes('ClientProxy') || content.includes('ClientsModule');
      const hasExpressApp =
        content.includes('NestFactory.create') &&
        !content.includes('createMicroservice');
      const hasController = existsSync(join(sourceRoot, 'app.controller.ts'));

      return hasClientProxy && hasExpressApp && hasController;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get app directory for generated modules
   */
  getModulePath(structure: ProjectStructure, appName?: string): string {
    if (structure.type === 'standalone') {
      return join(structure.apps[0].sourceRoot, 'modules');
    }

    // For monorepo/microservices, need app name
    if (!appName) {
      // Default to first app or gateway
      appName = structure.gatewayApp || structure.apps[0]?.name;
    }

    const app = structure.apps.find((a) => a.name === appName);
    if (!app) {
      throw new Error(
        `Application "${appName}" not found in project structure`,
      );
    }

    return join(app.sourceRoot, 'modules');
  }

  /**
   * Log detected structure
   */
  private logStructure(structure: ProjectStructure): void {
    Logger.info('Project Structure:');
    Logger.info(`  Type: ${structure.type}`);
    Logger.info(`  Root: ${structure.rootPath}`);

    if (structure.apps.length > 0) {
      Logger.info(`  Applications (${structure.apps.length}):`);
      structure.apps.forEach((app) => {
        const gatewayFlag = app.isGateway ? ' [GATEWAY]' : '';
        Logger.info(`    - ${app.name}${gatewayFlag} (${app.path})`);
      });
    }

    if (structure.libs.length > 0) {
      Logger.info(`  Libraries (${structure.libs.length}):`);
      structure.libs.forEach((lib) => {
        Logger.info(`    - ${lib.name} (${lib.path})`);
      });
    }

    if (structure.gatewayApp) {
      Logger.info(`  Gateway: ${structure.gatewayApp}`);
    }
  }

  /**
   * Validate architecture for code generation
   */
  async validate(structure: ProjectStructure): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if apps exist
    if (structure.apps.length === 0) {
      errors.push('No applications found in project');
    }

    // Check if source roots exist
    for (const app of structure.apps) {
      if (!existsSync(app.sourceRoot)) {
        errors.push(
          `Application source root does not exist: ${app.sourceRoot}`,
        );
      }
    }

    for (const lib of structure.libs) {
      if (!existsSync(lib.sourceRoot)) {
        errors.push(`Library source root does not exist: ${lib.sourceRoot}`);
      }
    }

    // For microservices, validate gateway exists
    if (structure.type === 'microservices' && !structure.gatewayApp) {
      errors.push(
        'Microservices architecture detected but no gateway app found',
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
