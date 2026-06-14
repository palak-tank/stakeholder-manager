using Microsoft.AspNetCore.Mvc;
using Moq;
using StakeholderApi.Controllers;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class DashboardControllerTests
{
    [Fact]
    public async Task GetStats_Returns200_WithDashboardStats()
    {
        var stats = new DashboardStats(
            TotalStakeholders:  10,
            TotalOrganisations: 2,
            RoleBreakdown:      new[] { new RoleCount("Investor", 5) },
            TopOrganisations:   new[] { new OrgCount("Acme", 3) },
            RecentStakeholders: Array.Empty<RecentStakeholder>()
        );
        var svc = new Mock<IDashboardService>();
        svc.Setup(s => s.GetStatsAsync()).ReturnsAsync(stats);

        var result = await new DashboardController(svc.Object).GetStats();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<DashboardStats>(ok.Value);
        Assert.Equal(10, body.TotalStakeholders);
    }
}
