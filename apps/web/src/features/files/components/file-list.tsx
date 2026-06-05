'use client';

import { ExternalLink, FileText, Image, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { filesApi } from '../api/files.api';
import { useDeleteFile } from '../hooks/use-delete-file';
import { useUploadFile } from '../hooks/use-upload-file';
import type { PatientFile } from '../types/file.type';

type Props = {
  patientId: string;
  files: PatientFile[];
};

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

export function FileList({ patientId, files }: Props) {
  const user = useAuth().user;
  const canUpload = hasPermission(user?.role, Permission.FILE_WRITE);
  const canDelete = hasPermission(user?.role, Permission.FILE_DELETE);
  const canRead = hasPermission(user?.role, Permission.FILE_READ);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFile(patientId);
  const remove = useDeleteFile(patientId);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Uploaded files</h3>
          <p className="text-muted-foreground text-sm">Reports, PDFs, scans, and documents.</p>
        </div>
        {canUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void upload.mutateAsync(file);
                }
                event.target.value = '';
              }}
            />
            <Button
              variant="outline"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {upload.isPending ? 'Uploading...' : 'Upload file'}
            </Button>
          </>
        ) : null}
      </div>

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
                  onClick={() => void remove.mutateAsync(file.id)}
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
