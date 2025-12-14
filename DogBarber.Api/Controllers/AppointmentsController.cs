using DogBarber.Api.Data;
using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using DogBarber.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AppointmentService _svc;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _db;

    public AppointmentsController(AppointmentService svc, UserManager<ApplicationUser> userManager, AppDbContext db)
    {
        _svc = svc;
        _userManager = userManager;
        _db = db;
    }

    // Minimal list: each row shows customer's name, appointment time, grooming type
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? name, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var query = _svc.Query().Include(a => a.User).Include(a => a.GroomingType).AsQueryable();
        if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(a => a.User.UserName.Contains(name) || a.User.FirstName.Contains(name));

        if (fromDate.HasValue)
        {
            var start = fromDate.Value.Date;
            query = query.Where(a => a.AppointmentDate >= start);
        }

        if (toDate.HasValue)
        {
            var endExclusive = toDate.Value.Date.AddDays(1);
            query = query.Where(a => a.AppointmentDate < endExclusive);
        }

        var list = await query.OrderBy(a => a.AppointmentDate).Select(a => new
        {
            a.Id,
            UserName = a.User.UserName,
            AppointmentDate = a.AppointmentDate,
            GroomingType = a.GroomingType.Name
        }).ToListAsync();

        return Ok(list);
    }

    // Full details for popup — includes createdAt and grooming details
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var a = await _svc.Query().Include(x => x.User).Include(x => x.GroomingType).FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();

        return Ok(new
        {
            a.Id,
            a.AppointmentDate,
            a.CreatedAt,
            UserName = a.User?.UserName,
            FirstName = a.User?.FirstName,
            GroomingType = a.GroomingType?.Name,
            a.Price,
            a.DurationMinutes
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppointmentDto dto)
    {
        var requestedUtc = dto.AppointmentDate.ToUniversalTime();
        if (requestedUtc <= DateTime.UtcNow)
            return BadRequest("Appointment date must be in the future");

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        try
        {
            var appointment = await _svc.CreateAsync(user.Id, dto);
            var created = await _svc.Query().Include(x => x.GroomingType).FirstOrDefaultAsync(x => x.Id == appointment.Id);

            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, new
            {
                appointment.Id,
                appointment.AppointmentDate,
                appointment.CreatedAt,
                UserName = user.UserName,
                FirstName = user.FirstName,
                GroomingType = created?.GroomingType?.Name,
                appointment.Price,
                appointment.DurationMinutes
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AppointmentDto dto)
    {
        var a = await _svc.FindAsync(id);
        if (a == null) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (a.UserId != userId) return Forbid();

        if (a.AppointmentDate.ToUniversalTime() <= DateTime.UtcNow)
            return BadRequest("Cannot edit past appointments");

        var requestedUtc = dto.AppointmentDate.ToUniversalTime();
        if (requestedUtc <= DateTime.UtcNow)
            return BadRequest("Appointment date must be in the future");

        try
        {
            await _svc.UpdateAsync(a, dto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Use stored procedure to delete appointment: enforces ownership and same-day rule inside DB
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "sp_DeleteAppointment";
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        var p1 = cmd.CreateParameter();
        p1.ParameterName = "@AppointmentId";
        p1.Value = id;
        cmd.Parameters.Add(p1);

        var p2 = cmd.CreateParameter();
        p2.ParameterName = "@UserId";
        p2.Value = userId;
        cmd.Parameters.Add(p2);

        int affected = 0;
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                affected = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
            }
        }

        if (affected == 0) return BadRequest("Cannot delete appointment. Either it does not exist, does not belong to you, or is scheduled for today.");

        return NoContent();
    }
}
