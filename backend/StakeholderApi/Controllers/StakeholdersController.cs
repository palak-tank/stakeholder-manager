using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StakeholderApi.Models;
using StakeholderApi.Services;

namespace StakeholderApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StakeholdersController : ControllerBase
{
    private readonly IStakeholderService _stakeholderService;

    public StakeholdersController(IStakeholderService stakeholderService)
    {
        _stakeholderService = stakeholderService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<Stakeholder>>> GetAll(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 10)
    {
        return Ok(await _stakeholderService.GetAllStakeholdersAsync(page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Stakeholder>> GetById(int id)
    {
        var stakeholder = await _stakeholderService.GetByIdAsync(id);
        if (stakeholder is null) return NotFound();
        return Ok(stakeholder);
    }

    [HttpPost]
    public async Task<ActionResult<Stakeholder>> Create(CreateStakeholderRequest request)
    {
        var stakeholder = new Stakeholder
        {
            FirstName    = request.FirstName,
            LastName     = request.LastName,
            Email        = request.Email,
            Role         = request.Role,
            Organisation = request.Organisation,
            Title        = request.Title,
        };

        try
        {
            var created = await _stakeholderService.CreateStakeholderAsync(stakeholder);
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Stakeholder>> Update(int id, UpdateStakeholderRequest request)
    {
        try
        {
            var updated = await _stakeholderService.UpdateStakeholderAsync(id, request);
            if (updated is null) return NotFound();
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _stakeholderService.DeleteStakeholderAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
