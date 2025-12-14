# DogBarber — Running the Server and Client (Local Development)

This repository contains two main parts:

- DogBarber.Api — ASP.NET Core Web API (server)
- client — Vite + React + TypeScript frontend (client)

Prerequisites
- .NET 8 SDK
- Node.js (16+ recommended) and npm (or pnpm/yarn)
- SQL Server LocalDB or another SQL Server instance
- (Optional) EF Core tools: dotnet tool install --global dotnet-ef

Server (DogBarber.Api)
1. Configure connection string and JWT
   - Default connection is in DogBarber.Api/appsettings.json:
     - ConnectionStrings: DefaultConnection => LocalDB: `Server=(localdb)\\MSSQLLocalDB;Database=DogBarberDb;Trusted_Connection=True;MultipleActiveResultSets=true`
   - Change the JWT secret in DogBarber.Api/appsettings.json -> Jwt:Key for development/production.

2. From the command line
   - cd DogBarber.Api
   - dotnet restore
   - dotnet build
   - dotnet ef database update         # applies migrations and creates DB objects (procedures, views, tables)
   - dotnet run --urls "http://localhost:5192"    # runs the API

3. From Visual Studio
   - Open the solution, set DogBarber.Api as the startup project.
   - Use the Package Manager Console to run: Update-Database
   - Start the app with Debug > Start Debugging or Start Without Debugging.

Client (client)
1. Configure API URL
   - client/.env.development contains a VITE_API_URL variable. Example:
     - VITE_API_URL=http://localhost:5192/api
   - Ensure this matches the server base URL (including `/api` if the client expects it).

2. From the command line
   - cd client
   - npm install
   - npm run dev
   - Vite dev server typically serves at http://localhost:5173 — open that in your browser.

Common commands
- Apply DB migrations (CLI): cd DogBarber.Api && dotnet ef database update
- Start API (CLI): cd DogBarber.Api && dotnet run --urls "http://localhost:5192"
- Start client: cd client && npm install && npm run dev
- List migrations: cd DogBarber.Api && dotnet ef migrations list

Environment & security notes
- appsettings.json contains a development JWT key. Replace with a secure key before publishing.
- For production, move connection strings and secrets to environment variables or a secrets store.

Troubleshooting
- If the client cannot talk to the server:
  - Confirm server is running and reachable at the URL in client/.env.development.
  - Check CORS allowed origins in DogBarber.Api/Program.cs; development CORS allows Vite default origins.
- If EF reports pending migrations, run: dotnet ef database update
- If using LocalDB fails, point `DefaultConnection` to a reachable SQL Server instance.

Extras
- To add convenience scripts, consider creating a PowerShell or shell script to start both server and client together, or add a docker-compose file for full-stack development.

---

If you want, I can add a convenience script (PowerShell or npm script) to run client and server together.