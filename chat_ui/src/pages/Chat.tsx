import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiLogOut, FiSearch, FiSend, FiUserPlus } from "react-icons/fi";
import { io, Socket } from "socket.io-client";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";

interface Friend {
  id: number;
  username: string;
  email: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const Chat = () => {
  const { user, token, logout } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch friends
    const fetchFriends = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };
    fetchFriends();

    // Setup socket
    socketRef.current = io(API_URL);

    socketRef.current.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (selectedFriend && user) {
      // Join room
      const room = [user.id, selectedFriend.id].sort((a, b) => a - b).join("-");
      socketRef.current?.emit("join_room", room);

      // Fetch messages
      const fetchMessages = async () => {
        try {
          const res = await axios.get(
            `${API_URL}/api/messages/${selectedFriend.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setMessages(res.data);
        } catch (err) {
          console.error("Failed to fetch messages:", err);
        }
      };
      fetchMessages();
    }
  }, [selectedFriend, user, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !user) return;

    socketRef.current?.emit("send_message", {
      senderId: user.id,
      receiverId: selectedFriend.id,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/user/add-friend`,
        { email: addEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFriends((prev) => [...prev, res.data.friend]);
      setAddEmail("");
      setShowAddFriend(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add friend");
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar */}
      <motion.div
        className="w-80 bg-white border-r border-slate-200 flex flex-col"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <Logo size="sm" />
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-brand-500 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowAddFriend(true)}
              className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
              title="Add Friend"
            >
              <FiUserPlus size={20} />
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredFriends.map((friend) => (
              <motion.div
                key={friend.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setSelectedFriend(friend)}
                className={`p-4 cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition ${
                  selectedFriend?.id === friend.id
                    ? "bg-brand-50 border-l-4 border-l-brand-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {friend.username}
                    </p>
                    <p className="text-xs text-slate-500">{friend.email}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredFriends.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No friends yet. Add someone!
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                {selectedFriend.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-800">
                  {selectedFriend.username}
                </p>
                <p className="text-xs text-slate-500">{selectedFriend.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.sender_id === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                        msg.sender_id === user?.id
                          ? "bg-brand-500 text-white rounded-br-sm"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_id === user?.id
                            ? "text-brand-100"
                            : "text-slate-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-slate-200"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full border border-slate-200 focus:border-brand-500 outline-none"
                />
                <motion.button
                  type="submit"
                  className="p-3 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiSend size={20} />
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Logo size="lg" showText={false} />
              <h2 className="text-xl font-medium text-slate-600 mt-4">
                Welcome to DostChats
              </h2>
              <p className="text-slate-400 mt-2">
                Select a friend to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Add Friend
              </h3>
              <form onSubmit={handleAddFriend}>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-500 outline-none mb-4"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFriend(false)}
                    className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    Add
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
