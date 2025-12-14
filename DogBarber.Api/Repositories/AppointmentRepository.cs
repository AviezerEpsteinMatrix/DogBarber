using DogBarber.Api.Data;
using DogBarber.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly AppDbContext _db;
    public AppointmentRepository(AppDbContext db) => _db = db;

    public IQueryable<Appointment> Query() => _db.Appointments;

    public async Task<Appointment?> FindAsync(int id) => await _db.Appointments.FindAsync(id);

    public async Task AddAsync(Appointment appointment)
    {
        await _db.Appointments.AddAsync(appointment);
    }

    public async Task RemoveAsync(Appointment appointment)
    {
        _db.Appointments.Remove(appointment);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync() => await _db.SaveChangesAsync();

    public async Task<int> CountPastBookingsAsync(string userId) => await _db.Appointments.CountAsync(x => x.UserId == userId && x.AppointmentDate < DateTime.UtcNow);
}
