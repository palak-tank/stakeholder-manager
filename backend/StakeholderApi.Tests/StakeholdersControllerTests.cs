using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using StakeholderApi.Controllers;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class StakeholdersControllerTests
{
    private static StakeholdersController CreateController(Mock<IStakeholderService> svcMock)
    {
        var logger = new Mock<ILogger<StakeholdersController>>();
        var controller = new StakeholdersController(svcMock.Object, logger.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim("email", "actor@example.com") },
                    authenticationType: "Test"))
            }
        };
        return controller;
    }

    private static Stakeholder MakeStakeholder(int id = 1) => new()
    {
        Id           = id,
        FirstName    = "Alice",
        LastName     = "Johnson",
        Email        = "alice@example.com",
        Role         = "Investor",
        Organisation = "Acme Corp",
        CreatedAt    = DateTime.UtcNow,
    };

    // ── GetAll ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAll_Returns200_WithPagedResult()
    {
        var paged = new PagedResult<Stakeholder>(new[] { MakeStakeholder() }, 1);
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.GetAllStakeholdersAsync(0, 10)).ReturnsAsync(paged);

        var result = await CreateController(svc).GetAll(0, 10);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PagedResult<Stakeholder>>(ok.Value);
        Assert.Equal(1, body.TotalCount);
    }

    [Fact]
    public async Task GetAll_PassesPageAndPageSizeToService()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.GetAllStakeholdersAsync(2, 25))
            .ReturnsAsync(new PagedResult<Stakeholder>(Array.Empty<Stakeholder>(), 0));

        await CreateController(svc).GetAll(2, 25);

        svc.Verify(s => s.GetAllStakeholdersAsync(2, 25), Times.Once);
    }

    // ── GetById ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetById_Returns200_WhenStakeholderExists()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(MakeStakeholder());

        var result = await CreateController(svc).GetById(1);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<Stakeholder>(ok.Value);
        Assert.Equal(1, body.Id);
    }

    [Fact]
    public async Task GetById_Returns404_WhenNotFound()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((Stakeholder?)null);

        var result = await CreateController(svc).GetById(99);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_Returns201_WithCreatedStakeholder()
    {
        var created = MakeStakeholder();
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.CreateStakeholderAsync(It.IsAny<Stakeholder>())).ReturnsAsync(created);

        var request = new CreateStakeholderRequest("Alice", "Johnson", "alice@example.com", "Investor", "Acme Corp", null);
        var result = await CreateController(svc).Create(request);

        var createdAt = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdAt.StatusCode);
        var body = Assert.IsType<Stakeholder>(createdAt.Value);
        Assert.Equal("alice@example.com", body.Email);
    }

    [Fact]
    public async Task Create_Returns409_OnDuplicateEmail()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.CreateStakeholderAsync(It.IsAny<Stakeholder>()))
            .ThrowsAsync(new InvalidOperationException("Email already exists."));

        var request = new CreateStakeholderRequest("Alice", "Johnson", "alice@example.com", "Investor", "Acme Corp", null);
        var result = await CreateController(svc).Create(request);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_Returns200_WithUpdatedStakeholder()
    {
        var updated = MakeStakeholder();
        updated.LastName = "Smith";
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.UpdateStakeholderAsync(1, It.IsAny<UpdateStakeholderRequest>()))
            .ReturnsAsync(updated);

        var request = new UpdateStakeholderRequest("Alice", "Smith", "alice@example.com", "Investor", "Acme Corp", null);
        var result = await CreateController(svc).Update(1, request);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<Stakeholder>(ok.Value);
        Assert.Equal("Smith", body.LastName);
    }

    [Fact]
    public async Task Update_Returns404_WhenNotFound()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.UpdateStakeholderAsync(99, It.IsAny<UpdateStakeholderRequest>()))
            .ReturnsAsync((Stakeholder?)null);

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "alice@example.com", "Investor", "Acme Corp", null);
        var result = await CreateController(svc).Update(99, request);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_Returns409_OnDuplicateEmail()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.UpdateStakeholderAsync(1, It.IsAny<UpdateStakeholderRequest>()))
            .ThrowsAsync(new InvalidOperationException("Email already taken."));

        var request = new UpdateStakeholderRequest("Alice", "Johnson", "bob@example.com", "Investor", "Acme Corp", null);
        var result = await CreateController(svc).Update(1, request);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_Returns204_WhenDeleted()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.DeleteStakeholderAsync(1)).ReturnsAsync(true);

        var result = await CreateController(svc).Delete(1);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_Returns404_WhenNotFound()
    {
        var svc = new Mock<IStakeholderService>();
        svc.Setup(s => s.DeleteStakeholderAsync(99)).ReturnsAsync(false);

        var result = await CreateController(svc).Delete(99);

        Assert.IsType<NotFoundResult>(result);
    }
}
