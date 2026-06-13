import { useEffect, useState } from 'react';
import { StakeholderTable } from '../components/StakeholderTable';
import { getStakeholders } from '../services/stakeholderService';
import { Stakeholder } from '../types/stakeholder';

export function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStakeholders()
      .then(setStakeholders)
      .catch(() => setError('Failed to load stakeholders. Is the API running?'))
      .finally(() => setLoading(false));
  }, []);

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
      {!loading && !error && <StakeholderTable stakeholders={stakeholders} />}
    </div>
  );
}
