import { Stakeholder } from '../types/stakeholder';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;

interface Props {
  stakeholders: Stakeholder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function StakeholderTable({
  stakeholders,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
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
    </div>
  );
}
