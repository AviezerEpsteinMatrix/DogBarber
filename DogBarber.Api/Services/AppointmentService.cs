using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using DogBarber.Api.Repositories;

namespace DogBarber.Api.Services;

public class AppointmentService
{
    private readonly IAppointmentRepository _appointments;
    private readonly IGroomingTypeRepository _groomingTypes;

    public AppointmentService(IAppointmentRepository appointments, IGroomingTypeRepository groomingTypes)
    {
        _appointments = appointments;
        _groomingTypes = groomingTypes;
    }

    public IQueryable<Appointment> Query() => _appointments.Query();

    public async Task<Appointment?> FindAsync(int id) => await _appointments.FindAsync(id);

    public async Task<Appointment> CreateAsync(string userId, AppointmentDto dto)
    {
        var grooming = await _groomingTypes.FindAsync(dto.GroomingTypeId);
        if (grooming == null) throw new ArgumentException("Invalid grooming type");

        var pastBookings = await _appointments.CountPastBookingsAsync(userId);
        var price = grooming.Price;
        if (pastBookings > 3) price = price * 0.9m;

        var appointment = new Appointment
        {
            UserId = userId,
            GroomingTypeId = dto.GroomingTypeId,
            AppointmentDate = dto.AppointmentDate.ToUniversalTime(),
            CreatedAt = DateTime.UtcNow,
            Price = price,
            DurationMinutes = grooming.DurationMinutes
        };

        await _appointments.AddAsync(appointment);
        await _appointments.SaveChangesAsync();
        return appointment;
    }

    public async Task UpdateAsync(Appointment a, AppointmentDto dto)
    {
        var grooming = await _groomingTypes.FindAsync(dto.GroomingTypeId);
        if (grooming == null) throw new ArgumentException("Invalid grooming type");

        a.GroomingTypeId = dto.GroomingTypeId;
        a.AppointmentDate = dto.AppointmentDate.ToUniversalTime();
        a.DurationMinutes = grooming.DurationMinutes;

        var pastBookings = await _appointments.CountPastBookingsAsync(a.UserId);
        var price = grooming.Price;
        if (pastBookings > 3) price = price * 0.9m;
        a.Price = price;

        await _appointments.SaveChangesAsync();
    }

    public async Task DeleteAsync(Appointment a)
    {
        await _appointments.RemoveAsync(a);
        await _appointments.SaveChangesAsync();
    }
}
