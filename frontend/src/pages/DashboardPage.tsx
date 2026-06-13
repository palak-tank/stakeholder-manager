import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Total Stakeholders', value: '—' },
  { label: 'Active Engagements', value: '—' },
  { label: 'Pending Actions', value: '—' },
  { label: 'Organisations', value: '—' },
];

export function DashboardPage() {
  return (
    <PageLayout title="Dashboard" subtitle="Welcome back">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
