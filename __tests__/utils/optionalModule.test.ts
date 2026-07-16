import { loadOptionalModule } from '@/src/shared/utils/runtime/optionalModule';

type RequireLike = (moduleId: string) => unknown;
type GlobalWithRequire = typeof globalThis & { require?: RequireLike };

describe('loadOptionalModule', () => {
  const originalRequire = (globalThis as GlobalWithRequire).require;

  const restoreRequire = () => {
    if (typeof originalRequire === 'undefined') {
      Reflect.deleteProperty(globalThis as GlobalWithRequire, 'require');
      return;
    }

    Object.defineProperty(globalThis, 'require', {
      configurable: true,
      writable: true,
      value: originalRequire,
    });
  };

  beforeEach(() => {
    restoreRequire();
  });

  afterEach(() => {
    restoreRequire();
  });

  it('returns the resolved module when runtime require succeeds', () => {
    const fakeModule = { feature: 'enabled' };
    const runtimeRequire = jest.fn(() => fakeModule);

    Object.defineProperty(globalThis, 'require', {
      configurable: true,
      writable: true,
      value: runtimeRequire,
    });

    const result = loadOptionalModule<{ feature: string }>('demo-module');

    expect(runtimeRequire).toHaveBeenCalledWith('demo-module');
    expect(result).toEqual(fakeModule);
  });

  it('returns null when runtime require is unavailable', () => {
    Reflect.deleteProperty(globalThis as GlobalWithRequire, 'require');

    const result = loadOptionalModule('missing-module');

    expect(result).toBeNull();
  });

  it('returns null when runtime require throws', () => {
    const runtimeRequire = jest.fn(() => {
      throw new Error('module not found');
    });

    Object.defineProperty(globalThis, 'require', {
      configurable: true,
      writable: true,
      value: runtimeRequire,
    });

    const result = loadOptionalModule('bad-module');

    expect(runtimeRequire).toHaveBeenCalledWith('bad-module');
    expect(result).toBeNull();
  });
});
