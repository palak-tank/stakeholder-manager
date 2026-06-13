using StakeholderApi.Models;

namespace StakeholderApi.Services;

public interface IStakeholderService
{
    Task<PagedResult<Stakeholder>> GetAllStakeholdersAsync(int page, int pageSize);
    Task<Stakeholder?> GetByIdAsync(int id);
    Task<Stakeholder> CreateStakeholderAsync(Stakeholder stakeholder);
    Task<Stakeholder?> UpdateStakeholderAsync(int id, UpdateStakeholderRequest request);
    Task<bool> DeleteStakeholderAsync(int id);
}
