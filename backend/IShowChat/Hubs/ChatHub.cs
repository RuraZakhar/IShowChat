using IShowChat.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace IShowChat.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(string userName, string message);
    Task JoinedRoom(string room);
    Task UserTyping(string userName);
    Task UpdateUserList(IEnumerable<string> users);
    Task ReceiveReaction(string messageId, string reactionType, string userName);
    Task NotifyMessageRead(string messageId);
}

public class ChatHub : Hub<IChatClient>
{
    private static readonly ConcurrentDictionary<string, UserConnection> _connections = new();

    public async Task JoinRoom(UserConnection userConnection)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.Room);
        
        _connections[Context.ConnectionId] = userConnection;

        await Clients.Group(userConnection.Room)
            .ReceiveMessage("System", $"{userConnection.UserName} joined the group");
        
        await Clients.Caller.JoinedRoom(userConnection.Room);
        
        await UpdateUsersInRoom(userConnection.Room);
    }

    public async Task SendMessage(string message)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var userConnection))
        {
            var timestamp = DateTime.UtcNow.ToString("HH:mm");
            await Clients.Group(userConnection.Room)
                .ReceiveMessage(userConnection.UserName, $"{message} [{timestamp}]");
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
                .ReceiveMessage("System", $"{userConnection.UserName} покинув чат");
        
            await UpdateUsersInRoom(userConnection.Room);
        }

        await base.OnDisconnectedAsync(exception);
    }
}