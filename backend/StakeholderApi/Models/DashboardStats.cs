namespace StakeholderApi.Models;

public record RoleCount(string Role, int Count);
public record OrgCount(string Organisation, int Count);
public record RecentStakeholder(int Id, string FirstName, string LastName, string Role, string Organisation, DateTime CreatedAt);

public record DashboardStats(
    int TotalStakeholders,
    int TotalOrganisations,
    IReadOnlyList<RoleCount> RoleBreakdown,
    IReadOnlyList<OrgCount> TopOrganisations,
    IReadOnlyList<RecentStakeholder> RecentStakeholders
);
