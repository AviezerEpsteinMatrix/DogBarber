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
            FirstName = a.User.FirstName,
            a.AppointmentDate,
            GroomingType = a.GroomingType.Name,
            a.Price
        }).ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var a = await _svc.FindAsync(id);
        if (a == null) return NotFound();
        await Task.CompletedTask; // keep async
        return Ok(new
        {
            a.Id,
            a.AppointmentDate,
            a.CreatedAt,
            UserName = a.User.UserName,
            FirstName = a.User.FirstName,
            GroomingType = a.GroomingType.Name,
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

            var response = new
            {
                appointment.Id,
                appointment.AppointmentDate,
                appointment.CreatedAt,
                UserName = user.UserName,
                FirstName = user.FirstName,
                GroomingType = (await _svc.FindAsync(appointment.Id)).GroomingType.Name,
                appointment.Price,
                appointment.DurationMinutes
            };

            return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, response);
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var a = await _svc.FindAsync(id);
        if (a == null) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (a.UserId != userId) return Forbid();

        if (a.AppointmentDate.Date == DateTime.UtcNow.Date) return BadRequest("Cannot delete appointment on the same day");

        await _svc.DeleteAsync(a);
        return NoContent();
    }

    // Expose stored-procedure based customer history for the currently authenticated user
    [HttpGet("history")]
    public async Task<IActionResult> GetMyHistory()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId == null) return Unauthorized();

        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();

        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "sp_GetCustomerAppointmentHistory";
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        var param = cmd.CreateParameter();
        param.ParameterName = "@CustomerId";
        param.Value = userId;
        cmd.Parameters.Add(param);

        var dto = new CustomerHistoryDto { BookingCount = 0, LastAppointmentDate = null };

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            dto.BookingCount = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
            dto.LastAppointmentDate = reader.IsDBNull(1) ? null : reader.GetDateTime(1);
        }

        return Ok(dto);
    }

    // Expose the SQL view for appointment details (optional date filter)
    [HttpGet("view")]
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
