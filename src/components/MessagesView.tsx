import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Smile,
  MessageCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessagesViewProps {
  onProfileClick?: (profile: any) => void;
}

export const MessagesView = ({ onProfileClick }: MessagesViewProps) => {
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [newMessage, setNewMessage] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "@sarahj_swimmer",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face",
      sport: "Swimming",
      lastMessage: "Great training session today!",
      time: "2m",
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: "Coach Mike Wilson",
      username: "@coach_mike_bb",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      sport: "Basketball Coach",
      lastMessage: "Let's schedule practice for tomorrow",
      time: "1h",
      unread: 0,
      online: false,
    },
    {
      id: 3,
      name: "Emma Davis",
      username: "@emmad_yoga",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      sport: "Yoga Instructor",
      lastMessage: "Thanks for the meditation tips!",
      time: "3h",
      unread: 1,
      online: true,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "other",
      content: "Hey! How was your training today?",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "me",
      content: "It was amazing! I finally nailed that technique we discussed.",
      time: "10:32 AM",
    },
    {
      id: 3,
      sender: "other",
      content:
        "That's fantastic! I knew you could do it. Want to practice together tomorrow?",
      time: "10:35 AM",
    },
    {
      id: 4,
      sender: "me",
      content: "Absolutely! What time works for you?",
      time: "10:36 AM",
    },
  ];

  const handleProfileClick = (conversation: any) => {
    if (onProfileClick) {
      onProfileClick({
        name: conversation.name,
        username: conversation.username,
        avatar: conversation.avatar,
        sport: conversation.sport,
        verified: false,
        bio: `Professional ${conversation.sport}`,
        coverImage:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
        location: "New York, USA",
        joinDate: "March 2022",
        followers: Math.floor(Math.random() * 50000) + 10000,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 200) + 50,
      });
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  // Mobile view when conversation is selected
  if (selectedConversation && window.innerWidth < 768) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-card">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversations.find(c => c.id === selectedConversation)?.avatar} />
              <AvatarFallback>{conversations.find(c => c.id === selectedConversation)?.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {conversations.find(c => c.id === selectedConversation)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {conversations.find(c => c.id === selectedConversation)?.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "me"
                    ? "bg-[#0e9591] text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && newMessage.trim()) {
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:max-w-6xl lg:mx-auto lg:p-4">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <Input placeholder="Search conversations..." className="w-full" />
        </div>

        {/* Mobile Layout (below lg) */}
        <div className="lg:hidden h-[calc(100vh-12rem)] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {conversation.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <div className="mt-1">
                          <Badge className="bg-[#0e9591] text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Layout (lg and above) */}
        <div className="hidden lg:flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-border overflow-y-auto">
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {conversation.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <div className="mt-1">
                          <Badge className="bg-[#0e9591] text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversations.find(c => c.id === selectedConversation)?.avatar} />
                      <AvatarFallback>{conversations.find(c => c.id === selectedConversation)?.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {conversations.find(c => c.id === selectedConversation)?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {conversations.find(c => c.id === selectedConversation)?.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === "me"
                            ? "bg-[#0e9591] text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newMessage.trim()) {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
