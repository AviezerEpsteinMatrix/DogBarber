using DogBarber.Api.Data;
using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DogBarber.Api.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _db;
    public CustomerRepository(AppDbContext db) => _db = db;

    public async Task<ApplicationUser?> GetByIdAsync(string id) => await _db.Users.FindAsync(id);

    public async Task UpdateAsync(ApplicationUser user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task<CustomerHistoryDto> GetCustomerHistoryAsync(string customerId)
    {
        var dto = new CustomerHistoryDto { BookingCount = 0, LastAppointmentDate = null };
        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "sp_GetCustomerAppointmentHistory";
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        var param = cmd.CreateParameter();
        param.ParameterName = "@CustomerId";
        param.Value = customerId;
        cmd.Parameters.Add(param);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            dto.BookingCount = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
            dto.LastAppointmentDate = reader.IsDBNull(1) ? null : reader.GetDateTime(1);
        }

        return dto;
    }

    public async Task<List<object>> GetAppointmentsViewAsync(DateTime? date)
    {
        var sql = "SELECT Id, UserId, UserName, FirstName, Email, GroomingTypeId, DogSize, Price, DurationMinutes, AppointmentDate, CreatedAt FROM vw_AppointmentDetails";
        if (date.HasValue)
        {
            sql += " WHERE CAST(AppointmentDate AS DATE) = @d";
        }

        var list = new List<object>();
        await using var conn = _db.Database.GetDbConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        if (date.HasValue)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = "@d";
            p.Value = date.Value.Date;
            cmd.Parameters.Add(p);
        }

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new
            {
                Id = reader.GetInt32(0),
                UserId = reader.GetString(1),
                UserName = reader.IsDBNull(2) ? null : reader.GetString(2),
                FirstName = reader.IsDBNull(3) ? null : reader.GetString(3),
                Email = reader.IsDBNull(4) ? null : reader.GetString(4),
                GroomingTypeId = reader.GetInt32(5),
                DogSize = reader.IsDBNull(6) ? null : reader.GetString(6),
                Price = reader.GetDecimal(7),
                DurationMinutes = reader.GetInt32(8),
                AppointmentDate = reader.GetDateTime(9),
                CreatedAt = reader.GetDateTime(10)
            });
        }

        return list;
    }
}
