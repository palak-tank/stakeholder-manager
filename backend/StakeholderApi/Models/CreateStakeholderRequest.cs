namespace StakeholderApi.Models;

// Separates the API input contract from the Stakeholder entity,
// so clients can't accidentally set Id or CreatedAt.
public record CreateStakeholderRequest(
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string Organisation,
    string? Title
);
