'use client';

import { ExternalLink, FileText, Image, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { cn } from '@/lib/utils';

import { filesApi } from '../api/files.api';
import { useDeleteFile } from '../hooks/use-delete-file';
import { useFileUploads } from '../hooks/use-file-uploads';
import type { PatientFile } from '../types/file.type';

type Props = {
  patientId: string;
  files: PatientFile[];
};

const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.docx,image/png,image/jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <Image className="text-primary size-4" />;
  }
  return <FileText className="text-primary size-4" />;
}

function UploadProgressRow({
  name,
  progress,
  status,
  error,
}: {
  name: string;
  progress: number;
  status: string;
  error?: string;
}) {
  const label =
    status === 'error'
      ? (error ?? 'Upload failed')
      : status === 'done'
        ? 'Complete'
        : status === 'confirming'
          ? 'Saving...'
          : status === 'uploading'
            ? `Uploading ${progress}%`
            : 'Waiting...';

  return (
    <div className="space-y-1.5 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-medium">{name}</span>
        <span
          className={cn(
            'shrink-0 text-xs',
            status === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </div>
      {status !== 'error' && status !== 'done' ? (
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function FileList({ patientId, files }: Props) {
  const user = useAuth().user;
  const canUpload = hasPermission(user?.role, Permission.FILE_WRITE);
  const canDelete = hasPermission(user?.role, Permission.FILE_DELETE);
  const canRead = hasPermission(user?.role, Permission.FILE_READ);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploads, upload, isUploading, clearCompleted } = useFileUploads(patientId);
  const remove = useDeleteFile(patientId);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const openFile = async (file: PatientFile) => {
    if (!canRead) return;
    setOpeningFileId(file.id);
    try {
      const { url } = await filesApi.getDownloadUrl(file.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to open file'));
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    void upload(Array.from(fileList));
  };

  const activeUploads = uploads.filter(
    (task) => task.status !== 'done' && task.status !== 'error',
  );
  const finishedUploads = uploads.filter(
    (task) => task.status === 'done' || task.status === 'error',
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Uploaded files</h3>
        <p className="text-muted-foreground text-sm">
          Reports, PDFs, scans, and documents. PDF, JPEG, PNG, and DOCX up to 10MB.
        </p>
      </div>

      {canUpload ? (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPT}
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFiles(event.dataTransfer.files);
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <Upload className="text-muted-foreground size-8" />
            <div>
              <p className="font-medium">Drag and drop files here</p>
              <p className="text-muted-foreground text-sm">or click to browse</p>
            </div>
          </div>
        </>
      ) : null}

      {activeUploads.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploading</p>
          {activeUploads.map((task) => (
            <UploadProgressRow
              key={task.id}
              name={task.name}
              progress={task.progress}
              status={task.status}
              error={task.error}
            />
          ))}
        </div>
      ) : null}

      {finishedUploads.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Recent uploads</p>
            <Button
              variant="ghost"
              size="sm"
              disabled={isUploading}
              onClick={clearCompleted}
            >
              Clear
            </Button>
          </div>
          {finishedUploads.map((task) => (
            <UploadProgressRow
              key={task.id}
              name={task.name}
              progress={task.progress}
              status={task.status}
              error={task.error}
            />
          ))}
        </div>
      ) : null}

      {files.length === 0 ? (
        <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3">
              {file.mimeType.startsWith('image/') ? (
                <button
                  type="button"
                  className="bg-muted size-12 shrink-0 overflow-hidden rounded-md border"
                  onClick={() => void openFile(file)}
                  disabled={openingFileId === file.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.publicUrl}
                    alt={file.originalName}
                    className="size-full object-cover"
                  />
                </button>
              ) : (
                <FileIcon mimeType={file.mimeType} />
              )}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => void openFile(file)}
                  disabled={openingFileId === file.id || !canRead}
                  className="text-primary block truncate text-left font-medium hover:underline disabled:opacity-50"
                >
                  {file.originalName}
                </button>
                <p className="text-muted-foreground text-xs">
                  {formatSize(file.size)} ·{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(file.createdAt))}
                </p>
              </div>
              {canRead ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={openingFileId === file.id}
                  onClick={() => void openFile(file)}
                  aria-label={`Open ${file.originalName}`}
                >
                  <ExternalLink className="size-4" />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(file.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
