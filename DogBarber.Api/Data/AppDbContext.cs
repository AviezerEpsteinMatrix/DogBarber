using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DogBarber.Api.Models;

namespace DogBarber.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<GroomingType> GroomingTypes { get; set; } = null!;
    public DbSet<Appointment> Appointments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<GroomingType>().HasData(
            new GroomingType { Id = 1, Name = "Small", DurationMinutes = 30, Price = 100m },
            new GroomingType { Id = 2, Name = "Medium", DurationMinutes = 45, Price = 150m },
            new GroomingType { Id = 3, Name = "Large", DurationMinutes = 60, Price = 200m }
        );

        builder.Entity<Appointment>()
            .HasOne(a => a.User)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Appointment>()
            .HasOne(a => a.GroomingType)
            .WithMany(gt => gt.Appointments)
            .HasForeignKey(a => a.GroomingTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
