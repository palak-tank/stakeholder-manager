import { toast } from 'sonner';
import { Stakeholder } from '@/types/stakeholder';
import { updateStakeholder, type UpdateStakeholderInput } from '@/services/stakeholderService';
import { TITLE_OPTIONS, ROLE_OPTIONS, type StakeholderFormValues } from '@/schemas/stakeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StakeholderForm } from '@/components/forms/stakeholder';

interface Props {
  stakeholder: Stakeholder | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const PREDEFINED_ROLES = ROLE_OPTIONS.filter((r) => r !== 'Other');

function toFormValues(stakeholder: Stakeholder): Partial<StakeholderFormValues> {
  const storedTitle = stakeholder.title ?? '';
  const isKnownTitle = (TITLE_OPTIONS as readonly string[]).includes(storedTitle);

  const isKnownRole = (PREDEFINED_ROLES as readonly string[]).includes(stakeholder.role);
  const roleValue = isKnownRole ? (stakeholder.role as StakeholderFormValues['role']) : 'Other';
  const roleOther = isKnownRole ? '' : stakeholder.role;

  return {
    firstName: stakeholder.firstName,
    lastName: stakeholder.lastName,
    email: stakeholder.email,
    role: roleValue,
    roleOther,
    organisation: stakeholder.organisation,
    title: isKnownTitle ? (storedTitle as StakeholderFormValues['title']) : storedTitle ? 'Other' : '',
    titleOther: isKnownTitle || !storedTitle ? '' : storedTitle,
  };
}

export function EditStakeholderDialog({ stakeholder, open, onClose, onSaved }: Props) {
  async function handleSubmit(input: UpdateStakeholderInput) {
    if (!stakeholder) return;
    await updateStakeholder(stakeholder.id, input);
    toast.success('Changes saved.');
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Stakeholder</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          <StakeholderForm
            key={stakeholder?.id}
            submitLabel="Save changes"
            defaultValues={stakeholder ? toFormValues(stakeholder) : undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
