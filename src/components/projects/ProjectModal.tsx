import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from './ProjectForm';
import { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { showToast } from '@/stores/toast';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, projectToEdit }) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project created successfully!', 'success');
      onClose();
    },
    onError: (error: any) => {
      showToast(`Error creating project: ${error.message || 'Unknown error'}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project updated successfully!', 'success');
      onClose();
    },
    onError: (error: any) => {
      showToast(`Error updating project: ${error.message || 'Unknown error'}`, 'error');
    },
  });

  const handleSubmit = (data: CreateProjectDto | UpdateProjectDto) => {
    if (projectToEdit) {
      updateMutation.mutate({ id: projectToEdit.id, data });
    } else {
      createMutation.mutate(data as CreateProjectDto);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Edit Project' : 'Create New Project'}
      size='md'
    >
      <ProjectForm
        initialData={projectToEdit || undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
};
