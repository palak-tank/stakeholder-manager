import { useEffect, useState } from 'react';
import { Stakeholder } from '../types/stakeholder';
import { updateStakeholder, UpdateStakeholderInput } from '../services/stakeholderService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  stakeholder: Stakeholder | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditStakeholderDialog({ stakeholder, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState<UpdateStakeholderInput>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    organisation: '',
    title: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stakeholder) {
      setForm({
        firstName: stakeholder.firstName,
        lastName: stakeholder.lastName,
        email: stakeholder.email,
        role: stakeholder.role,
        organisation: stakeholder.organisation,
        title: stakeholder.title ?? '',
      });
      setError(null);
    }
  }, [stakeholder]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stakeholder) return;
    setSubmitting(true);
    setError(null);

    try {
      await updateStakeholder(stakeholder.id, {
        ...form,
        title: form.title?.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stakeholder.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Stakeholder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-organisation">Organisation</Label>
              <Input
                id="edit-organisation"
                name="organisation"
                value={form.organisation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">
              Title{' '}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Input
              id="edit-title"
              name="title"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
