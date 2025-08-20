import {PROJECT_STATUSES} from '@/constants';
// Define the ProjectStatus enum, matching the backend's (Prisma's) values
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  DEVELOPMENT = 'DEVELOPMENT',
  MAINTENANCE = 'MAINTENANCE',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
  DEPRECATED = 'DEPRECATED',
}

export enum VersionControl {
  GIT = 'git',
  SVN = 'svn',
  MERCURIAL = 'mercurial',
  OTHER = 'other',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string; // New: file system path
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: ProjectStatus; // New: status enum
  technologies: string[]; // New: array of strings
  versionControl?: VersionControl; // New: VCS enum
  repositoryUrl?: string; // New: URL to repository
  lastOpenedAt?: string; // New: ISO date string for last opened
  ownerId?: string; // New: Optional owner identifier
  metadata?: Record<string, any>; // New: Flexible metadata JSON
  createdById?: string; // Optional, if linked to a user
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  path: string;
  status: ProjectStatus;
  technologies: string[];
  versionControl?: VersionControl;
  repositoryUrl?: string;
  lastOpenedAt?: string; // Will be string from HTML input, converted to Date on backend
  ownerId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  path?: string;
  status?: ProjectStatus;
  technologies?: string[];
  versionControl?: VersionControl;
  repositoryUrl?: string;
  lastOpenedAt?: string;
  ownerId?: string;
  metadata?: Record<string, any>;
}

export interface PaginationProjectResultDto {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationProjectQueryDto {
  page?: number;
  pageSize?: number;
  name?: string;
  description?: string;
  path?: string;
  status?: ProjectStatus;
  technologies?: string; // Filter by a technology contained in the array (comma-separated if multiple)
  versionControl?: VersionControl;
  ownerId?: string;
  // lastOpenedAt range filters could be added later:
  // lastOpenedAtStart?: string;
  // lastOpenedAtEnd?: string;
}
