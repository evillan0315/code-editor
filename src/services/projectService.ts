import { apiFetch } from '@/services/apiFetch';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  PaginationProjectResultDto,
  PaginationProjectQueryDto,
} from '@/types/project';

const BASE_API_PATH = '/api/project';

export const projectService = {
  /**
   * Creates a new project.
   * @param data The project data to create.
   * @returns The created project.
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    return apiFetch<Project, CreateProjectDto>(BASE_API_PATH, {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Fetches all projects.
   * @returns An array of all projects.
   */
  async getProjects(): Promise<Project[]> {
    return apiFetch<Project[]>(BASE_API_PATH, {
      method: 'GET',
    });
  },

  /**
   * Fetches a paginated list of projects.
   * @param query Pagination and filter parameters.
   * @returns A paginated result object containing projects and pagination info.
   */
  async getPaginatedProjects(
    query: PaginationProjectQueryDto,
  ): Promise<PaginationProjectResultDto> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.pageSize) params.append('pageSize', String(query.pageSize));
    if (query.name) params.append('name', query.name);
    if (query.description) params.append('description', query.description);

    return apiFetch<PaginationProjectResultDto>(`${BASE_API_PATH}/paginated?${params.toString()}`, {
      method: 'GET',
    });
  },

  /**
   * Fetches a single project by ID.
   * @param id The ID of the project to fetch.
   * @returns The project object.
   */
  async getProjectById(id: string): Promise<Project> {
    return apiFetch<Project>(`${BASE_API_PATH}/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Updates an existing project.
   * @param id The ID of the project to update.
   * @param data The updated project data.
   * @returns The updated project.
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return apiFetch<Project, UpdateProjectDto>(`${BASE_API_PATH}/${id}`, {
      method: 'PATCH',
      body: data,
    });
  },

  /**
   * Deletes a project by ID.
   * @param id The ID of the project to delete.
   */
  async deleteProject(id: string): Promise<void> {
    return apiFetch<void>(`${BASE_API_PATH}/${id}`, {
      method: 'DELETE',
    });
  },
};
