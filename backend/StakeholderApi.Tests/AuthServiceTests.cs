using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using StakeholderApi.Data;
using StakeholderApi.Models;
using StakeholderApi.Services;
using Xunit;

namespace StakeholderApi.Tests;

public class AuthServiceTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"]          = "test-secret-key-that-is-long-enough-for-hmacsha256",
                ["Jwt:ExpirationHours"] = "24",
                ["Jwt:Issuer"]          = "test-issuer",
                ["Jwt:Audience"]        = "test-audience",
            })
            .Build();

    private static User MakeUser(string email, string password, int id = 1) => new()
    {
        Id           = id,
        Email        = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 4),
    };

    // ── ValidateUserAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task ValidateUserAsync_ReturnsUser_WhenCredentialsAreCorrect()
    {
        using var ctx = CreateInMemoryContext(nameof(ValidateUserAsync_ReturnsUser_WhenCredentialsAreCorrect));
        ctx.Users.Add(MakeUser("alice@example.com", "secret"));
        await ctx.SaveChangesAsync();

        var result = await new AuthService(ctx, BuildConfig())
            .ValidateUserAsync("alice@example.com", "secret");

        Assert.NotNull(result);
        Assert.Equal("alice@example.com", result.Email);
    }

    [Fact]
    public async Task ValidateUserAsync_ReturnsNull_WhenUserNotFound()
    {
        using var ctx = CreateInMemoryContext(nameof(ValidateUserAsync_ReturnsNull_WhenUserNotFound));

        var result = await new AuthService(ctx, BuildConfig())
            .ValidateUserAsync("nobody@example.com", "secret");

        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateUserAsync_ReturnsNull_WhenPasswordIsWrong()
    {
        using var ctx = CreateInMemoryContext(nameof(ValidateUserAsync_ReturnsNull_WhenPasswordIsWrong));
        ctx.Users.Add(MakeUser("alice@example.com", "correct"));
        await ctx.SaveChangesAsync();

        var result = await new AuthService(ctx, BuildConfig())
            .ValidateUserAsync("alice@example.com", "wrong");

        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateUserAsync_IsCaseInsensitiveForEmail()
    {
        using var ctx = CreateInMemoryContext(nameof(ValidateUserAsync_IsCaseInsensitiveForEmail));
        ctx.Users.Add(MakeUser("alice@example.com", "secret"));
        await ctx.SaveChangesAsync();

        var result = await new AuthService(ctx, BuildConfig())
            .ValidateUserAsync("ALICE@EXAMPLE.COM", "secret");

        Assert.NotNull(result);
    }

    [Fact]
    public async Task ValidateUserAsync_TrimsEmailWhitespace()
    {
        using var ctx = CreateInMemoryContext(nameof(ValidateUserAsync_TrimsEmailWhitespace));
        ctx.Users.Add(MakeUser("alice@example.com", "secret"));
        await ctx.SaveChangesAsync();

        var result = await new AuthService(ctx, BuildConfig())
            .ValidateUserAsync("  alice@example.com  ", "secret");

        Assert.NotNull(result);
    }

    // ── GenerateJwt ──────────────────────────────────────────────────────────

    [Fact]
    public void GenerateJwt_ReturnsNonEmptyString()
    {
        var user = new User { Id = 1, Email = "alice@example.com", PasswordHash = "" };

        var token = new AuthService(null!, BuildConfig()).GenerateJwt(user);

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void GenerateJwt_TokenContainsEmailClaim()
    {
        var user = new User { Id = 1, Email = "alice@example.com", PasswordHash = "" };
        var token = new AuthService(null!, BuildConfig()).GenerateJwt(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var email = jwt.Claims.FirstOrDefault(c =>
            c.Type == JwtRegisteredClaimNames.Email || c.Type == "email")?.Value;

        Assert.Equal("alice@example.com", email);
    }

    [Fact]
    public void GenerateJwt_TokenContainsSubClaim()
    {
        var user = new User { Id = 42, Email = "alice@example.com", PasswordHash = "" };
        var token = new AuthService(null!, BuildConfig()).GenerateJwt(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var sub = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;

        Assert.Equal("42", sub);
    }

    [Fact]
    public void GenerateJwt_TokenExpiresInFuture()
    {
        var user = new User { Id = 1, Email = "alice@example.com", PasswordHash = "" };
        var token = new AuthService(null!, BuildConfig()).GenerateJwt(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.True(jwt.ValidTo > DateTime.UtcNow);
    }

    [Fact]
    public void GenerateJwt_TokenExpiresApproximatelyAfterConfiguredHours()
    {
        var user = new User { Id = 1, Email = "alice@example.com", PasswordHash = "" };
        var before = DateTime.UtcNow;
        var token = new AuthService(null!, BuildConfig()).GenerateJwt(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var expectedExpiry = before.AddHours(24);

        Assert.True(jwt.ValidTo >= expectedExpiry.AddMinutes(-1));
        Assert.True(jwt.ValidTo <= expectedExpiry.AddMinutes(1));
    }
}
