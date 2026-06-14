using Microsoft.EntityFrameworkCore;
using StakeholderApi.Data;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class DashboardServiceTests
{
    private AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static Stakeholder Make(string firstName, string lastName, string email,
        string role, string org, DateTime? createdAt = null) => new()
    {
        FirstName = firstName,
        LastName = lastName,
        Email = email,
        Role = role,
        Organisation = org,
        CreatedAt = createdAt ?? DateTime.UtcNow,
    };

    // ── Empty database ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_WhenEmpty_ReturnsZeroTotalsAndEmptyLists()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_WhenEmpty_ReturnsZeroTotalsAndEmptyLists));

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal(0, result.TotalStakeholders);
        Assert.Equal(0, result.TotalOrganisations);
        Assert.Empty(result.RoleBreakdown);
        Assert.Empty(result.TopOrganisations);
        Assert.Empty(result.RecentStakeholders);
    }

    // ── Totals ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_ReturnsTotalStakeholderCount()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_ReturnsTotalStakeholderCount));
        context.Stakeholders.AddRange(
            Make("A", "A", "a@x.com", "Investor", "X"),
            Make("B", "B", "b@x.com", "Advisor",  "X"),
            Make("C", "C", "c@x.com", "Partner",  "X")
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal(3, result.TotalStakeholders);
    }

    [Fact]
    public async Task GetStatsAsync_CountsOrganisationsCaseInsensitively()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_CountsOrganisationsCaseInsensitively));
        context.Stakeholders.AddRange(
            Make("A", "A", "a@x.com", "Investor", "VCP"),
            Make("B", "B", "b@x.com", "Advisor",  "vcp"),     // same org, different casing
            Make("C", "C", "c@x.com", "Partner",  "VCP"),     // same org again
            Make("D", "D", "d@x.com", "Mentor",   "TechCorp") // distinct org
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        // "VCP" / "vcp" collapse → 2 total organisations
        Assert.Equal(2, result.TotalOrganisations);
    }

    // ── Role breakdown ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_RoleBreakdown_GroupsRolesAndOrdersByCountDescending()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RoleBreakdown_GroupsRolesAndOrdersByCountDescending));
        context.Stakeholders.AddRange(
            Make("A", "A", "a@x.com", "Investor", "X"),
            Make("B", "B", "b@x.com", "Investor", "X"),
            Make("C", "C", "c@x.com", "Investor", "X"),
            Make("D", "D", "d@x.com", "Advisor",  "X"),
            Make("E", "E", "e@x.com", "Advisor",  "X"),
            Make("F", "F", "f@x.com", "Partner",  "X")
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();
        var breakdown = result.RoleBreakdown.ToList();

        Assert.Equal(3, breakdown.Count);
        Assert.Equal("Investor", breakdown[0].Role);
        Assert.Equal(3,          breakdown[0].Count);
        Assert.Equal("Advisor",  breakdown[1].Role);
        Assert.Equal(2,          breakdown[1].Count);
        Assert.Equal("Partner",  breakdown[2].Role);
        Assert.Equal(1,          breakdown[2].Count);
    }

    [Fact]
    public async Task GetStatsAsync_RoleBreakdown_SingleRole_ReturnsOneEntry()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RoleBreakdown_SingleRole_ReturnsOneEntry));
        context.Stakeholders.AddRange(
            Make("A", "A", "a@x.com", "Investor", "X"),
            Make("B", "B", "b@x.com", "Investor", "X")
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Single(result.RoleBreakdown);
        Assert.Equal("Investor", result.RoleBreakdown[0].Role);
        Assert.Equal(2,          result.RoleBreakdown[0].Count);
    }

    // ── Top organisations ────────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_TopOrganisations_OrderedByCountDescending()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_TopOrganisations_OrderedByCountDescending));
        context.Stakeholders.AddRange(
            Make("A", "A", "a@x.com", "Investor", "Small"),
            Make("B", "B", "b@x.com", "Investor", "Big"),
            Make("C", "C", "c@x.com", "Advisor",  "Big"),
            Make("D", "D", "d@x.com", "Partner",  "Big")
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal("Big",   result.TopOrganisations[0].Organisation);
        Assert.Equal(3,       result.TopOrganisations[0].Count);
        Assert.Equal("Small", result.TopOrganisations[1].Organisation);
        Assert.Equal(1,       result.TopOrganisations[1].Count);
    }

    [Fact]
    public async Task GetStatsAsync_TopOrganisations_LimitedToFive()
    {
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_TopOrganisations_LimitedToFive));
        for (var i = 1; i <= 7; i++)
        {
            context.Stakeholders.Add(Make($"F{i}", $"L{i}", $"e{i}@x.com", "Investor", $"Org{i}"));
        }
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal(5, result.TopOrganisations.Count);
    }

    // ── Recent stakeholders ──────────────────────────────────────────────────

    [Fact]
    public async Task GetStatsAsync_RecentStakeholders_OrderedByCreatedAtDescending()
    {
        var base_ = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RecentStakeholders_OrderedByCreatedAtDescending));
        context.Stakeholders.AddRange(
            Make("Old", "One",   "old@x.com", "Investor", "X", base_),
            Make("Mid", "Two",   "mid@x.com", "Investor", "X", base_.AddDays(1)),
            Make("New", "Three", "new@x.com", "Investor", "X", base_.AddDays(2))
        );
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal("New", result.RecentStakeholders[0].FirstName);
        Assert.Equal("Mid", result.RecentStakeholders[1].FirstName);
        Assert.Equal("Old", result.RecentStakeholders[2].FirstName);
    }

    [Fact]
    public async Task GetStatsAsync_RecentStakeholders_LimitedToFive()
    {
        var base_ = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RecentStakeholders_LimitedToFive));
        for (var i = 0; i < 7; i++)
        {
            context.Stakeholders.Add(Make($"F{i}", $"L{i}", $"e{i}@x.com", "Investor", "X", base_.AddDays(i)));
        }
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        Assert.Equal(5, result.RecentStakeholders.Count);
    }

    [Fact]
    public async Task GetStatsAsync_RecentStakeholders_ReturnsTheMostRecentFive()
    {
        var base_ = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RecentStakeholders_ReturnsTheMostRecentFive));
        for (var i = 0; i < 7; i++)
        {
            context.Stakeholders.Add(Make($"F{i}", $"L{i}", $"e{i}@x.com", "Investor", "X", base_.AddDays(i)));
        }
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();

        // The 5 returned should have the 5 most recent CreatedAt values (days 6..2)
        var returnedDates = result.RecentStakeholders.Select(s => s.CreatedAt).ToList();
        Assert.Equal(base_.AddDays(6), returnedDates[0]);
        Assert.Equal(base_.AddDays(5), returnedDates[1]);
        Assert.Equal(base_.AddDays(2), returnedDates[4]);
    }

    [Fact]
    public async Task GetStatsAsync_RecentStakeholders_MapsAllFieldsCorrectly()
    {
        var createdAt = new DateTime(2024, 6, 15, 12, 0, 0, DateTimeKind.Utc);
        using var context = CreateInMemoryContext(nameof(GetStatsAsync_RecentStakeholders_MapsAllFieldsCorrectly));
        context.Stakeholders.Add(new Stakeholder
        {
            Id           = 42,
            FirstName    = "Alice",
            LastName     = "Johnson",
            Email        = "alice@example.com",
            Role         = "Investor",
            Organisation = "VCP",
            CreatedAt    = createdAt,
        });
        await context.SaveChangesAsync();

        var result = await new DashboardService(context).GetStatsAsync();
        var recent = result.RecentStakeholders.Single();

        Assert.Equal(42,          recent.Id);
        Assert.Equal("Alice",     recent.FirstName);
        Assert.Equal("Johnson",   recent.LastName);
        Assert.Equal("Investor",  recent.Role);
        Assert.Equal("VCP",       recent.Organisation);
        Assert.Equal(createdAt,   recent.CreatedAt);
    }
}
