using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace StakeholderApi.Migrations
{
    [DbContext(typeof(StakeholderApi.Data.AppDbContext))]
    [Migration("20260618120000_AddUpdatedAt")]
    public partial class AddUpdatedAt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Stakeholders",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Backfill existing rows so UpdatedAt = CreatedAt
            migrationBuilder.Sql("UPDATE \"Stakeholders\" SET \"UpdatedAt\" = \"CreatedAt\"");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Stakeholders");
        }
    }
}
