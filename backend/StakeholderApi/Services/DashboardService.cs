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
        var all = await _context.Stakeholders.ToListAsync();

        var totalStakeholders = all.Count;

        var totalOrganisations = all
            .Select(s => s.Organisation.ToLowerInvariant())
            .Distinct()
            .Count();

        var roleBreakdown = all
            .GroupBy(s => s.Role)
            .Select(g => new RoleCount(g.Key, g.Count()))
            .OrderByDescending(r => r.Count)
            .ToList();

        var topOrganisations = all
            .GroupBy(s => s.Organisation)
            .Select(g => new OrgCount(g.Key, g.Count()))
            .OrderByDescending(o => o.Count)
            .Take(5)
            .ToList();

        var recentStakeholders = all
            .OrderByDescending(s => s.CreatedAt)
            .Take(5)
            .Select(s => new RecentStakeholder(s.Id, s.FirstName, s.LastName, s.Role, s.Organisation, s.CreatedAt))
            .ToList();

        return new DashboardStats(totalStakeholders, totalOrganisations, roleBreakdown, topOrganisations, recentStakeholders);
    }
}
