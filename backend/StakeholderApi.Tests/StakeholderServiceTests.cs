using Microsoft.EntityFrameworkCore;
using StakeholderApi.Data;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class StakeholderServiceTests
{
    private AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_ReturnsAllStakeholders()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_ReturnsAllStakeholders));
        context.Stakeholders.AddRange(
            new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow },
            new Stakeholder { Id = 2, FirstName = "Bob", LastName = "Williams", Email = "bob@example.com", Role = "Advisor", Organisation = "TechCorp", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        var result = await service.GetAllStakeholdersAsync(0, 10);

        Assert.Equal(2, result.Items.Count());
        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_WhenNoStakeholders_ReturnsEmptyList()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_WhenNoStakeholders_ReturnsEmptyList));
        var service = new StakeholderService(context);

        var result = await service.GetAllStakeholdersAsync(0, 10);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_ReturnsStakeholdersOrderedByLastName()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_ReturnsStakeholdersOrderedByLastName));
        context.Stakeholders.AddRange(
            new Stakeholder { Id = 1, FirstName = "Carol", LastName = "Smith", Email = "carol@example.com", Role = "Partner", Organisation = "IH", CreatedAt = DateTime.UtcNow },
            new Stakeholder { Id = 2, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow },
            new Stakeholder { Id = 3, FirstName = "Bob", LastName = "Adams", Email = "bob@example.com", Role = "Advisor", Organisation = "TC", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        var result = (await service.GetAllStakeholdersAsync(0, 10)).Items.ToList();

        Assert.Equal("Adams", result[0].LastName);
        Assert.Equal("Johnson", result[1].LastName);
        Assert.Equal("Smith", result[2].LastName);
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_ReturnsCorrectStakeholderProperties()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_ReturnsCorrectStakeholderProperties));
        var createdAt = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        context.Stakeholders.Add(new Stakeholder
        {
            Id = 1,
            FirstName = "Alice",
            LastName = "Johnson",
            Email = "alice@example.com",
            Role = "Investor",
            Organisation = "VCP",
            CreatedAt = createdAt
        });
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        var result = (await service.GetAllStakeholdersAsync(0, 10)).Items.Single();

        Assert.Equal("Alice", result.FirstName);
        Assert.Equal("Johnson", result.LastName);
        Assert.Equal("alice@example.com", result.Email);
        Assert.Equal("Investor", result.Role);
        Assert.Equal("VCP", result.Organisation);
        Assert.Equal(createdAt, result.CreatedAt);
    }

    [Fact]
    public async Task CreateStakeholderAsync_PersistsAndReturnsStakeholder()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_PersistsAndReturnsStakeholder));
        var service = new StakeholderService(context);
        var stakeholder = new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP" };

        var result = await service.CreateStakeholderAsync(stakeholder);

        Assert.Equal("alice@example.com", result.Email);
        Assert.Equal(1, await context.Stakeholders.CountAsync());
    }

    [Fact]
    public async Task CreateStakeholderAsync_SetsCreatedAtToUtcNow()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_SetsCreatedAtToUtcNow));
        var service = new StakeholderService(context);
        var before = DateTime.UtcNow;

        var result = await service.CreateStakeholderAsync(
            new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP" }
        );

        Assert.True(result.CreatedAt >= before);
        Assert.Equal(DateTimeKind.Utc, result.CreatedAt.Kind);
    }

    [Fact]
    public async Task CreateStakeholderAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_DuplicateEmail_ThrowsInvalidOperationException));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateStakeholderAsync(
                new Stakeholder { FirstName = "Alice2", LastName = "Johnson2", Email = "alice@example.com", Role = "Advisor", Organisation = "TC" }
            )
        );
    }

    [Fact]
    public async Task CreateStakeholderAsync_DuplicateEmail_DoesNotPersistStakeholder()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_DuplicateEmail_DoesNotPersistStakeholder));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        try { await service.CreateStakeholderAsync(new Stakeholder { Email = "alice@example.com", Role = "Advisor", Organisation = "TC" }); }
        catch (InvalidOperationException) { }

        Assert.Equal(1, await context.Stakeholders.CountAsync());
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsStakeholder_WhenExists()
    {
        using var context = CreateInMemoryContext(nameof(GetByIdAsync_ReturnsStakeholder_WhenExists));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("alice@example.com", result.Email);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        using var context = CreateInMemoryContext(nameof(GetByIdAsync_ReturnsNull_WhenNotFound));

        var result = await new StakeholderService(context).GetByIdAsync(99);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateStakeholderAsync_UpdatesAndReturnsStakeholder()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_UpdatesAndReturnsStakeholder));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Smith", "alice@example.com", "Advisor", "NewOrg", null);
        var result = await new StakeholderService(context).UpdateStakeholderAsync(1, request);

        Assert.NotNull(result);
        Assert.Equal("Smith", result.LastName);
        Assert.Equal("Advisor", result.Role);
        Assert.Equal("NewOrg", result.Organisation);
    }

    [Fact]
    public async Task UpdateStakeholderAsync_ReturnsNull_WhenNotFound()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_ReturnsNull_WhenNotFound));

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "alice@example.com", "Investor", "VCP", null);
        var result = await new StakeholderService(context).UpdateStakeholderAsync(99, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateStakeholderAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_DuplicateEmail_ThrowsInvalidOperationException));
        context.Stakeholders.AddRange(
            new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow },
            new Stakeholder { Id = 2, FirstName = "Bob", LastName = "Williams", Email = "bob@example.com", Role = "Advisor", Organisation = "TC", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "bob@example.com", "Investor", "VCP", null);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new StakeholderService(context).UpdateStakeholderAsync(1, request)
        );
    }

    [Fact]
    public async Task DeleteStakeholderAsync_ReturnsTrueAndDeletesStakeholder()
    {
        using var context = CreateInMemoryContext(nameof(DeleteStakeholderAsync_ReturnsTrueAndDeletesStakeholder));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).DeleteStakeholderAsync(1);

        Assert.True(result);
        Assert.Equal(0, await context.Stakeholders.CountAsync());
    }

    [Fact]
    public async Task DeleteStakeholderAsync_ReturnsFalse_WhenNotFound()
    {
        using var context = CreateInMemoryContext(nameof(DeleteStakeholderAsync_ReturnsFalse_WhenNotFound));

        var result = await new StakeholderService(context).DeleteStakeholderAsync(99);

        Assert.False(result);
    }
}
