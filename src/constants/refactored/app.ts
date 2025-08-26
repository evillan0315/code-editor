export const APP_NAME = 'Project Board';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION =
  'The best solution to manage your projects efficiently and effortlessly.';

export const API_URL: string = `${import.meta.env.VITE_WS_URL}`;
export const BASE_URL_API: string = API_URL || 'http://localhost:5000';

export const VITE_BASE_DIR: string = import.meta.env.VITE_BASE_DIR || '';
if (!VITE_BASE_DIR) {
  console.warn(
    'VITE_BASE_DIR is not set in environment variables. ESLint may not find correct configurations.',
  );
}
export const IMPORT_SPECIFIER_REGEX =
  /(?:import|export)(?:["'\s]*(?:[\w*{}\n\r\t, ]+)from\s*)?["']((?:@|\.{1,2}\/)?[\w\/.-]+)["']/g;

export const DEFAULT_LANGUAGE = 'typescript';

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export const PROJECT_STATUSES = [
  'ACTIVE',
  'DEVELOPMENT',
  'MAINTENANCE',
  'ON_HOLD',
  'ARCHIVED',
  'DEPRECATED',
] as const;

export const VERSION_CONTROL_SYSTEMS = [
  'git',
  'svn',
  'mercurial',
  'other',
] as const;

export const PATH_ALIASES_MAP = {
  '@/': 'src/',
  '@components/': 'src/components/',
  '@contexts/': 'src/contexts/',
  '@hooks/': 'src/hooks/',
  '@utils/': 'src/utils/',
  '@services/': 'src/services/',
  '@stores/': 'src/stores/',
  '@providers/': 'src/providers/',
  '@types/': 'src/types/',
  '@lib/': 'src/lib/',
};
