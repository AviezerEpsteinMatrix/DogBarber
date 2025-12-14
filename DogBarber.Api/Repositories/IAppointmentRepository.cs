using DogBarber.Api.Models;
using System.Linq.Expressions;

namespace DogBarber.Api.Repositories;

public interface IAppointmentRepository
{
    IQueryable<Appointment> Query();
    Task<Appointment?> FindAsync(int id);
    Task AddAsync(Appointment appointment);
    Task RemoveAsync(Appointment appointment);
    Task SaveChangesAsync();
    Task<int> CountPastBookingsAsync(string userId);
}
