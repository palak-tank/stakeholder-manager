using Microsoft.AspNetCore.Mvc;
using StakeholderApi.Models;
using StakeholderApi.Services;

namespace StakeholderApi.Controllers;

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
    public async Task<ActionResult<IEnumerable<Stakeholder>>> GetAll()
    {
        return Ok(await _stakeholderService.GetAllStakeholdersAsync());
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
}
