using IShowChat.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using IShowChat.Data;
using Microsoft.EntityFrameworkCore;
using Azure;
using Azure.AI.TextAnalytics;
using Microsoft.Extensions.Configuration;

namespace IShowChat.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(string userName, string message, string sentiment);
    Task JoinedRoom(string room);
    Task UserTyping(string userName);
    Task UpdateUserList(IEnumerable<string> users);
    Task ReceiveReaction(string messageId, string reactionType, string userName);
    Task NotifyMessageRead(string messageId);
    Task ReceiveHistory(IEnumerable<ChatMessage> history);
}

public class ChatHub : Hub<IChatClient>
{
    private readonly AppDbContext _context;
    private static readonly ConcurrentDictionary<string, UserConnection> _connections = new();
    private readonly TextAnalyticsClient _languageClient;
    
    public ChatHub(AppDbContext context, IConfiguration configuration)
    {
        _context = context;

        var key = configuration["AzureLanguage:Key"];
        var endpoint = configuration["AzureLanguage:Endpoint"];

        if (!string.IsNullOrEmpty(key) && !string.IsNullOrEmpty(endpoint))
        {
            _languageClient = new TextAnalyticsClient(new Uri(endpoint), new AzureKeyCredential(key));
        }
    }

    public async Task JoinRoom(UserConnection userConnection)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.Room);
        _connections[Context.ConnectionId] = userConnection;

        var history = await _context.ChatMessages
            .Where(m => m.Room == userConnection.Room)
            .OrderBy(m => m.Timestamp)
            .Take(50)
            .ToListAsync();

        await Clients.Caller.ReceiveHistory(history);

        await Clients.Group(userConnection.Room)
            .ReceiveMessage("System", $"{userConnection.UserName} joined the group", sentiment: "Neutral");
    
        await Clients.Caller.JoinedRoom(userConnection.Room);
        await UpdateUsersInRoom(userConnection.Room);
    }

    public async Task SendMessage(string message)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var userConnection))
        {
            string sentimentResult = "neutral";
            if (_languageClient != null)
            {
                var response = await _languageClient.AnalyzeSentimentAsync(message);
                sentimentResult = response.Value.Sentiment.ToString().ToLower();
            }

            var timestamp = DateTime.UtcNow;
            
            var chatMsg = new ChatMessage
            {
                UserName = userConnection.UserName,
                Message = message,
                Room = userConnection.Room,
                Timestamp = timestamp,
                Sentiment = sentimentResult
            };

            _context.ChatMessages.Add(chatMsg);
            await _context.SaveChangesAsync();

            await Clients.Group(userConnection.Room)
                .ReceiveMessage(userConnection.UserName, message, sentimentResult); 
        }
    }
    
    public async Task SendTypingNotification(string room, string user)
    {
        await Clients.OthersInGroup(room).UserTyping(user);
    }

    private async Task UpdateUsersInRoom(string room)
    {
        var users = _connections.Values
            .Where(c => c.Room == room)
            .Select(c => c.UserName);

        await Clients.Group(room).UpdateUserList(users);
    }
    
    public async Task SendReaction(string room, string messageId, string reactionType)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var userConnection))
        {
            await Clients.Group(room).ReceiveReaction(messageId, reactionType, userConnection.UserName);
        }
    }
    
    public async Task MessageRead(string room, string messageId)
    {
        await Clients.Group(room).NotifyMessageRead(messageId);
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var userConnection))
        {
            _connections.TryRemove(Context.ConnectionId, out _);
        
            await Clients.Group(userConnection.Room)
                .ReceiveMessage("System", $"{userConnection.UserName} leaved the group", sentiment: "neutral");
        
            await UpdateUsersInRoom(userConnection.Room);
        }

        await base.OnDisconnectedAsync(exception);
    }
}