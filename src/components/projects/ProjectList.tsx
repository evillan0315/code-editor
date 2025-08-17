import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { Project, PaginationProjectQueryDto } from '@/types/project';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { showToast } from '@/stores/toast';
import { ProjectModal } from './ProjectModal';
import { confirm } from '@/stores/modal';

export const ProjectList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['projects', { page, pageSize }],
    queryFn: () => projectService.getPaginatedProjects({ page, pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Project deleted successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(`Error deleting project: ${error.message || 'Unknown error'}`, 'error');
    },
  });

  const handleDelete = async (project: Project) => {
    const confirmed = await confirm(`Are you sure you want to delete project '${project.name}'?`);
    if (confirmed) {
      deleteMutation.mutate(project.id);
    }
  };

  const handleEdit = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleCloseModal = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(false);
  };

  if (isLoading) return <div className='p-4 text-center'>Loading projects...</div>;
  if (isError)
    return (
      <div className='p-4 text-center text-red-500'>
        Error: {error?.message || 'Failed to load projects'}
      </div>
    );

  const projects = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className='p-4'>
      <h2 className='text-xl font-semibold mb-4 dark:text-gray-200'>My Projects</h2>

      <div className='overflow-x-auto rounded-lg shadow-md'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-gray-800'>
          <thead className='bg-gray-700'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Description
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Path
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Technologies
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Version Control
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Last Opened
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className='px-6 py-4 text-center text-gray-400'>
                  No projects found. Create one to get started!
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className='hover:bg-gray-700 transition-colors duration-200'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200'>
                    {project.name}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-300 max-w-xs truncate'>
                    {project.description || 'No description'}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-300 max-w-xs truncate'>
                    {project.path}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-300 max-w-xs truncate'>
                    {project.technologies?.join(', ') || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                    {project.versionControl || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                    {project.lastOpenedAt
                      ? new Date(project.lastOpenedAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <Button
                      variant='info'
                      size='sm'
                      onClick={() => handleEdit(project)}
                      className='mr-2'
                      icon='mdi:pencil'
                      aria-label={`Edit ${project.name}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='error'
                      size='sm'
                      onClick={() => handleDelete(project)}
                      loading={deleteMutation.isPending && deleteMutation.variables === project.id}
                      icon='mdi:delete'
                      aria-label={`Delete ${project.name}`}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className='flex justify-between items-center mt-4'>
          <Button
            variant='secondary'
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || isLoading}
            icon='mdi:chevron-left'
          >
            Previous
          </Button>
          <span className='text-gray-300'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='secondary'
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || isLoading}
            icon='mdi:chevron-right'
            iconPosition='right'
          >
            Next
          </Button>
        </div>
      )}

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseModal}
        projectToEdit={projectToEdit}
      />
    </div>
  );
};
