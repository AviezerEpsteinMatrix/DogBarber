using DogBarber.Api.Models;
using DogBarber.Api.Repositories;

namespace DogBarber.Api.Services;

public class GroomingTypeService
{
    private readonly IGroomingTypeRepository _repo;
    public GroomingTypeService(IGroomingTypeRepository repo) => _repo = repo;

    public async Task<List<GroomingType>> GetAllAsync() => await _repo.GetAllAsync();
    public async Task<GroomingType?> FindAsync(int id) => await _repo.FindAsync(id);
}
