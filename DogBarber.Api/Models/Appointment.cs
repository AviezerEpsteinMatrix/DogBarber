using System;

namespace DogBarber.Api.Models;

public class Appointment
{
    public int Id { get; set; }

    public string UserId { get; set; } = null!;
    public ApplicationUser? User { get; set; }

    public int GroomingTypeId { get; set; }
    public GroomingType? GroomingType { get; set; }

    public DateTime AppointmentDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
}
