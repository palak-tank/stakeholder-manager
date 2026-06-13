import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StakeholderTable } from '../components/StakeholderTable';
import { getStakeholders } from '../services/stakeholderService';
import { Stakeholder } from '../types/stakeholder';

export function StakeholdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
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
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page), pageSize: String(pageSize) });
  };

  const handlePageSizeChange = (size: number) => {
    setSearchParams({ page: '1', pageSize: String(size) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Stakeholders</h1>
      </div>
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
        />
      )}
    </div>
  );
}
