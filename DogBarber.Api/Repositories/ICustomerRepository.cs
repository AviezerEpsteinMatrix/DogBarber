using DogBarber.Api.Dto;
using DogBarber.Api.Models;

namespace DogBarber.Api.Repositories;

public interface ICustomerRepository
{
    Task<ApplicationUser?> GetByIdAsync(string id);
    Task UpdateAsync(ApplicationUser user);
    Task<CustomerHistoryDto> GetCustomerHistoryAsync(string customerId);
    Task<List<object>> GetAppointmentsViewAsync(DateTime? date);
}
