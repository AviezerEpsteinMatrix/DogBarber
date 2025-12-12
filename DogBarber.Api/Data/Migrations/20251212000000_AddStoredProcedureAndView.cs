using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DogBarber.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStoredProcedureAndView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Stored Procedure: sp_GetCustomerAppointmentHistory
            migrationBuilder.Sql(@"
                CREATE PROCEDURE sp_GetCustomerAppointmentHistory
                    @CustomerId NVARCHAR(450)
                AS
                BEGIN
                    SELECT 
                        COUNT(*) AS BookingCount,
                        MAX(AppointmentDate) AS LastAppointmentDate
                    FROM Appointments
                    WHERE UserId = @CustomerId 
                      AND AppointmentDate < GETDATE()
                END
            ");

            // Create View: vw_AppointmentDetails
            migrationBuilder.Sql(@"
                CREATE VIEW vw_AppointmentDetails AS
                SELECT 
                    a.Id,
                    a.UserId,
                    u.UserName,
                    u.FirstName,
                    u.Email,
                    a.GroomingTypeId,
                    gt.Name AS DogSize,
                    gt.Price,
                    gt.DurationMinutes,
                    a.AppointmentDate,
                    a.CreatedAt
                FROM Appointments a
                INNER JOIN AspNetUsers u ON a.UserId = u.Id
                INNER JOIN GroomingTypes gt ON a.GroomingTypeId = gt.Id
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_AppointmentDetails");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_GetCustomerAppointmentHistory");
        }
    }
}
