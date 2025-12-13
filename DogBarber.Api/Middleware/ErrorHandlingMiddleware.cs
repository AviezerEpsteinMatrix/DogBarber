using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System;

namespace DogBarber.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing request {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            var problem = new { error = "An unexpected error occurred." };
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = JsonSerializer.Serialize(problem, options);
            await context.Response.WriteAsync(payload);
        }
    }
}
