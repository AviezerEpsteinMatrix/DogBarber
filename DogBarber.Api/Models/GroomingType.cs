namespace DogBarber.Api.Models;

public class GroomingType
{
    public int Id { get; set; }
    public string Name { get; set; } = null!; // e.g. Small / Medium / Large
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }

    // Navigation
    public ICollection<Appointment>? Appointments { get; set; }
}
