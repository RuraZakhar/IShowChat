namespace IShowChat.Models;

public class ChatMessage
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public string? Sentiment { get; set; } 
}