using IShowChat.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Порт твого React-проєкту
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Це критично важливо для SignalR!
    });
});


builder.Services.AddSignalR();
var app = builder.Build();

app.UseCors(); 

app.MapHub<ChatHub>("/chat");

app.Run();
