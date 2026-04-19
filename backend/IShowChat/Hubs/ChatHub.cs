using IShowChat.Models;
using Microsoft.AspNetCore.SignalR;

namespace IShowChat.Hubs;

public interface IChatClient
{
    public Task ReceiveMessage(string userName, string message);
    Task JoinedRoom(string room);
}

public class ChatHub : Hub<IChatClient>
{
    public async Task JoinRoom(UserConnection userConnection)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.Room);
        
        await Clients
            .Group(userConnection.Room)
            .ReceiveMessage("System", $"{userConnection.UserName} joined the group");
        
        await Clients.Caller.JoinedRoom(userConnection.Room);
    }
    
    public async Task SendMessage(string message, string userName, string room)
    {
        await Clients.Group(room).ReceiveMessage(userName, message);
    }
}

