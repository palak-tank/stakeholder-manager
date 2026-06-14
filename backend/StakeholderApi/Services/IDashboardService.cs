using StakeholderApi.Models;

namespace StakeholderApi.Services;

public interface IDashboardService
{
    Task<DashboardStats> GetStatsAsync();
}
