using StakeholderApi.Models;

namespace StakeholderApi.Services;

public interface IAuthService
{
    Task<User?> ValidateUserAsync(string email, string password);
    string GenerateJwt(User user);
}
