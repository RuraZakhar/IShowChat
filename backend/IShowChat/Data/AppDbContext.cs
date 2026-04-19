using IShowChat.Models;
using Microsoft.EntityFrameworkCore;

namespace IShowChat.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ChatMessage> Messages => Set<ChatMessage>();
}