using StakeholderApi.Models;

namespace StakeholderApi.Services;

public interface IStakeholderService
{
    Task<IEnumerable<Stakeholder>> GetAllStakeholdersAsync();
    Task<Stakeholder> CreateStakeholderAsync(Stakeholder stakeholder);
}
