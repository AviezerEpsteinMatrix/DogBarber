using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DogBarber.Api.Data.Migrations
{
    public partial class AddDeleteProcedure : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE PROCEDURE sp_DeleteAppointment
                    @AppointmentId INT,
                    @UserId NVARCHAR(450)
                AS
                BEGIN
                    SET NOCOUNT ON;

                    DELETE FROM Appointments
                    WHERE Id = @AppointmentId
                      AND UserId = @UserId
                      AND CAST(AppointmentDate AS DATE) <> CAST(GETDATE() AS DATE);

                    SELECT @@ROWCOUNT AS AffectedRows;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS sp_DeleteAppointment");
        }
    }
}
