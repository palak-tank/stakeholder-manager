import { useState } from 'react';
import { Stakeholder } from '../types/stakeholder';
import { deleteStakeholder } from '../services/stakeholderService';
import { EditStakeholderDialog } from './EditStakeholderDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;

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

  if (totalCount === 0) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center text-muted-foreground shadow-sm">
        No stakeholders found.
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground/70">Title</TableHead>
              <TableHead className="font-semibold text-foreground/70">First Name</TableHead>
              <TableHead className="font-semibold text-foreground/70">Last Name</TableHead>
              <TableHead className="font-semibold text-foreground/70">Email</TableHead>
              <TableHead className="font-semibold text-foreground/70">Role</TableHead>
              <TableHead className="font-semibold text-foreground/70">Organisation</TableHead>
              <TableHead className="font-semibold text-foreground/70 w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-muted-foreground">{s.title ?? '-'}</TableCell>
                <TableCell className="font-medium">{s.firstName}</TableCell>
                <TableCell>{s.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{s.email}</TableCell>
                <TableCell>{s.role}</TableCell>
                <TableCell>{s.organisation}</TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Button
              key={size}
              variant={pageSize === size ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onPageSizeChange(size)}
              aria-pressed={pageSize === size}
              className="h-8 w-8 p-0"
            >
              {size}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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
