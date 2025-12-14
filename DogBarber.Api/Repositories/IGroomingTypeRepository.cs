using DogBarber.Api.Models;

namespace DogBarber.Api.Repositories;

public interface IGroomingTypeRepository
{
    IQueryable<GroomingType> Query();
    Task<List<GroomingType>> GetAllAsync();
    Task<GroomingType?> FindAsync(int id);
}
