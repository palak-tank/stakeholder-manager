using StakeholderApi.Models;

namespace StakeholderApi.Services;

public interface IStakeholderService
{
    Task<PagedResult<Stakeholder>> GetAllStakeholdersAsync(int page, int pageSize);
    Task<Stakeholder> CreateStakeholderAsync(Stakeholder stakeholder);
}
