using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using DogBarber.Api.Repositories;

namespace DogBarber.Api.Services;

public class CustomerService
{
    private readonly ICustomerRepository _repo;
    public CustomerService(ICustomerRepository repo) => _repo = repo;

    public async Task<ApplicationUser?> GetByIdAsync(string id) => await _repo.GetByIdAsync(id);
    public async Task UpdateAsync(ApplicationUser user) => await _repo.UpdateAsync(user);
    public async Task<CustomerHistoryDto> GetCustomerHistoryAsync(string id) => await _repo.GetCustomerHistoryAsync(id);
    public async Task<List<object>> GetAppointmentsViewAsync(DateTime? date) => await _repo.GetAppointmentsViewAsync(date);
}
