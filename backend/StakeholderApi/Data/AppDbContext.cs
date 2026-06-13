using Microsoft.EntityFrameworkCore;
using StakeholderApi.Models;

namespace StakeholderApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Stakeholder> Stakeholders => Set<Stakeholder>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Stakeholder>()
            .HasIndex(s => s.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Stakeholder>().HasData(GenerateSeedData());
    }

    private static List<Stakeholder> GenerateSeedData()
    {
        var firstNames = new[] { "Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry", "Isla", "James" };
        var lastNames  = new[] { "Johnson", "Williams", "Smith", "Brown", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris" };
        var roles      = new[] { "Investor", "Advisor", "Partner", "Board Member", "Mentor" };
        var orgs       = new[] { "Venture Capital Partners", "TechCorp Ltd", "Innovation Hub", "Global Ventures", "Apex Advisory", "Horizon Capital", "BluePeak Group", "Meridian Partners", "Summit Advisors", "Crestwood Holdings" };

        var startDate    = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var stakeholders = new List<Stakeholder>();

        for (int i = 0; i < 50; i++)
        {
            var firstName = firstNames[i % firstNames.Length];
            var lastName  = lastNames[i / firstNames.Length];

            stakeholders.Add(new Stakeholder
            {
                Id           = i + 1,
                FirstName    = firstName,
                LastName     = lastName,
                Email        = $"{firstName.ToLower()}.{lastName.ToLower()}@example.com",
                Role         = roles[i % roles.Length],
                Organisation = orgs[i % orgs.Length],
                CreatedAt    = startDate.AddDays(i * 7),
                Title        = i % 2 == 0 ? "Ms" : "Mr",
            });
        }

        return stakeholders;
    }
}
