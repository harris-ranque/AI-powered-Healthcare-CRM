'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsQueryKeys } from '@/features/patients/hooks/query-keys';

import { filesApi } from '../api/files.api';
import { validateFile } from '../utils/file-validation';
import { putWithProgress } from '../utils/put-with-progress';

export type UploadTaskStatus = 'pending' | 'uploading' | 'confirming' | 'done' | 'error';

export type UploadTask = {
  id: string;
  name: string;
  progress: number;
  status: UploadTaskStatus;
  error?: string;
};

export function useFileUploads(patientId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<UploadTask[]>([]);

  const updateTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setUploads((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
  }, []);

  const uploadSingle = useCallback(
    async (file: File, taskId: string): Promise<boolean> => {
      const validation = validateFile(file);
      if ('error' in validation) {
        updateTask(taskId, { status: 'error', error: validation.error, progress: 0 });
        toast.error(validation.error);
        return false;
      }

      const { mimeType } = validation;

      try {
        updateTask(taskId, { status: 'uploading', progress: 0 });

        const { uploadUrl, storageKey } = await filesApi.createUploadUrl({
          fileName: file.name,
          mimeType,
          size: file.size,
          patientId,
        });

        await putWithProgress(uploadUrl, file, mimeType, (percent) => {
          updateTask(taskId, { progress: percent });
        });

        updateTask(taskId, { status: 'confirming', progress: 100 });

        await filesApi.confirmUpload({
          fileName: file.name,
          mimeType,
          size: file.size,
          storageKey,
          patientId,
        });

        updateTask(taskId, { status: 'done', progress: 100 });
        return true;
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to upload file');
        updateTask(taskId, { status: 'error', error: message, progress: 0 });
        toast.error(message);
        return false;
      }
    },
    [patientId, updateTask],
  );

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const newTasks: UploadTask[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploads((current) => [...newTasks, ...current]);

      const results = await Promise.all(
        newTasks.map((task, index) => uploadSingle(files[index], task.id)),
      );

      const succeeded = results.filter(Boolean).length;
      if (succeeded > 0) {
        await queryClient.invalidateQueries({
          queryKey: patientsQueryKeys.detail(patientId),
        });
        toast.success(
          succeeded === 1 ? 'File uploaded' : `${succeeded} files uploaded`,
        );
      }
    },
    [patientId, queryClient, uploadSingle],
  );

  const clearCompleted = useCallback(() => {
    setUploads((current) =>
      current.filter((task) => task.status !== 'done' && task.status !== 'error'),
    );
  }, []);

  const isUploading = uploads.some(
    (task) =>
      task.status === 'pending' ||
      task.status === 'uploading' ||
      task.status === 'confirming',
  );

  return { uploads, upload, isUploading, clearCompleted };
}
