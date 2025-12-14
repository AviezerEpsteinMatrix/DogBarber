using DogBarber.Api.Data;
using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using DogBarber.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DogBarber.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _svc;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomersController(CustomerService svc, UserManager<ApplicationUser> userManager)
    {
        _svc = svc;
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _svc.GetByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new { user.Id, user.UserName, user.Email, user.FirstName });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] ApplicationUser update)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _svc.GetByIdAsync(userId);
        if (user == null) return NotFound();

        user.FirstName = update.FirstName ?? user.FirstName;
        if (!string.IsNullOrWhiteSpace(update.Email) && update.Email != user.Email)
        {
            var setEmailResult = await _userManager.SetEmailAsync(user, update.Email);
            if (!setEmailResult.Succeeded) return BadRequest(setEmailResult.Errors);
        }

        await _svc.UpdateAsync(user);

        return NoContent();
    }

    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetCustomerHistory(string id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        if (id != userId) return Forbid();

        var dto = await _svc.GetCustomerHistoryAsync(id);
        return Ok(dto);
    }

    [HttpGet("appointments/view")]
    public async Task<IActionResult> GetAppointmentsView([FromQuery] DateTime? date)
    {
        var list = await _svc.GetAppointmentsViewAsync(date);
        return Ok(list);
    }
}
