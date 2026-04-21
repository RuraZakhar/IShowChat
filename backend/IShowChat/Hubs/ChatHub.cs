using IShowChat.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace IShowChat.Hubs;

public interface IChatClient
{
    Task ReceiveMessage(string userName, string message);
    Task JoinedRoom(string room);
}

public class ChatHub : Hub<IChatClient>
{
    private static readonly ConcurrentDictionary<string, UserConnection> _connections = new();

    public async Task JoinRoom(UserConnection userConnection)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.Room);
        
        _connections[Context.ConnectionId] = userConnection;

        await Clients
            .Group(userConnection.Room)
            .ReceiveMessage("System", $"{userConnection.UserName} joined the group");
        
        await Clients.Caller.JoinedRoom(userConnection.Room);
    }

    public async Task SendMessage(string message)
    {
        if (_connections.TryGetValue(Context.ConnectionId, out var userConnection))
        {
            await Clients.Group(userConnection.Room)
                .ReceiveMessage(userConnection.UserName, message);
        }
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _connections.TryRemove(Context.ConnectionId, out _);
        return base.OnDisconnectedAsync(exception);
    }
}