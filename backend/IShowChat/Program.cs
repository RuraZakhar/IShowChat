using IShowChat.Data;
using IShowChat.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") 
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); 
    });
});

builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") 
                         ?? "Server=localhost,1433;Database=IShowChatDb;User Id=sa;Password=Your_Password123!;TrustServerCertificate=True;"));

var app = builder.Build();

app.UseCors(); 

app.MapHub<ChatHub>("/chat");

app.Run();