namespace StakeholderApi.Models;

public record UpdateStakeholderRequest(
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string Organisation,
    string? Title
);
