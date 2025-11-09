/**
 * Architecture Detection Service Tests
 */

import { ArchitectureDetectionService } from './architecture.service';
import { join } from 'path';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('fs/promises');

describe('ArchitectureDetectionService', () => {
  let service: ArchitectureDetectionService;
  const mockRootPath = '/test/project';

  beforeEach(() => {
    service = new ArchitectureDetectionService(mockRootPath);
    jest.clearAllMocks();
  });

  describe('detectArchitectureType', () => {
    it('should detect standalone architecture when no projects defined', () => {
      const config = {
        sourceRoot: 'src',
      };

      const type = (service as any).detectArchitectureType(config);

      expect(type).toBe('standalone');
    });

    it('should detect monorepo architecture with single app', () => {
      const config = {
        projects: {
          app1: {
            type: 'application' as const,
            root: 'apps/app1',
          },
          lib1: {
            type: 'library' as const,
            root: 'libs/lib1',
          },
        },
      };

      const type = (service as any).detectArchitectureType(config);

      expect(type).toBe('monorepo');
    });

    it('should detect microservices architecture with multiple apps', () => {
      const config = {
        projects: {
          gateway: {
            type: 'application' as const,
            root: 'apps/gateway',
          },
          'user-service': {
            type: 'application' as const,
            root: 'apps/user-service',
          },
        },
      };

      const type = (service as any).detectArchitectureType(config);

      expect(type).toBe('microservices');
    });

    it('should detect monorepo when multiple apps without service pattern', () => {
      const config = {
        projects: {
          admin: {
            type: 'application' as const,
            root: 'apps/admin',
          },
          api: {
            type: 'application' as const,
            root: 'apps/api',
          },
        },
      };

      const type = (service as any).detectArchitectureType(config);

      expect(type).toBe('monorepo');
    });
  });

  describe('detectStandaloneApp', () => {
    it('should return main app with default source root', async () => {
      const config = {};

      const apps = await (service as any).detectStandaloneApp(config);

      expect(apps).toHaveLength(1);
      expect(apps[0]).toEqual({
        name: 'main',
        path: mockRootPath,
        sourceRoot: join(mockRootPath, 'src'),
        type: 'application',
      });
    });

    it('should use custom source root from config', async () => {
      const config = { sourceRoot: 'source' };

      const apps = await (service as any).detectStandaloneApp(config);

      expect(apps[0].sourceRoot).toBe(join(mockRootPath, 'source'));
    });
  });

  describe('detectMonorepoStructure', () => {
    it('should parse apps and libs from projects', async () => {
      const config = {
        projects: {
          app1: {
            type: 'application' as const,
            root: 'apps/app1',
            sourceRoot: 'apps/app1/src',
          },
          app2: {
            type: 'application' as const,
            root: 'apps/app2',
          },
          lib1: {
            type: 'library' as const,
            root: 'libs/lib1',
            sourceRoot: 'libs/lib1/src',
          },
        },
      };

      const { apps, libs } = await (service as any).detectMonorepoStructure(config);

      expect(apps).toHaveLength(2);
      expect(libs).toHaveLength(1);
      expect(apps[0].name).toBe('app1');
      expect(apps[1].name).toBe('app2');
      expect(libs[0].name).toBe('lib1');
    });

    it('should return empty arrays when no projects defined', async () => {
      const config = {};

      const { apps, libs } = await (service as any).detectMonorepoStructure(config);

      expect(apps).toHaveLength(0);
      expect(libs).toHaveLength(0);
    });
  });

  describe('detectGatewayApp', () => {
    it('should detect gateway by name', async () => {
      const apps = [
        {
          name: 'gateway',
          path: '/test/apps/gateway',
          sourceRoot: '/test/apps/gateway/src',
          type: 'application' as const,
        },
        {
          name: 'user-service',
          path: '/test/apps/user-service',
          sourceRoot: '/test/apps/user-service/src',
          type: 'application' as const,
        },
      ];

      const gateway = await (service as any).detectGatewayApp(apps);

      expect(gateway).toBe('gateway');
    });

    it('should return first app when only one exists', async () => {
      const apps = [
        {
          name: 'api',
          path: '/test/apps/api',
          sourceRoot: '/test/apps/api/src',
          type: 'application' as const,
        },
      ];

      const gateway = await (service as any).detectGatewayApp(apps);

      expect(gateway).toBe('api');
    });

    it('should return undefined when no gateway detected', async () => {
      const apps = [
        {
          name: 'app1',
          path: '/test/apps/app1',
          sourceRoot: '/test/apps/app1/src',
          type: 'application' as const,
        },
        {
          name: 'app2',
          path: '/test/apps/app2',
          sourceRoot: '/test/apps/app2/src',
          type: 'application' as const,
        },
      ];

      const gateway = await (service as any).detectGatewayApp(apps);

      expect(gateway).toBeUndefined();
    });
  });

  describe('getModulePath', () => {
    it('should return modules path for standalone app', () => {
      const structure = {
        type: 'standalone' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'main',
            path: mockRootPath,
            sourceRoot: join(mockRootPath, 'src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      const modulePath = service.getModulePath(structure);

      expect(modulePath).toBe(join(mockRootPath, 'src', 'modules'));
    });

    it('should return modules path for specified app in monorepo', () => {
      const structure = {
        type: 'monorepo' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'app1',
            path: join(mockRootPath, 'apps/app1'),
            sourceRoot: join(mockRootPath, 'apps/app1/src'),
            type: 'application' as const,
          },
          {
            name: 'app2',
            path: join(mockRootPath, 'apps/app2'),
            sourceRoot: join(mockRootPath, 'apps/app2/src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      const modulePath = service.getModulePath(structure, 'app2');

      expect(modulePath).toBe(join(mockRootPath, 'apps/app2/src', 'modules'));
    });

    it('should use gateway app when no app specified in microservices', () => {
      const structure = {
        type: 'microservices' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'gateway',
            path: join(mockRootPath, 'apps/gateway'),
            sourceRoot: join(mockRootPath, 'apps/gateway/src'),
            type: 'application' as const,
            isGateway: true,
          },
          {
            name: 'user-service',
            path: join(mockRootPath, 'apps/user-service'),
            sourceRoot: join(mockRootPath, 'apps/user-service/src'),
            type: 'application' as const,
          },
        ],
        libs: [],
        gatewayApp: 'gateway',
      };

      const modulePath = service.getModulePath(structure);

      expect(modulePath).toBe(join(mockRootPath, 'apps/gateway/src', 'modules'));
    });

    it('should throw error when app not found', () => {
      const structure = {
        type: 'monorepo' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'app1',
            path: join(mockRootPath, 'apps/app1'),
            sourceRoot: join(mockRootPath, 'apps/app1/src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      expect(() => service.getModulePath(structure, 'nonexistent')).toThrow(
        'Application "nonexistent" not found',
      );
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    it('should return valid for proper standalone structure', async () => {
      const structure = {
        type: 'standalone' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'main',
            path: mockRootPath,
            sourceRoot: join(mockRootPath, 'src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      const result = await service.validate(structure);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when no apps found', async () => {
      const structure = {
        type: 'standalone' as const,
        rootPath: mockRootPath,
        apps: [],
        libs: [],
      };

      const result = await service.validate(structure);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No applications found in project');
    });

    it('should return invalid when microservices has no gateway', async () => {
      const structure = {
        type: 'microservices' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'user-service',
            path: join(mockRootPath, 'apps/user-service'),
            sourceRoot: join(mockRootPath, 'apps/user-service/src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      const result = await service.validate(structure);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Microservices architecture detected but no gateway app found',
      );
    });

    it('should return invalid when source roots dont exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const structure = {
        type: 'standalone' as const,
        rootPath: mockRootPath,
        apps: [
          {
            name: 'main',
            path: mockRootPath,
            sourceRoot: join(mockRootPath, 'src'),
            type: 'application' as const,
          },
        ],
        libs: [],
      };

      const result = await service.validate(structure);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
