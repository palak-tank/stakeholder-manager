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

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _authService.ValidateUserAsync(request.Email, request.Password);
        if (user is null) return Unauthorized(new { message = "Invalid email or password." });

        var token = _authService.GenerateJwt(user);

        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddHours(24),
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
