# DogBarber

## Project Overview
A simple appointment management system for a dog grooming business. The API provides authentication, appointment CRUD, and business rules (pricing, discounts, deletion restrictions). A React + Vite frontend consumes the API for client-side user flows.

## Features (Assignment Coverage)
| Requirement | Implementation |
|---|---|
| User registration and login | AuthController with JWT issuance via AuthService; registration/login endpoints implemented |
| Create / Read / Update / Delete appointments | AppointmentsController exposes appointment endpoints; server enforces same-day delete restriction and price calculation |
| Manage grooming types | GroomingTypesController and seeded GroomingTypes table with price/duration data |
| Customer appointment history | Stored procedure `sp_GetCustomerAppointmentHistory` and CustomersController to fetch history |
| Use of DB objects (stored procedures / views) | Migrations create stored procedures and view (see Database section) |

## Tech Stack
- Backend: .NET 8, ASP.NET Core Web API, Entity Framework Core (SQL Server provider)
- Authentication: ASP.NET Identity + JWT (symmetric key)
- Frontend: React, TypeScript, Vite, MUI
- DB: Microsoft SQL Server (LocalDB for development)

## Database
Connection string: DogBarber.Api/appsettings.json -> ConnectionStrings:DefaultConnection (defaults to LocalDB)

### Tables
- AspNetUsers (Identity users) — extended with FirstName
- AspNetRoles, AspNetUserRoles, AspNetUserClaims, etc. (Identity)
- GroomingTypes — Id, Name, DurationMinutes, Price (seeded)
- Appointments — Id, UserId, GroomingTypeId, AppointmentDate, CreatedAt, Price, DurationMinutes

### Stored Procedures
- sp_GetCustomerAppointmentHistory
  - What it does: returns booking count and last appointment date for a given customer (used to determine eligibility for discounts / history display).
- sp_DeleteAppointment
  - What it does: deletes an appointment for a given appointment id and user only if the appointment is not scheduled for the same calendar day; returns affected rows.

### Views
- vw_AppointmentDetails
  - What it returns: a joined projection of appointment details including user info (UserName, FirstName, Email) and grooming type metadata (Name, Price, DurationMinutes).

## API Endpoints (high level)
- POST /api/auth/register — create account
- POST /api/auth/login — authenticate and receive JWT
- GET /api/groomingtypes — list grooming types
- GET /api/appointments — list/filter appointments (requires auth)
- POST /api/appointments — create appointment (requires auth)
- PUT /api/appointments/{id} — update appointment (requires auth)
- DELETE /api/appointments/{id} — delete appointment (uses sp_DeleteAppointment via controller; same-day deletion prevented)
- GET /api/customers/{id}/history — retrieves customer history (uses sp_GetCustomerAppointmentHistory)

(See controllers in DogBarber.Api/Controllers for more details.)

## Run Locally

### Server (DogBarber.Api)
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

### Client (client)
1. Configure API URL
   - client/.env.development contains a VITE_API_URL variable. Example:
     - VITE_API_URL=http://localhost:5192/api
   - Ensure this matches the server base URL (including `/api` if the client expects it).

2. From the command line
   - cd client
   - npm install
   - npm run dev
   - Vite dev server typically serves at http://localhost:5173 — open that in your browser.

## Screenshots
(placeholder — screenshots will be added by the project owner)

## Security Notes
- The JWT symmetric key in appsettings.json is for development only. Replace it with a long random secret in production and/or store it in environment variables or a secrets manager.
- Do not commit production connection strings or secrets.
- CORS is configured for common local dev ports in Program.cs; restrict origins in production.
- Passwords are stored via ASP.NET Identity hashing (do not override with custom insecure logic).

---

If you want, I can add a small script to start both server and client together or add a Docker Compose file for development.