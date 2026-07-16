type RuntimeRequire = (moduleId: string) => unknown;

interface RequireCapableGlobal {
  require?: RuntimeRequire;
}

const getRuntimeRequire = (): RuntimeRequire | null => {
  const globalRequire = (globalThis as RequireCapableGlobal).require;
  return typeof globalRequire === 'function' ? globalRequire : null;
};

export const loadOptionalModule = <ModuleType>(moduleId: string): ModuleType | null => {
  const runtimeRequire = getRuntimeRequire();
  if (!runtimeRequire) {
    return null;
  }

  try {
    return runtimeRequire(moduleId) as ModuleType;
  } catch {
    return null;
  }
};
