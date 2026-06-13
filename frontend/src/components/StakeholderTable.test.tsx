import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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

describe('StakeholderTable', () => {
  it('renders a row for each stakeholder', () => {
    render(<StakeholderTable stakeholders={mockStakeholders} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Johnson')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Williams')).toBeInTheDocument();
  });

  it('renders the correct column headers', () => {
    render(<StakeholderTable stakeholders={mockStakeholders} />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Organisation')).toBeInTheDocument();
  });

  it('renders the title for each stakeholder', () => {
    render(<StakeholderTable stakeholders={mockStakeholders} />);

    expect(screen.getByText('Ms')).toBeInTheDocument();
    expect(screen.getByText('Mr')).toBeInTheDocument();
  });

  it('renders - when title is not set', () => {
    const stakeholders: Stakeholder[] = [
      { ...mockStakeholders[0], title: undefined },
    ];
    render(<StakeholderTable stakeholders={stakeholders} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('displays a message when there are no stakeholders', () => {
    render(<StakeholderTable stakeholders={[]} />);

    expect(screen.getByText('No stakeholders found.')).toBeInTheDocument();
  });

  it('does not render a table when there are no stakeholders', () => {
    render(<StakeholderTable stakeholders={[]} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows only the first page of results', () => {
    render(<StakeholderTable stakeholders={makeMockStakeholders(15)} />);

    expect(screen.getByText('First0')).toBeInTheDocument();
    expect(screen.queryByText('First10')).not.toBeInTheDocument();
  });

  it('navigates to the next page', () => {
    render(<StakeholderTable stakeholders={makeMockStakeholders(15)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.queryByText('First0')).not.toBeInTheDocument();
    expect(screen.getByText('First10')).toBeInTheDocument();
  });

  it('disables Previous button on the first page', () => {
    render(<StakeholderTable stakeholders={makeMockStakeholders(15)} />);

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('disables Next button on the last page', () => {
    render(<StakeholderTable stakeholders={makeMockStakeholders(15)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('changes page size and resets to page 1', () => {
    render(<StakeholderTable stakeholders={makeMockStakeholders(15)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: '25' }));

    expect(screen.getByText('First0')).toBeInTheDocument();
    expect(screen.getByText('First14')).toBeInTheDocument();
  });
});
