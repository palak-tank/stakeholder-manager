import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Stakeholder } from '../types/stakeholder';
import { deleteStakeholder } from '../services/stakeholderService';
import { EditStakeholderDialog } from './EditStakeholderDialog';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  stakeholders: Stakeholder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDeleted: () => void;
  onEdited: () => void;
}

export function StakeholderTable({
  stakeholders,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onDeleted,
  onEdited,
}: Props) {
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [deletingStakeholder, setDeletingStakeholder] = useState<Stakeholder | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!deletingStakeholder) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteStakeholder(deletingStakeholder.id);
      setDeletingStakeholder(null);
      onDeleted();
    } catch {
      setDeleteError('Failed to delete stakeholder. Please try again.');
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<Stakeholder>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.title ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
        cell: ({ row }) => <span className="font-medium">{row.original.firstName}</span>,
      },
      { accessorKey: 'lastName', header: 'Last Name' },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'organisation', header: 'Organisation' },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingStakeholder(s)}
                aria-label={`Edit ${s.firstName} ${s.lastName}`}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { setDeleteError(null); setDeletingStakeholder(s); }}
                aria-label={`Delete ${s.firstName} ${s.lastName}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      <DataTable
        columns={columns}
        data={stakeholders}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage="No stakeholders found."
      />

      <EditStakeholderDialog
        stakeholder={editingStakeholder}
        open={!!editingStakeholder}
        onClose={() => setEditingStakeholder(null)}
        onSaved={() => { setEditingStakeholder(null); onEdited(); }}
      />

      <AlertDialog
        open={!!deletingStakeholder}
        onOpenChange={(open) => { if (!open && !deleting) setDeletingStakeholder(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stakeholder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {deletingStakeholder?.firstName} {deletingStakeholder?.lastName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
