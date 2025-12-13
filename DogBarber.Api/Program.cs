using DogBarber.Api.Data;
using DogBarber.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;
using DogBarber.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Add JWT Bearer support in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header
            },
            Array.Empty<string>()
        }
    });
});

// Configure controllers and JSON to ignore reference cycles (prevents serializer errors when EF navigation properties reference each other)
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Configure DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key") ?? "DevelopmentKey_should_be_changed";
var issuer = jwtSection.GetValue<string>("Issuer") ?? "DogBarberApi";
var audience = jwtSection.GetValue<string>("Audience") ?? "DogBarberClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseErrorHandling();
app.UseRequestLogging();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
