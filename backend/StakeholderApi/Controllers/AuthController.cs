using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StakeholderApi.Models;
using StakeholderApi.Services;
using System.Security.Claims;

namespace StakeholderApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IConfiguration config, IWebHostEnvironment env)
    {
        _authService = authService;
        _config = config;
        _env = env;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _authService.ValidateUserAsync(request.Email, request.Password);
        if (user is null) return Unauthorized(new { message = "Invalid email or password." });

        var token = _authService.GenerateJwt(user);
        var expirationHours = int.Parse(_config["Jwt:ExpirationHours"] ?? "24");

        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddHours(expirationHours),
            Path = "/"
        });

        return Ok(new LoginResponse(user.Email));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.MinValue,
            Path = "/"
        });
        return Ok();
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<MeResponse> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                 ?? User.FindFirstValue("email");
        if (email is null) return Unauthorized();
        return Ok(new MeResponse(email));
    }
}
