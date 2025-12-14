using DogBarber.Api.Data;
using DogBarber.Api.Models;
using DogBarber.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroomingTypesController : ControllerBase
{
    private readonly GroomingTypeService _svc;
    public GroomingTypesController(GroomingTypeService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _svc.GetAllAsync());
}
