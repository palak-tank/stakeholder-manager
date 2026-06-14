using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using StakeholderApi.Controllers;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class AuthControllerTests
{
    private static AuthController CreateController(Mock<IAuthService> svcMock, ClaimsPrincipal? user = null)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:ExpirationHours"] = "24",
            })
            .Build();
        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.EnvironmentName).Returns("Development");

        var controller = new AuthController(svcMock.Object, config, env.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = user ?? new ClaimsPrincipal(new ClaimsIdentity()),
            }
        };
        return controller;
    }

    private static User MakeUser(string email = "alice@example.com") => new()
    {
        Id           = 1,
        Email        = email,
        PasswordHash = "",
    };

    // ── Login ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_Returns200_WithLoginResponse_OnValidCredentials()
    {
        var svc = new Mock<IAuthService>();
        svc.Setup(s => s.ValidateUserAsync("alice@example.com", "secret"))
            .ReturnsAsync(MakeUser());
        svc.Setup(s => s.GenerateJwt(It.IsAny<User>())).Returns("jwt-token");

        var result = await CreateController(svc).Login(new LoginRequest("alice@example.com", "secret"));

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<LoginResponse>(ok.Value);
        Assert.Equal("alice@example.com", body.Email);
    }

    [Fact]
    public async Task Login_SetsJwtCookie_OnValidCredentials()
    {
        var svc = new Mock<IAuthService>();
        svc.Setup(s => s.ValidateUserAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(MakeUser());
        svc.Setup(s => s.GenerateJwt(It.IsAny<User>())).Returns("jwt-token");

        var controller = CreateController(svc);
        await controller.Login(new LoginRequest("alice@example.com", "secret"));

        var setCookie = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("jwt=jwt-token", setCookie);
    }

    [Fact]
    public async Task Login_Returns401_WhenCredentialsAreInvalid()
    {
        var svc = new Mock<IAuthService>();
        svc.Setup(s => s.ValidateUserAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var result = await CreateController(svc).Login(new LoginRequest("bad@example.com", "wrong"));

        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_DoesNotSetCookie_WhenCredentialsAreInvalid()
    {
        var svc = new Mock<IAuthService>();
        svc.Setup(s => s.ValidateUserAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        var controller = CreateController(svc);
        await controller.Login(new LoginRequest("bad@example.com", "wrong"));

        Assert.False(controller.Response.Headers.ContainsKey("Set-Cookie"));
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    [Fact]
    public void Logout_Returns200()
    {
        var result = CreateController(new Mock<IAuthService>()).Logout();

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public void Logout_ClearsJwtCookie()
    {
        var controller = CreateController(new Mock<IAuthService>());
        controller.Logout();

        var setCookie = controller.Response.Headers["Set-Cookie"].ToString();
        Assert.Contains("jwt=;", setCookie);
    }

    // ── Me ───────────────────────────────────────────────────────────────────

    [Fact]
    public void Me_Returns200_WithEmail_WhenEmailClaimPresent()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("email", "alice@example.com") },
            authenticationType: "Test"));

        var result = CreateController(new Mock<IAuthService>(), user).Me();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<MeResponse>(ok.Value);
        Assert.Equal("alice@example.com", body.Email);
    }

    [Fact]
    public void Me_Returns200_WithEmail_WhenClaimTypesEmailPresent()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(System.Security.Claims.ClaimTypes.Email, "alice@example.com") },
            authenticationType: "Test"));

        var result = CreateController(new Mock<IAuthService>(), user).Me();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<MeResponse>(ok.Value);
        Assert.Equal("alice@example.com", body.Email);
    }

    [Fact]
    public void Me_Returns401_WhenNoEmailClaim()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim("sub", "1") },
            authenticationType: "Test"));

        var result = CreateController(new Mock<IAuthService>(), user).Me();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}
