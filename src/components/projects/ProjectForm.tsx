import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '@nanostores/react'; // Added import
import { authStore } from '@/stores/authStore'; // Added import
import { Button } from '@/components/ui/Button';
import {
  CreateProjectDto,
  UpdateProjectDto,
  Project,
  ProjectStatus,
  VersionControl,
} from '@/types/project'; // Import enums
import { PROJECT_STATUSES, VERSION_CONTROL_SYSTEMS } from '@/constants'; // Import constants for dropdowns

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional().or(z.literal('')), // Allow empty string for optional
  path: z.string().min(1, 'Project path is required').max(1000, 'Path too long'),
  status: z.nativeEnum(ProjectStatus), // Validate against ProjectStatus enum
  technologies: z
    .string()
    .min(1, 'At least one technology is required')
    .transform((val) =>
      val
        .split(',')
        .map((tech) => tech.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string()).min(1, 'At least one technology is required')), // Comma-separated string to array
  versionControl: z.nativeEnum(VersionControl).optional(), // Validate against VersionControl enum
  repositoryUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  // lastOpenedAt field is removed from form, so it's only optional at the DTO level
  ownerId: z.string().min(1, 'Owner ID cannot be empty').optional().or(z.literal('')), // Added for validation; transform for empty string
  metadata: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      try {
        if (val) return JSON.parse(val);
        return undefined;
      } catch (e) {
        throw new Error('Invalid JSON for metadata');
      }
    })
    .pipe(z.record(z.any()).optional()), // JSON string to object
});

type ProjectFormValues = CreateProjectDto;

interface ProjectFormProps {
  initialData?: Project; // For editing existing projects
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const { $auth } = useStore(authStore);
  const currentUserId = $auth.user?.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      path: initialData?.path || '',
      status: initialData?.status || ProjectStatus.DEVELOPMENT, // Default status
      technologies: initialData?.technologies?.join(', ') || '', // Convert array to comma-separated string for input
      versionControl: initialData?.versionControl || undefined,
      repositoryUrl: initialData?.repositoryUrl || '',
      // lastOpenedAt is no longer directly in the form's default values
      ownerId: initialData?.ownerId || currentUserId || '', // Auto-assign ownerId
      metadata: initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '',
    },
  });

  const handleFormSubmit: SubmitHandler<ProjectFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
      <div>
        <label htmlFor='name' className='block text-sm font-medium text-base'>
          Project Name
        </label>
        <input
          id='name'
          type='text'
          {...register('name')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        />
        {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor='description' className='block text-sm font-medium text-base'>
          Description
        </label>
        <textarea
          id='description'
          {...register('description')}
          rows={2} // Reduced rows
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        ></textarea>
        {errors.description && (
          <p className='mt-1 text-sm text-red-600'>{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='path' className='block text-sm font-medium text-base'>
          Project Path
        </label>
        <input
          id='path'
          type='text'
          {...register('path')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        />
        {errors.path && <p className='mt-1 text-sm text-red-600'>{errors.path.message}</p>}
      </div>

      <div>
        <label htmlFor='status' className='block text-sm font-medium text-base'>
          Status
        </label>
        <select
          id='status'
          {...register('status')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        {errors.status && <p className='mt-1 text-sm text-red-600'>{errors.status.message}</p>}
      </div>

      <div>
        <label htmlFor='technologies' className='block text-sm font-medium text-base'>
          Technologies (comma-separated)
        </label>
        <input
          id='technologies'
          type='text'
          {...register('technologies')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          placeholder='e.g., React, Node.js, TypeScript'
          disabled={isSubmitting}
        />
        {errors.technologies && (
          <p className='mt-1 text-sm text-red-600'>{errors.technologies.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='versionControl' className='block text-sm font-medium text-base'>
          Version Control
        </label>
        <select
          id='versionControl'
          {...register('versionControl')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        >
          <option value=''>Select...</option>
          {VERSION_CONTROL_SYSTEMS.map((vcs) => (
            <option key={vcs} value={vcs}>
              {vcs.charAt(0).toUpperCase() + vcs.slice(1)}
            </option>
          ))}
        </select>
        {errors.versionControl && (
          <p className='mt-1 text-sm text-red-600'>{errors.versionControl.message}</p>
        )}
      </div>

      <div>
        <label htmlFor='repositoryUrl' className='block text-sm font-medium text-base'>
          Repository URL
        </label>
        <input
          id='repositoryUrl'
          type='url' // Use type 'url' for browser validation
          {...register('repositoryUrl')}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base'
          disabled={isSubmitting}
        />
        {errors.repositoryUrl && (
          <p className='mt-1 text-sm text-red-600'>{errors.repositoryUrl.message}</p>
        )}
      </div>

      {/* ownerId field - hidden and auto-assigned */}
      <input type='hidden' id='ownerId' {...register('ownerId')} />
      {errors.ownerId && <p className='mt-1 text-sm text-red-600'>{errors.ownerId.message}</p>}

      <div>
        <label htmlFor='metadata' className='block text-sm font-medium text-base'>
          Metadata (JSON)
        </label>
        <textarea
          id='metadata'
          {...register('metadata')}
          rows={4}
          className='mt-1 block w-full rounded-md shadow-sm bg-secondary text-base font-mono text-xs'
          placeholder='{`key:` `value`, number: 123}'
          disabled={isSubmitting}
        ></textarea>
        {errors.metadata && <p className='mt-1 text-sm text-red-600'>{errors.metadata.message}</p>}
      </div>

      <div className='flex justify-end space-x-2'>
        <Button type='button' variant='secondary' onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type='submit' variant='secondary' loading={isSubmitting}>
          {initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};
