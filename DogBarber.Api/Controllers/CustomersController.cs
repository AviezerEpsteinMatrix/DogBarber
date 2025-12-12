using DogBarber.Api.Data;
using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomersController(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new { user.Id, user.UserName, user.Email, user.FirstName });
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] ApplicationUser update)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.FirstName = update.FirstName ?? user.FirstName;
        if (!string.IsNullOrWhiteSpace(update.Email) && update.Email != user.Email)
        {
            var setEmailResult = await _userManager.SetEmailAsync(user, update.Email);
            if (!setEmailResult.Succeeded) return BadRequest(setEmailResult.Errors);
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return NoContent();
    }

    [HttpGet("{id}/history")]
    public async Task<IActionResult> GetCustomerHistory(string id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        if (id != userId) return Forbid();

        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "sp_GetCustomerAppointmentHistory";
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        var param = cmd.CreateParameter();
        param.ParameterName = "@CustomerId";
        param.Value = id;
        cmd.Parameters.Add(param);

        CustomerHistoryDto dto = new CustomerHistoryDto { BookingCount = 0, LastAppointmentDate = null };

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            dto.BookingCount = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
            dto.LastAppointmentDate = reader.IsDBNull(1) ? null : reader.GetDateTime(1);
        }

        return Ok(dto);
    }

    [HttpGet("appointments/view")]
    public async Task<IActionResult> GetAppointmentsView([FromQuery] DateTime? date)
    {
        var sql = "SELECT Id, UserId, UserName, FirstName, Email, GroomingTypeId, DogSize, Price, DurationMinutes, AppointmentDate, CreatedAt FROM vw_AppointmentDetails";
        if (date.HasValue)
        {
            sql += " WHERE CAST(AppointmentDate AS DATE) = @d";
        }

        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        if (date.HasValue)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = "@d";
            p.Value = date.Value.Date;
            cmd.Parameters.Add(p);
        }

        var list = new List<object>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new
            {
                Id = reader.GetInt32(0),
                UserId = reader.GetString(1),
                UserName = reader.IsDBNull(2) ? null : reader.GetString(2),
                FirstName = reader.IsDBNull(3) ? null : reader.GetString(3),
                Email = reader.IsDBNull(4) ? null : reader.GetString(4),
                GroomingTypeId = reader.GetInt32(5),
                DogSize = reader.IsDBNull(6) ? null : reader.GetString(6),
                Price = reader.GetDecimal(7),
                DurationMinutes = reader.GetInt32(8),
                AppointmentDate = reader.GetDateTime(9),
                CreatedAt = reader.GetDateTime(10)
            });
        }

        return Ok(list);
    }
}
