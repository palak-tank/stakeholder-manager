import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createStakeholder, type CreateStakeholderInput } from '@/services/stakeholderService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/PageLayout';
import { StakeholderForm } from '@/components/forms/stakeholder';

export function CreateStakeholderPage() {
  const navigate = useNavigate();

  async function handleSubmit(input: CreateStakeholderInput) {
    await createStakeholder(input);
    toast.success('Stakeholder created.');
    navigate('/stakeholders');
  }

  return (
    <PageLayout title="Add Stakeholder">
      <Card className="max-w-2xl shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-muted-foreground">
            Stakeholder Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StakeholderForm
            submitLabel="Add Stakeholder"
            onSubmit={handleSubmit}
            onCancel={() => navigate('/stakeholders')}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
