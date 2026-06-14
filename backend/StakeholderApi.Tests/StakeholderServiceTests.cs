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

    // ── Email normalisation ──────────────────────────────────────────────────

    [Fact]
    public async Task CreateStakeholderAsync_NormalizesEmailToLowercase()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_NormalizesEmailToLowercase));
        var service = new StakeholderService(context);

        var result = await service.CreateStakeholderAsync(
            new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "ALICE@EXAMPLE.COM", Role = "Investor", Organisation = "VCP" }
        );

        Assert.Equal("alice@example.com", result.Email);
    }

    [Fact]
    public async Task CreateStakeholderAsync_TrimsEmailWhitespace()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_TrimsEmailWhitespace));
        var service = new StakeholderService(context);

        var result = await service.CreateStakeholderAsync(
            new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "  alice@example.com  ", Role = "Investor", Organisation = "VCP" }
        );

        Assert.Equal("alice@example.com", result.Email);
    }

    [Fact]
    public async Task CreateStakeholderAsync_DuplicateEmail_IsCaseInsensitive()
    {
        using var context = CreateInMemoryContext(nameof(CreateStakeholderAsync_DuplicateEmail_IsCaseInsensitive));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var service = new StakeholderService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateStakeholderAsync(
                new Stakeholder { FirstName = "Other", LastName = "Person", Email = "ALICE@EXAMPLE.COM", Role = "Advisor", Organisation = "TC" }
            )
        );
    }

    // ── Update edge cases ────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateStakeholderAsync_KeepingOwnEmail_Succeeds()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_KeepingOwnEmail_Succeeds));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "alice@example.com", "Advisor", "VCP", null);
        var result = await new StakeholderService(context).UpdateStakeholderAsync(1, request);

        Assert.NotNull(result);
        Assert.Equal("Advisor", result.Role);
    }

    [Fact]
    public async Task UpdateStakeholderAsync_NormalizesEmailToLowercase()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_NormalizesEmailToLowercase));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "ALICE@NEWDOMAIN.COM", "Investor", "VCP", null);
        var result = await new StakeholderService(context).UpdateStakeholderAsync(1, request);

        Assert.Equal("alice@newdomain.com", result!.Email);
    }

    [Fact]
    public async Task UpdateStakeholderAsync_DuplicateEmail_IsCaseInsensitive()
    {
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_DuplicateEmail_IsCaseInsensitive));
        context.Stakeholders.AddRange(
            new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow },
            new Stakeholder { Id = 2, FirstName = "Bob", LastName = "Williams", Email = "bob@example.com", Role = "Advisor", Organisation = "TC", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "BOB@EXAMPLE.COM", "Investor", "VCP", null);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            new StakeholderService(context).UpdateStakeholderAsync(1, request)
        );
    }

    [Fact]
    public async Task UpdateStakeholderAsync_DoesNotChangeCreatedAt()
    {
        var originalCreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        using var context = CreateInMemoryContext(nameof(UpdateStakeholderAsync_DoesNotChangeCreatedAt));
        context.Stakeholders.Add(new Stakeholder { Id = 1, FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = originalCreatedAt });
        await context.SaveChangesAsync();

        var request = new UpdateStakeholderRequest("Alice", "Smith", "alice@example.com", "Advisor", "NewOrg", null);
        var result = await new StakeholderService(context).UpdateStakeholderAsync(1, request);

        Assert.Equal(originalCreatedAt, result!.CreatedAt);
    }

    // ── Pagination ───────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAllStakeholdersAsync_Pagination_ReturnsCorrectPage()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_Pagination_ReturnsCorrectPage));
        context.Stakeholders.AddRange(
            new Stakeholder { FirstName = "A", LastName = "Apple",  Email = "a@a.com", Role = "Investor", Organisation = "X", CreatedAt = DateTime.UtcNow },
            new Stakeholder { FirstName = "B", LastName = "Banana", Email = "b@b.com", Role = "Advisor",  Organisation = "X", CreatedAt = DateTime.UtcNow },
            new Stakeholder { FirstName = "C", LastName = "Cherry", Email = "c@c.com", Role = "Partner",  Organisation = "X", CreatedAt = DateTime.UtcNow },
            new Stakeholder { FirstName = "D", LastName = "Date",   Email = "d@d.com", Role = "Mentor",   Organisation = "X", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        // page=1, pageSize=2 → skip 2 → Cherry, Date (sorted by LastName)
        var result = await new StakeholderService(context).GetAllStakeholdersAsync(page: 1, pageSize: 2);

        Assert.Equal(2, result.Items.Count());
        Assert.Equal("Cherry", result.Items.First().LastName);
        Assert.Equal("Date", result.Items.Last().LastName);
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_Pagination_TotalCountReflectsAllRecords()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_Pagination_TotalCountReflectsAllRecords));
        context.Stakeholders.AddRange(
            new Stakeholder { FirstName = "A", LastName = "Apple",  Email = "a@a.com", Role = "Investor", Organisation = "X", CreatedAt = DateTime.UtcNow },
            new Stakeholder { FirstName = "B", LastName = "Banana", Email = "b@b.com", Role = "Advisor",  Organisation = "X", CreatedAt = DateTime.UtcNow },
            new Stakeholder { FirstName = "C", LastName = "Cherry", Email = "c@c.com", Role = "Partner",  Organisation = "X", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).GetAllStakeholdersAsync(page: 1, pageSize: 2);

        Assert.Equal(3, result.TotalCount); // all records, not just this page
        Assert.Single(result.Items);        // only the 1 remaining item on page 1
    }

    [Fact]
    public async Task GetAllStakeholdersAsync_PageBeyondEnd_ReturnsEmptyItems()
    {
        using var context = CreateInMemoryContext(nameof(GetAllStakeholdersAsync_PageBeyondEnd_ReturnsEmptyItems));
        context.Stakeholders.Add(new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "a@a.com", Role = "Investor", Organisation = "X", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).GetAllStakeholdersAsync(page: 5, pageSize: 10);

        Assert.Empty(result.Items);
        Assert.Equal(1, result.TotalCount);
    }

    // ── EmailExistsAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task EmailExistsAsync_ReturnsTrue_WhenEmailExists()
    {
        using var context = CreateInMemoryContext(nameof(EmailExistsAsync_ReturnsTrue_WhenEmailExists));
        context.Stakeholders.Add(new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).EmailExistsAsync("alice@example.com");

        Assert.True(result);
    }

    [Fact]
    public async Task EmailExistsAsync_ReturnsFalse_WhenEmailNotFound()
    {
        using var context = CreateInMemoryContext(nameof(EmailExistsAsync_ReturnsFalse_WhenEmailNotFound));

        var result = await new StakeholderService(context).EmailExistsAsync("nobody@example.com");

        Assert.False(result);
    }

    [Fact]
    public async Task EmailExistsAsync_IsCaseInsensitive()
    {
        using var context = CreateInMemoryContext(nameof(EmailExistsAsync_IsCaseInsensitive));
        context.Stakeholders.Add(new Stakeholder { FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", Role = "Investor", Organisation = "VCP", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        var result = await new StakeholderService(context).EmailExistsAsync("ALICE@EXAMPLE.COM");

        Assert.True(result);
    }
}
