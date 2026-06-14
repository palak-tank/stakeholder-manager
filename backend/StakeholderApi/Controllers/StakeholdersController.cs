using System.Security.Claims;
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
    private readonly ILogger<StakeholdersController> _logger;

    public StakeholdersController(IStakeholderService stakeholderService, ILogger<StakeholdersController> logger)
    {
        _stakeholderService = stakeholderService;
        _logger = logger;
    }

    // "email" stays as-is when DefaultInboundClaimTypeMap is cleared;
    // ClaimTypes.Email is the fallback for when the middleware remaps it to the long URI form.
    private string Actor =>
        User.FindFirst("email")?.Value ??
        User.FindFirst(ClaimTypes.Email)?.Value ??
        "unknown";

    [HttpGet]
    public async Task<ActionResult<PagedResult<Stakeholder>>> GetAll(
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(page, 0);
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
            _logger.LogInformation(
                "Stakeholder created — {FullName} <{Email}> by {Actor}",
                $"{created.FirstName} {created.LastName}", created.Email, Actor);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "Create rejected — {Email} already exists (by {Actor})",
                request.Email, Actor);
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Stakeholder>> Update(int id, UpdateStakeholderRequest request)
    {
        try
        {
            var updated = await _stakeholderService.UpdateStakeholderAsync(id, request);
            if (updated is null)
            {
                _logger.LogWarning(
                    "Update failed — stakeholder #{Id} not found (by {Actor})",
                    id, Actor);
                return NotFound();
            }
            _logger.LogInformation(
                "Stakeholder #{Id} updated — {FullName} <{Email}> by {Actor}",
                id, $"{updated.FirstName} {updated.LastName}", updated.Email, Actor);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "Update rejected — email {Email} already taken (stakeholder #{Id}, by {Actor})",
                request.Email, id, Actor);
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _stakeholderService.DeleteStakeholderAsync(id);
        if (!deleted)
        {
            _logger.LogWarning(
                "Delete failed — stakeholder #{Id} not found (by {Actor})",
                id, Actor);
            return NotFound();
        }
        _logger.LogInformation("Stakeholder #{Id} deleted by {Actor}", id, Actor);
        return NoContent();
    }
}
