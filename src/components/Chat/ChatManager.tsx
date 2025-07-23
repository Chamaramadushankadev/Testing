import React, { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Settings, Users, Send, Smile, Paperclip, MoreVertical, Edit3, Trash2, Reply } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { channelsAPI, messagesAPI } from '../../services/chatAPI';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface Channel {
  _id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  userRole: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    sender: {
      name: string;
    };
    createdAt: string;
  };
}

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  channel: string;
  createdAt: string;
  edited: boolean;
  editedAt?: string;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      name: string;
    };
  };
}

interface TypingUser {
  userId: string;
  user: {
    name: string;
  };
  channelId: string;
}

export const ChatManager: React.FC = () => {
  const { socket, connected } = useSocket();
  const { user } = useFirebaseAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChannels();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel._id);
    }
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('new-message', (message: Message) => {
      if (message.channel === activeChannel?._id) {
        setMessages(prev => [...prev, message]);
      }
      // Update channel list with new message
      setChannels(prev => prev.map(channel => 
        channel._id === message.channel 
          ? { ...channel, lastMessage: { content: message.content, sender: message.sender, createdAt: message.createdAt } }
          : channel
      ));
    });

    socket.on('message-edited', (message: Message) => {
      if (message.channel === activeChannel?._id) {
        setMessages(prev => prev.map(msg => msg._id === message._id ? message : msg));
      }
    });

    socket.on('message-deleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    socket.on('user-typing', (data: TypingUser) => {
      if (data.channelId === activeChannel?._id && data.userId !== user?.uid) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === data.userId && u.channelId === data.channelId);
          if (!existing) {
            return [...prev, data];
          }
          return prev;
        });
      }
    });

    socket.on('user-stopped-typing', ({ userId, channelId }: { userId: string; channelId: string }) => {
      setTypingUsers(prev => prev.filter(u => !(u.userId === userId && u.channelId === channelId)));
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    return () => {
      socket.off('new-message');
      socket.off('message-edited');
      socket.off('message-deleted');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('error');
    };
  }, [socket, activeChannel, user]);

  const loadChannels = async () => {
    try {
      const response = await channelsAPI.getAll();
      setChannels(response.data);
      if (response.data.length > 0 && !activeChannel) {
        setActiveChannel(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await channelsAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const response = await messagesAPI.getByChannel(channelId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChannel || !socket) return;

    const messageData = {
      content: newMessage.trim(),
      channelId: activeChannel._id,
      replyTo: replyingTo?._id
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
    setReplyingTo(null);
    handleStopTyping();
  };

  const handleEditMessage = (messageId: string) => {
    if (!editContent.trim() || !socket) return;

    socket.emit('edit-message', {
      messageId,
      content: editContent.trim()
    });

    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return;
    
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('delete-message', { messageId });
    }
  };

  const handleStartTyping = () => {
    if (!socket || !activeChannel || isTyping) return;

    setIsTyping(true);
    socket.emit('typing-start', { channelId: activeChannel._id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (!socket || !activeChannel || !isTyping) return;

    setIsTyping(false);
    socket.emit('typing-stop', { channelId: activeChannel._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleCreateChannel = async (formData: FormData) => {
    try {
      const channelData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as string
      };

      await channelsAPI.create(channelData);
      await loadChannels();
      setShowCreateChannel(false);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleStartDirectMessage = async (userId: string) => {
    try {
      const response = await channelsAPI.createDirect(userId);
      await loadChannels();
      setActiveChannel(response.data);
      setShowUserList(false);
    } catch (error) {
      console.error('Error creating direct message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getChannelDisplayName = (channel: any) => {
    if (channel.type === 'direct' && channel.participants) {
      const otherParticipant = channel.participants.find((p: any) => p._id !== user?.uid);
      return otherParticipant ? otherParticipant.name : 'Direct Message';
    }
    return channel.name;
  };

  const getChannelIcon = (channel: any) => {
    if (channel.type === 'direct') {
      return '@';
    }
    return '#';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Channels */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Channels</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUserList(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Start Direct Message"
              >
                @
              </button>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`mt-2 flex items-center space-x-2 text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <button
              key={channel._id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                activeChannel?._id === channel._id ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 dark:text-gray-400 font-mono">{getChannelIcon(channel)}</span>
                <span className="font-medium text-gray-900 dark:text-white">{getChannelDisplayName(channel)}</span>
                {channel.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {channel.unreadCount}
                  </span>
                )}
              </div>
              {channel.lastMessage && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                  <span className="font-medium">{channel.lastMessage.sender.name}:</span> {channel.lastMessage.content}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-lg">{getChannelIcon(activeChannel)}</span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getChannelDisplayName(activeChannel)}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeChannel.type === 'public' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                    activeChannel.type === 'private' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {activeChannel.type === 'direct' ? 'DM' : activeChannel.type}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Users className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {activeChannel.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activeChannel.description}</p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <div key={message._id} className="group">
                  {message.replyTo && (
                    <div className="ml-12 mb-1 p-2 bg-gray-100 dark:bg-gray-800 rounded border-l-2 border-gray-300 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Replying to <span className="font-medium">{message.replyTo.sender.name}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{message.replyTo.content}</div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">{message.sender.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(message.createdAt)}</span>
                        {message.edited && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
                        )}
                      </div>
                      
                      {editingMessage === message._id ? (
                        <div className="mt-1">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditMessage(message._id);
                              } else if (e.key === 'Escape') {
                                setEditingMessage(null);
                                setEditContent('');
                              }
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Press Enter to save, Escape to cancel
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.content}</div>
                      )}
                    </div>
                    
                    {message.sender._id === user?.uid && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessage(message._id);
                            setEditContent(message.content);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>
                    {typingUsers.map(u => u.user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-300">
                      Replying to <span className="font-medium">{replyingTo.sender.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 truncate">{replyingTo.content}</div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (e.target.value.trim()) {
                        handleStartTyping();
                      } else {
                        handleStopTyping();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${getChannelDisplayName(activeChannel)}`}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!connected}
                  />
                </div>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !connected}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <Hash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Channel Selected</h3>
              <p className="text-gray-600 dark:text-gray-400">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create New Channel</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateChannel(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Channel Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., general, random, announcements"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's this channel about?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  name="type"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Invite only</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User List Modal for Direct Messages */}
      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Start Direct Message</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleStartDirectMessage(user._id)}
                  className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={() => setShowUserList(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};