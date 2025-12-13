using Microsoft.AspNetCore.Builder;

namespace DogBarber.Api.Middleware;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ErrorHandlingMiddleware>();
    }

    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder app)
    {
        return app.UseMiddleware<RequestLoggingMiddleware>();
    }
}
