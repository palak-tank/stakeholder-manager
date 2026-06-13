import type { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/stakeholders': 'Stakeholders',
  '/stakeholders/new': 'Add Stakeholder',
};

function buildTrail(pathname: string): { label: string; path: string }[] {
  if (pathname === '/') return [{ label: 'Dashboard', path: '/' }];

  const trail: { label: string; path: string }[] = [{ label: 'Dashboard', path: '/' }];

  // Build cumulative segments: /stakeholders, /stakeholders/new, etc.
  const segments = pathname.split('/').filter(Boolean);
  let cumulative = '';
  for (const seg of segments) {
    cumulative += '/' + seg;
    const label = ROUTE_LABELS[cumulative];
    if (label) trail.push({ label, path: cumulative });
  }

  return trail;
}

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageLayout({ title, subtitle, actions, children }: PageLayoutProps) {
  const { pathname } = useLocation();
  const trail = buildTrail(pathname);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <span key={crumb.path} className="flex items-center gap-1.5">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {children}
    </div>
  );
}
