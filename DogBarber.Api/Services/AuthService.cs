using DogBarber.Api.Dto;
using DogBarber.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DogBarber.Api.Services;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<IdentityResult> RegisterAsync(RegisterDto dto)
    {
        var user = new ApplicationUser { UserName = dto.UserName, Email = dto.Email, FirstName = dto.FirstName };
        var result = await _userManager.CreateAsync(user, dto.Password);
        return result;
    }

    public async Task<string?> LoginAsync(LoginDto dto)
    {
        // allow login by username or email
        var user = await _userManager.FindByNameAsync(dto.UserName);
        if (user == null)
            user = await _userManager.FindByEmailAsync(dto.UserName);
        if (user == null) return null;

        var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!valid) return null;

        var jwtSection = _configuration.GetSection("Jwt");
        var jwtKey = jwtSection.GetValue<string>("Key") ?? "DevelopmentKey_should_be_changed";
        var issuer = jwtSection.GetValue<string>("Issuer") ?? "DogBarberApi";
        var audience = jwtSection.GetValue<string>("Audience") ?? "DogBarberClient";

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(jwtSection.GetValue<int>("ExpireMinutes"));

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
