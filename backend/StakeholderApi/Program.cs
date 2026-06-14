using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using StakeholderApi.Data;
using StakeholderApi.Logging;
using StakeholderApi.Models;
using StakeholderApi.Services;

// Keep JWT claim names as-is (don't remap "email" → long URI)
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// Bootstrap logger for startup errors before full config is loaded
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// Serilog — two-phase init so we can read the webhook URL from IConfiguration
builder.Host.UseSerilog((ctx, _, config) =>
{
    config
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
        .MinimumLevel.Override("System", LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}");

    var webhookUrl = ctx.Configuration["Discord:WebhookUrl"];
    if (!string.IsNullOrWhiteSpace(webhookUrl))
    {
        // Send to Discord:
        //   • Error / Fatal from anywhere (unhandled exceptions, startup failures, etc.)
        //   • Info / Warning from the stakeholders controller (audit trail)
        config.WriteTo.Logger(sub => sub
            .Filter.ByIncludingOnly(e =>
                e.Level >= LogEventLevel.Error ||
                (e.Properties.TryGetValue("SourceContext", out var sc) &&
                 sc.ToString().Contains("StakeholdersController")))
            .WriteTo.Discord(webhookUrl));
    }
});

// API layer
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=stakeholders.db"));

// Application services
builder.Services.AddScoped<IStakeholderService, StakeholderService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// JWT authentication — token is read from the httpOnly "jwt" cookie
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new InvalidOperationException("Jwt:Secret must be configured and at least 32 characters long.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["jwt"];
                return Task.CompletedTask;
            }
        };
    });

// CORS — allows the React dev server to call the API with credentials
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Run any pending EF Core migrations and seed admin user on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Users.Any())
    {
        db.Users.Add(new User
        {
            Email = "palaktank1111@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234")
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(err => err.Run(async ctx =>
{
    ctx.Response.StatusCode = 500;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(new { message = "Something went wrong on our end. Please try again later." });
}));

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
