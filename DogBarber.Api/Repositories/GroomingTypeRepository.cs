using DogBarber.Api.Data;
using DogBarber.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Repositories;

public class GroomingTypeRepository : IGroomingTypeRepository
{
    private readonly AppDbContext _db;
    public GroomingTypeRepository(AppDbContext db) => _db = db;

    public IQueryable<GroomingType> Query() => _db.GroomingTypes;

    public async Task<List<GroomingType>> GetAllAsync() => await _db.GroomingTypes.ToListAsync();

    public async Task<GroomingType?> FindAsync(int id) => await _db.GroomingTypes.FindAsync(id);
}
