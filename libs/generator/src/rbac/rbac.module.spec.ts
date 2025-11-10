import { RBACModule } from './rbac.module';

describe('RBACModule', () => {
  it('should be defined', () => {
    expect(RBACModule).toBeDefined();
  });

  it('should have register method', () => {
    expect(typeof RBACModule.register).toBe('function');
  });

  it('should have registerAsync method', () => {
    expect(typeof RBACModule.registerAsync).toBe('function');
  });

  it('should return DynamicModule from register', () => {
    const result = RBACModule.register({
      database: {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'test',
        password: 'test',
      },
    });
    expect(result.module).toBe(RBACModule);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();
  });

  it('should return DynamicModule from registerAsync', () => {
    const result = RBACModule.registerAsync({
      useFactory: () => ({
        database: {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'test',
          username: 'test',
          password: 'test',
        },
      }),
    });
    expect(result.module).toBe(RBACModule);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();
  });
});
