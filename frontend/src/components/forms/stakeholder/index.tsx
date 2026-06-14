import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  stakeholderFormSchema,
  StakeholderFormValues,
  TITLE_OPTIONS,
  ROLE_OPTIONS,
} from '@/schemas/stakeholder';
import { EMPTY_DEFAULTS } from '@/components/forms/stakeholder/initialValue';
import { type CreateStakeholderInput } from '@/services/stakeholderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StakeholderFormProps {
  submitLabel: string;
  defaultValues?: Partial<StakeholderFormValues>;
  onSubmit: (input: CreateStakeholderInput) => Promise<void>;
  onCancel: () => void;
}

export function StakeholderForm({
  submitLabel,
  defaultValues,
  onSubmit,
  onCancel,
}: StakeholderFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const titleValue = watch('title');
  const roleValue = watch('role');

  async function handleFormSubmit(values: StakeholderFormValues) {
    const resolvedTitle =
      values.title === 'Other'
        ? values.titleOther?.trim() || undefined
        : values.title || undefined;

    const resolvedRole =
      values.role === 'Other' ? values.roleOther?.trim() ?? '' : values.role;

    try {
      await onSubmit({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: resolvedRole,
        organisation: values.organisation,
        title: resolvedTitle,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError('email', { type: 'manual', message });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {errors.root && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      {/* Title — full width; expands to 50/50 grid when Other is selected */}
      <div className={titleValue === 'Other' ? 'grid grid-cols-2 gap-5' : ''}>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Select
            value={titleValue ?? ''}
            onValueChange={(val) =>
              setValue('title', val as StakeholderFormValues['title'], {
                shouldValidate: true,
                shouldTouch: true,
              })
            }
          >
            <SelectTrigger id="title" aria-invalid={!!errors.title}>
              <SelectValue placeholder="Select a title" />
            </SelectTrigger>
            <SelectContent>
              {TITLE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {titleValue === 'Other' && (
          <div className="space-y-1.5">
            <Label htmlFor="titleOther">Custom Title</Label>
            <Input
              id="titleOther"
              type="text"
              placeholder="e.g. Dr., Prof., Rev."
              aria-invalid={!!errors.titleOther}
              {...register('titleOther')}
            />
            {errors.titleOther && (
              <p className="text-sm text-destructive">{errors.titleOther.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            aria-invalid={!!errors.firstName}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            aria-invalid={!!errors.lastName}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select
            value={roleValue ?? ''}
            onValueChange={(val) =>
              setValue('role', val as StakeholderFormValues['role'], {
                shouldValidate: true,
                shouldTouch: true,
              })
            }
          >
            <SelectTrigger id="role" aria-invalid={!!errors.role}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organisation">Organisation</Label>
          <Input
            id="organisation"
            type="text"
            aria-invalid={!!errors.organisation}
            {...register('organisation')}
          />
          {errors.organisation && (
            <p className="text-sm text-destructive">{errors.organisation.message}</p>
          )}
        </div>
      </div>

      {roleValue === 'Other' && (
        <div className="space-y-1.5">
          <Label htmlFor="roleOther">Custom Role</Label>
          <Input
            id="roleOther"
            type="text"
            placeholder="e.g. Consultant, Founder, Sponsor"
            aria-invalid={!!errors.roleOther}
            {...register('roleOther')}
          />
          {errors.roleOther && (
            <p className="text-sm text-destructive">{errors.roleOther.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
