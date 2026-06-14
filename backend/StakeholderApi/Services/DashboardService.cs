using Microsoft.EntityFrameworkCore;
using StakeholderApi.Data;
using StakeholderApi.Models;

namespace StakeholderApi.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStats> GetStatsAsync()
    {
        var totalStakeholders = await _context.Stakeholders.CountAsync();

        // Push role aggregation to DB; filter blank roles so they don't produce a nameless category.
        var roleGroups = await _context.Stakeholders
            .Where(s => s.Role != "")
            .GroupBy(s => s.Role)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .ToListAsync();
        var roleBreakdown = roleGroups.Select(g => new RoleCount(g.Key, g.Count)).ToList();

        // Push recent-stakeholders query to DB (ORDER BY + LIMIT in SQL, not in .NET).
        var recentStakeholders = await _context.Stakeholders
            .OrderByDescending(s => s.CreatedAt)
            .Take(5)
            .Select(s => new RecentStakeholder(s.Id, s.FirstName, s.LastName, s.Role, s.Organisation, s.CreatedAt))
            .ToListAsync();

        // Fetch only org name column (filtered at DB) then normalize in memory,
        // because EF Core cannot translate ToLowerInvariant to SQL.
        var orgNames = await _context.Stakeholders
            .Where(s => s.Organisation != "")
            .Select(s => s.Organisation)
            .ToListAsync();

        var totalOrganisations = orgNames
            .Select(o => o.ToLowerInvariant())
            .Distinct()
            .Count();

        // Group by normalized name so "Acme" and "ACME" merge; display the first-seen casing.
        var topOrganisations = orgNames
            .GroupBy(o => o.ToLowerInvariant())
            .Select(g => new OrgCount(g.First(), g.Count()))
            .OrderByDescending(o => o.Count)
            .Take(5)
            .ToList();

        return new DashboardStats(totalStakeholders, totalOrganisations, roleBreakdown, topOrganisations, recentStakeholders);
    }
}
