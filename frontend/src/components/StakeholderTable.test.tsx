import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StakeholderTable } from './StakeholderTable';
import { Stakeholder } from '../types/stakeholder';

const mockStakeholders: Stakeholder[] = [
  {
    id: 1,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    role: 'Investor',
    organisation: 'Venture Capital Partners',
    createdAt: '2024-01-15T00:00:00Z',
    title: 'Ms',
  },
  {
    id: 2,
    firstName: 'Bob',
    lastName: 'Williams',
    email: 'bob@example.com',
    role: 'Advisor',
    organisation: 'TechCorp Ltd',
    createdAt: '2024-02-03T00:00:00Z',
    title: 'Mr',
  },
];

function makeMockStakeholders(count: number): Stakeholder[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    firstName: `First${i}`,
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    role: 'Investor',
    organisation: 'Org',
    createdAt: '2024-01-01T00:00:00Z',
    title: 'Ms',
  }));
}

function renderTable(
  stakeholders: Stakeholder[],
  overrides: {
    totalCount?: number;
    currentPage?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onDeleted?: () => void;
    onEdited?: () => void;
  } = {}
) {
  render(
    <StakeholderTable
      stakeholders={stakeholders}
      totalCount={overrides.totalCount ?? stakeholders.length}
      currentPage={overrides.currentPage ?? 1}
      pageSize={overrides.pageSize ?? 10}
      onPageChange={overrides.onPageChange ?? vi.fn()}
      onPageSizeChange={overrides.onPageSizeChange ?? vi.fn()}
      onDeleted={overrides.onDeleted ?? vi.fn()}
      onEdited={overrides.onEdited ?? vi.fn()}
    />
  );
}

describe('StakeholderTable', () => {
  it('renders a row for each stakeholder', () => {
    renderTable(mockStakeholders);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Williams')).toBeInTheDocument();
  });

  it('renders the correct column headers', () => {
    renderTable(mockStakeholders);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Organisation')).toBeInTheDocument();
  });

  it('renders the title for each stakeholder', () => {
    renderTable(mockStakeholders);

    expect(screen.getByText('Ms')).toBeInTheDocument();
    expect(screen.getByText('Mr')).toBeInTheDocument();
  });

  it('renders - when title is not set', () => {
    renderTable([{ ...mockStakeholders[0], title: undefined }]);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('displays a message when there are no stakeholders', () => {
    renderTable([], { totalCount: 0 });

    expect(screen.getByText('No stakeholders found.')).toBeInTheDocument();
  });

  it('does not render a table when there are no stakeholders', () => {
    renderTable([], { totalCount: 0 });

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders only the items it receives from the server', () => {
    // Server returns page 1 (10 items); item at index 10 is not in this page
    renderTable(makeMockStakeholders(10), { totalCount: 15 });

    expect(screen.getByText('First0')).toBeInTheDocument();
    expect(screen.queryByText('First10')).not.toBeInTheDocument();
  });

  it('calls onPageChange with the next page number when Next is clicked', () => {
    const onPageChange = vi.fn();
    renderTable(makeMockStakeholders(10), { totalCount: 15, currentPage: 1, onPageChange });

    fireEvent.click(screen.getByLabelText('Go to next page'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables Previous button on the first page', () => {
    renderTable(makeMockStakeholders(10), { currentPage: 1, totalCount: 15 });

    expect(screen.getByLabelText('Go to previous page')).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables Next button on the last page', () => {
    // totalCount=15, pageSize=10 → totalPages=2; currentPage=2 is the last page
    renderTable(makeMockStakeholders(5), { totalCount: 15, currentPage: 2, pageSize: 10 });

    expect(screen.getByLabelText('Go to next page')).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onPageSizeChange when a page size option is clicked', () => {
    const onPageSizeChange = vi.fn();
    renderTable(makeMockStakeholders(10), { totalCount: 15, onPageSizeChange });

    fireEvent.click(screen.getByRole('button', { name: '25' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
