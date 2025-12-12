using DogBarber.Api.Data;
using DogBarber.Api.Dto;
using DogBarber.Api.Models;
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
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public AppointmentsController(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // List waiting customers (filter by name/date)
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? name, [FromQuery] DateTime? date)
    {
        var query = _db.Appointments.Include(a => a.User).Include(a => a.GroomingType).AsQueryable();
        if (!string.IsNullOrWhiteSpace(name))
            query = query.Where(a => a.User.UserName.Contains(name) || a.User.FirstName.Contains(name));
        if (date.HasValue)
        {
            var d = date.Value.Date;
            query = query.Where(a => a.AppointmentDate.Date == d);
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
        var a = await _db.Appointments.Include(x => x.User).Include(x => x.GroomingType).FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();
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
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return Unauthorized();

        var grooming = await _db.GroomingTypes.FindAsync(dto.GroomingTypeId);
        if (grooming == null) return BadRequest("Invalid grooming type");

        // Calculate price and duration, apply discount if needed
        var pastBookings = await _db.Appointments.CountAsync(x => x.UserId == user.Id && x.AppointmentDate < DateTime.UtcNow);
        var price = grooming.Price;
        if (pastBookings > 3) price = price * 0.9m; // 10% discount for more than 3 past bookings

        var appointment = new Appointment
        {
            UserId = user.Id,
            GroomingTypeId = dto.GroomingTypeId,
            AppointmentDate = dto.AppointmentDate.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            Price = price,
            DurationMinutes = grooming.DurationMinutes
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, appointment);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AppointmentDto dto)
    {
        var a = await _db.Appointments.FindAsync(id);
        if (a == null) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (a.UserId != userId) return Forbid();

        // cannot edit same day
        if (a.AppointmentDate.Date == DateTime.UtcNow.Date) return BadRequest("Cannot edit appointment on the same day");

        var grooming = await _db.GroomingTypes.FindAsync(dto.GroomingTypeId);
        if (grooming == null) return BadRequest("Invalid grooming type");

        a.GroomingTypeId = dto.GroomingTypeId;
        a.AppointmentDate = dto.AppointmentDate.ToUniversalTime();
        a.DurationMinutes = grooming.DurationMinutes;

        // Recalculate price with discount rule
        var pastBookings = await _db.Appointments.CountAsync(x => x.UserId == a.UserId && x.AppointmentDate < DateTime.UtcNow);
        var price = grooming.Price;
        if (pastBookings > 3) price = price * 0.9m;
        a.Price = price;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var a = await _db.Appointments.FindAsync(id);
        if (a == null) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (a.UserId != userId) return Forbid();

        // cannot delete same day
        if (a.AppointmentDate.Date == DateTime.UtcNow.Date) return BadRequest("Cannot delete appointment on the same day");

        _db.Appointments.Remove(a);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
