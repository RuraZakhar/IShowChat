import { useState } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const App = () => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('');

  const joinChat = async (user, room) => {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl("https://ishowchat-api-zakhar-d0bjfwahcfc6adfs.polandcentral-01.azurewebsites.net/chat") 
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", (user, message) => {
        setMessages(messages => [...messages, { user, message }]);
      });

      connection.on("JoinedRoom", (room) => {
        console.log(`Joined room: ${room}`);
      });

      await connection.start();
      await connection.invoke("JoinRoom", { UserName: user, Room: room });
      
      setConnection(connection);
      setUser(user);
      setRoom(room);
    } catch (e) {
      console.log(e);
      alert("Помилка підключення!");
    }
  };

  const sendMessage = async (message) => {
    try {
      await connection.invoke("SendMessage", message);
    } catch (e) {
      console.log(e);
    }
  };

  const closeConnection = async () => {
    try {
      await connection.stop();
      setConnection(null);
      setMessages([]);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {!connection ? (
        <Lobby joinChat={joinChat} />
      ) : (
        <ChatRoom 
          messages={messages} 
          sendMessage={sendMessage} 
          closeConnection={closeConnection}
          room={room}
          user={user}
        />
      )}
    </div>
  );
};

const Lobby = ({ joinChat }) => {
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('');

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Вхід у IShowChat</h2>
      <input 
        className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Твоє ім'я..." 
        onChange={e => setUser(e.target.value)} 
      />
      <input 
        className="w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Назва кімнати..." 
        onChange={e => setRoom(e.target.value)} 
      />
      <button 
        onClick={() => joinChat(user, room)}
        disabled={!user || !room}
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        Приєднатися
      </button>
    </div>
  );
};

const ChatRoom = ({ messages, sendMessage, closeConnection, room, user: currentUser }) => {
  const [msg, setMsg] = useState('');

  return (
    <div className="bg-white w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h2 className="font-bold">Кімната: {room}</h2>
        <button onClick={closeConnection} className="bg-red-500 px-3 py-1 rounded text-sm">Вийти</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((m, index) => (
          <div key={index} className={`flex flex-col ${m.user === currentUser ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-500 mb-1">{m.user}</span>
            <div className={`p-3 rounded-2xl max-w-[80%] ${m.user === currentUser ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none shadow-sm'}`}>
              {m.message}
            </div>
          </div>
        ))}
      </div>

      <form 
        onSubmit={e => { e.preventDefault(); if(msg) { sendMessage(msg); setMsg(''); } }}
        className="p-4 bg-white border-t flex gap-2"
      >
        <input 
          className="flex-1 p-2 border rounded-lg focus:outline-none"
          placeholder="Повідомлення..."
          value={msg}
          onChange={e => setMsg(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Відправити</button>
      </form>
    </div>
  );
};

export default App;