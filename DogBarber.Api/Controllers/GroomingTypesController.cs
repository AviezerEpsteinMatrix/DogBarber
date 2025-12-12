using DogBarber.Api.Data;
using DogBarber.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroomingTypesController : ControllerBase
{
    private readonly AppDbContext _db;
    public GroomingTypesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _db.GroomingTypes.ToListAsync());
}
