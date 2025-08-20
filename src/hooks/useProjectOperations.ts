import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { editorCurrentDirectory } from '@/stores/editorContent';
import { useToast } from '@/hooks/useToast';
import { CreateProjectDto, Project } from '@/types/project';

export function useProjectOperations() {
  const { showToast } = useToast();

  const createProjectMutation = useMutation<Project, Error, CreateProjectDto>({
    mutationFn: async (data: CreateProjectDto) => {
      return projectService.createProject(data);
    },
    onSuccess: (newProject: Project) => {
      editorCurrentDirectory.set(newProject.path);
      showToast('Project created successfully!', 'success');
      // Add any other success logic here, e.g., closing a modal or redirecting
    },
    onError: (error: Error) => {
      showToast(`Failed to create project: ${error.message}`, 'error');
    },
  });

  // This handler can be passed directly to ProjectForm's onSubmit
  const handleCreateProject = useCallback(
    async (data: CreateProjectDto) => {
      await createProjectMutation.mutateAsync(data);
    },
    [createProjectMutation],
  );

  return {
    handleCreateProject,
    isCreatingProject: createProjectMutation.isPending,
    createProjectError: createProjectMutation.error,
  };
}
