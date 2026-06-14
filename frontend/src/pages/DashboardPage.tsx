import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Users, Building2, Star, Clock } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats, type DashboardStats } from '@/services/dashboardService';

const ROLE_COLORS: Record<string, string> = {
  Investor: 'bg-violet-500',
  Advisor: 'bg-blue-500',
  Partner: 'bg-emerald-500',
  'Board Member': 'bg-amber-500',
  Mentor: 'bg-rose-500',
};

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? 'bg-slate-400';
}

function Initials({ name }: { name: string }) {
  const [first, last = ''] = name.split(' ');
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <div className="rounded-md bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20" />
        <Skeleton className="mt-1 h-3 w-28" />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setStats(null);
    getDashboardStats()
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data.')
      );
  }, []);

  useEffect(() => { load(); }, [load]);

  const topRole = stats?.roleBreakdown[0];
  const maxRoleCount = stats?.roleBreakdown[0]?.count ?? 1;

  if (error) {
    return (
      <PageLayout title="Dashboard" subtitle="Welcome back">
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border bg-card text-sm text-muted-foreground">
          <p>{error}</p>
          <button
            onClick={load}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard" subtitle="Welcome back">
      <div className="flex flex-col gap-6">

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {!stats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Total Stakeholders"
                value={stats.totalStakeholders}
              />
              <StatCard
                icon={Building2}
                label="Organisations"
                value={stats.totalOrganisations}
              />
              <StatCard
                icon={Star}
                label="Most Common Role"
                value={topRole?.role ?? '—'}
                sub={topRole ? `${topRole.count} stakeholder${topRole.count !== 1 ? 's' : ''}` : undefined}
              />
            </>
          )}
        </div>

        {/* Role breakdown + Top organisations */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Role breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Stakeholders by Role</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : stats.roleBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stakeholders yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.roleBreakdown.map(({ role, count }) => {
                    const pct = Math.round((count / maxRoleCount) * 100);
                    return (
                      <div key={role} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block size-2.5 rounded-full ${roleColor(role)}`} />
                            <span className="font-medium">{role}</span>
                          </div>
                          <span className="tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${roleColor(role)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top organisations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Organisations</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : stats.topOrganisations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organisations yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {stats.topOrganisations.map(({ organisation, count }, i) => (
                    <div key={organisation} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground tabular-nums w-4">
                          {i + 1}.
                        </span>
                        <span className="truncate text-sm font-medium">{organisation}</span>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently added */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Recently Added</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <div className="flex flex-col divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : stats.recentStakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stakeholders added yet.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {stats.recentStakeholders.map(s => {
                  const fullName = `${s.firstName} ${s.lastName}`;
                  const initials = Initials({ name: fullName });
                  return (
                    <div key={s.id} className="flex items-center gap-4 py-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${roleColor(s.role)}`}>
                        {initials}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{fullName}</span>
                        <span className="text-xs text-muted-foreground">{s.role} · {s.organisation}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </PageLayout>
  );
}
