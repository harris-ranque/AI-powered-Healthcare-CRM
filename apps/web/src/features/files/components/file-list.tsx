'use client';

import { FileText, Image, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import { useDeleteFile } from '../hooks/use-delete-file';
import { usePatientFiles } from '../hooks/use-patient-files';
import { useUploadFile } from '../hooks/use-upload-file';

type Props = {
  patientId: string;
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

export function FileList({ patientId }: Props) {
  const user = useAuth().user;
  const canUpload = hasPermission(user?.role, Permission.FILE_WRITE);
  const canDelete = hasPermission(user?.role, Permission.FILE_DELETE);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: files = [], isLoading } = usePatientFiles(patientId);
  const upload = useUploadFile(patientId);
  const remove = useDeleteFile(patientId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Uploaded files</h3>
          <p className="text-muted-foreground text-sm">Reports, PDFs, and attachments.</p>
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

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3">
              <FileIcon mimeType={file.mimeType} />
              <div className="min-w-0 flex-1">
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary block truncate font-medium hover:underline"
                >
                  {file.originalName}
                </a>
                <p className="text-muted-foreground text-xs">
                  {formatSize(file.size)} ·{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(file.createdAt))}
                </p>
              </div>
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
