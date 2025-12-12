namespace DogBarber.Api.Models;

using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }

    // Navigation
    public ICollection<Appointment>? Appointments { get; set; }
}
