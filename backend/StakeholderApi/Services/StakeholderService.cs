using Microsoft.EntityFrameworkCore;
using StakeholderApi.Data;
using StakeholderApi.Models;

namespace StakeholderApi.Services;

public class StakeholderService : IStakeholderService
{
    private readonly AppDbContext _context;

    public StakeholderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<Stakeholder>> GetAllStakeholdersAsync(int page, int pageSize)
    {
        var total = await _context.Stakeholders.CountAsync();
        var items = await _context.Stakeholders
            .OrderBy(s => s.LastName)
            .Skip(page * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PagedResult<Stakeholder>(items, total);
    }

    public async Task<Stakeholder?> GetByIdAsync(int id)
    {
        return await _context.Stakeholders.FindAsync(id);
    }

    public async Task<Stakeholder> CreateStakeholderAsync(Stakeholder stakeholder)
    {
        // Normalize email so "Alice@Example.com" and "alice@example.com" are treated as duplicates.
        stakeholder.Email = stakeholder.Email.Trim().ToLowerInvariant();

        if (await _context.Stakeholders.AnyAsync(x => x.Email == stakeholder.Email))
            throw new InvalidOperationException($"A stakeholder with email '{stakeholder.Email}' already exists.");

        stakeholder.CreatedAt = DateTime.UtcNow;
        _context.Stakeholders.Add(stakeholder);
        await _context.SaveChangesAsync();
        return stakeholder;
    }

    public async Task<Stakeholder?> UpdateStakeholderAsync(int id, UpdateStakeholderRequest request)
    {
        var stakeholder = await _context.Stakeholders.FindAsync(id);
        if (stakeholder is null) return null;

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await _context.Stakeholders
            .AnyAsync(x => x.Email == normalizedEmail && x.Id != id);
        if (emailTaken)
            throw new InvalidOperationException($"A stakeholder with email '{normalizedEmail}' already exists.");

        stakeholder.FirstName = request.FirstName;
        stakeholder.LastName = request.LastName;
        stakeholder.Email = normalizedEmail;
        stakeholder.Role = request.Role;
        stakeholder.Organisation = request.Organisation;
        stakeholder.Title = request.Title;

        await _context.SaveChangesAsync();
        return stakeholder;
    }

    public async Task<bool> DeleteStakeholderAsync(int id)
    {
        var stakeholder = await _context.Stakeholders.FindAsync(id);
        if (stakeholder is null) return false;

        _context.Stakeholders.Remove(stakeholder);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return await _context.Stakeholders.AnyAsync(x => x.Email == normalized);
    }
}
