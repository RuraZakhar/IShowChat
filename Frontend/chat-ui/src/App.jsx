import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const App = () => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [usersOnline, setUsersOnline] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('');

  const typingTimeoutRef = useRef(null);

  const joinChat = async (user, room) => {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl("https://ishowchat-api-zakhar-d0bjfwahcfc6adfs.polandcentral-01.azurewebsites.net/chat")
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      connection.on("receiveMessage", (user, message) => {
        const messageId = Date.now().toString();
        setMessages(messages => [...messages, { id: messageId, user, message, reactions: [], isRead: false }]);
      });

      connection.on("joinedRoom", (room) => {
        console.log(`Joined: ${room}`);
      });

      connection.on("userTyping", (userName) => {
        setTypingUser(userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(''), 3000);
      });

      connection.on("updateUserList", (users) => {
        setUsersOnline(users);
      });

      connection.on("receiveHistory", (history) => {
      const formattedHistory = history.map(m => ({
        id: m.id,
        user: m.userName,
        message: m.message,
        reactions: [], 
        isRead: true,
        timestamp: m.timestamp
      }));
      setMessages(formattedHistory);
      });

      connection.on("receiveReaction", (messageId, reactionType, userName) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, reactions: [...m.reactions, { type: reactionType, user: userName }] } 
            : m
        ));
      });

      connection.on("notifyMessageRead", (messageId) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
      });

      await connection.start();
      await connection.invoke("JoinRoom", { UserName: user, Room: room });

      setConnection(connection);
      setUser(user);
      setRoom(room);
    } catch (e) {
      console.log(e);
      alert("Connection error!");
    }
  };

  const sendMessage = async (message) => {
    try {
      await connection.invoke("SendMessage", message);
    } catch (e) {
      console.log(e);
    }
  };

  const sendTyping = async () => {
    try {
      if (connection) {
        await connection.invoke("SendTypingNotification", room, user);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const sendReaction = async (messageId, type) => {
    try {
      await connection.invoke("SendReaction", room, messageId, type);
    } catch (e) {
      console.log(e);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await connection.invoke("MessageRead", room, messageId);
    } catch (e) {
      console.log(e);
    }
  };

  const closeConnection = async () => {
    try {
      await connection.stop();
      setConnection(null);
      setMessages([]);
      setUsersOnline([]);
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
          sendTyping={sendTyping}
          sendReaction={sendReaction}
          markAsRead={markAsRead}
          typingUser={typingUser}
          usersOnline={usersOnline}
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
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to IShowChat</h2>
      <input
        className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Your name..."
        value={user}
        onChange={e => setUser(e.target.value)}
      />
      <input
        className="w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Room name..."
        value={room}
        onChange={e => setRoom(e.target.value)}
      />
      <button
        onClick={() => joinChat(user, room)}
        disabled={!user || !room}
        className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        Join
      </button>
    </div>
  );
};

const ChatRoom = ({ 
  messages, sendMessage, sendTyping, sendReaction, markAsRead, 
  typingUser, usersOnline, closeConnection, room, user: currentUser 
}) => {
  const [msg, setMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div className="bg-white w-full max-w-4xl h-[700px] rounded-2xl shadow-2xl flex overflow-hidden">
      <div className="w-1/4 bg-gray-800 text-white p-4 hidden md:flex flex-col">
        <h3 className="font-bold mb-4 border-b border-gray-700 pb-2">Online ({usersOnline.length})</h3>
        <ul className="space-y-2 overflow-y-auto">
          {usersOnline.map((u, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> {u}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="font-bold">Room: {room}</h2>
            <p className="text-xs opacity-80">Logged in as: {currentUser}</p>
          </div>
          <button onClick={closeConnection} className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-lg text-sm transition">Logout</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          {messages.map((m, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${m.user === currentUser ? 'items-end' : 'items-start'}`}
              onMouseEnter={() => m.user !== currentUser && !m.isRead && markAsRead(m.id)}
            >
              <span className="text-xs text-gray-500 mb-1 px-1">{m.user}</span>
              <div className="group relative">
                <div className={`p-3 rounded-2xl shadow-sm ${
                  m.user === currentUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border rounded-tl-none'
                }`}>
                  {m.message}
                  {m.user === currentUser && (
                    <span className="ml-2 text-[10px] opacity-70">{m.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
                
                <div className={`absolute top-0 ${m.user === currentUser ? '-left-12' : '-right-12'} hidden group-hover:flex gap-1 bg-white border rounded-full p-1 shadow-md`}>
                  <button onClick={() => sendReaction(m.id, '👍')} className="hover:scale-125 transition text-sm">👍</button>
                  <button onClick={() => sendReaction(m.id, '❤️')} className="hover:scale-125 transition text-sm">❤️</button>
                </div>

                {m.reactions.length > 0 && (
                  <div className={`flex gap-1 mt-1 ${m.user === currentUser ? 'justify-end' : 'justify-start'}`}>
                    {m.reactions.map((r, i) => (
                      <span key={i} title={r.user} className="text-xs bg-gray-200 px-1.5 rounded-full">{r.type}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typingUser && (
            <div className="text-xs text-gray-400 italic animate-pulse">
              {typingUser} is typing...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={e => { e.preventDefault(); if (msg) { sendMessage(msg); setMsg(''); } }}
          className="p-4 bg-white border-t flex gap-2"
        >
          <input
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Message..."
            value={msg}
            onKeyDown={() => sendTyping()}
            onChange={e => setMsg(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Send</button>
        </form>
      </div>
    </div>
  );
};

export default App;