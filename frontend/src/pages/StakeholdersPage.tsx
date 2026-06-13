import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StakeholderTable } from '../components/StakeholderTable';
import { getStakeholders } from '../services/stakeholderService';
import type { Stakeholder } from '../types/stakeholder';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function StakeholdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStakeholders(currentPage - 1, pageSize)
      .then(({ items, totalCount: total }) => {
        setStakeholders(items);
        setTotalCount(total);
      })
      .catch(() => setError('Failed to load stakeholders. Is the API running?'))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize, refreshKey]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page), pageSize: String(pageSize) });
  };

  const handlePageSizeChange = (size: number) => {
    setSearchParams({ page: '1', pageSize: String(size) });
  };

  return (
    <PageLayout
      title="Stakeholders"
      subtitle="Manage your stakeholder relationships"
      actions={
        <Button onClick={() => navigate('/stakeholders/new')}>
          <PlusCircle className="size-4" />
          Add Stakeholder
        </Button>
      }
    >
      {loading && (
        <p className="text-muted-foreground animate-pulse text-sm">Loading stakeholders…</p>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && (
        <StakeholderTable
          stakeholders={stakeholders}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onDeleted={() => setRefreshKey(k => k + 1)}
          onEdited={() => setRefreshKey(k => k + 1)}
        />
      )}
    </PageLayout>
  );
}
