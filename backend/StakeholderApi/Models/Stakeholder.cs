namespace StakeholderApi.Models;

public class Stakeholder
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Organisation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Title { get; set; }
}
