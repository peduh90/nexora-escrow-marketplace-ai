import SellerLayout from "./SellerLayout";
import { useState } from "react";
import {
  Send,
  Search,
  Image,
  Paperclip,
  CheckCheck,
  Check,
  Package,
  Star,
  Verified,
} from "lucide-react";

const mockConversations = [
  {
    id: "c1",
    buyerName: "James Mwangi",
    buyerVerified: true,
    lastMessage: "Is the MacBook still available? Can you do 280k?",
    timestamp: "2 min ago",
    unread: 2,
    listingTitle: "MacBook Pro 14\" M3 Max",
    listingPrice: 285000,
    messages: [
      { id: "m1", sender: "buyer", text: "Hello, I'm interested in the MacBook Pro", time: "10:30 AM", read: true },
      { id: "m2", sender: "seller", text: "Hi James! Yes it's available. Brand new, sealed box with warranty.", time: "10:32 AM", read: true },
      { id: "m3", sender: "buyer", text: "Great! Is the MacBook still available? Can you do 280k?", time: "10:45 AM", read: false },
      { id: "m4", sender: "buyer", text: "I can pay via M-Pesa right away", time: "10:45 AM", read: false },
    ],
  },
  {
    id: "c2",
    buyerName: "Sarah Kimani",
    buyerVerified: true,
    lastMessage: "Thank you! When can you ship?",
    timestamp: "1h ago",
    unread: 0,
    listingTitle: "iPhone 15 Pro Max 256GB",
    listingPrice: 142000,
    messages: [
      { id: "m1", sender: "buyer", text: "Hi, I just placed an order for the iPhone", time: "9:00 AM", read: true },
      { id: "m2", sender: "seller", text: "Hi Sarah! I can see the escrow is secured. I'll prepare for shipping.", time: "9:05 AM", read: true },
      { id: "m3", sender: "buyer", text: "Thank you! When can you ship?", time: "9:15 AM", read: true },
    ],
  },
  {
    id: "c3",
    buyerName: "David Odhiambo",
    buyerVerified: false,
    lastMessage: "Can you deliver to Mombasa CBD?",
    timestamp: "3h ago",
    unread: 1,
    listingTitle: "Samsung Galaxy S24 Ultra",
    listingPrice: 165000,
    messages: [
      { id: "m1", sender: "buyer", text: "Can you deliver to Mombasa CBD?", time: "7:30 AM", read: false },
    ],
  },
  {
    id: "c4",
    buyerName: "Grace Wanjiku",
    buyerVerified: true,
    lastMessage: "Perfect, received! Leaving a 5-star review ⭐",
    timestamp: "1d ago",
    unread: 0,
    listingTitle: "Nike Air Max 90 (x2)",
    listingPrice: 25000,
    messages: [
      { id: "m1", sender: "seller", text: "Hi Grace! Your shoes have been delivered.", time: "Yesterday", read: true },
      { id: "m2", sender: "buyer", text: "Perfect, received! Leaving a 5-star review ⭐", time: "Yesterday", read: true },
    ],
  },
];

export default function SellerMessages() {
  const [selectedConvo, setSelectedConvo] = useState<string | null>("c1");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeConvo = mockConversations.find((c) => c.id === selectedConvo);

  const filtered = mockConversations.filter(
    (c) =>
      c.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SellerLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
        {/* Conversations list */}
        <div className={`w-full sm:w-[340px] border-r border-white/5 flex flex-col ${selectedConvo ? "hidden sm:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvo(convo.id)}
                className={`w-full text-left p-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                  selectedConvo === convo.id ? "bg-nx-violet/5 border-l-2 border-l-nx-violet" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-nx-violet/10 flex items-center justify-center shrink-0 text-nx-violet text-sm font-bold">
                    {convo.buyerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">{convo.buyerName}</span>
                        {convo.buyerVerified && <Verified className="w-3 h-3 text-nx-cyan shrink-0" />}
                      </div>
                      <span className="text-[10px] text-white/20 shrink-0">{convo.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-nx-violet/60 truncate">{convo.listingTitle}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-white/30 truncate pr-2">{convo.lastMessage}</p>
                      {convo.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-nx-violet flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {convo.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        {activeConvo ? (
          <div className={`flex-1 flex flex-col ${selectedConvo ? "flex" : "hidden sm:flex"}`}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <button
                onClick={() => setSelectedConvo(null)}
                className="sm:hidden p-1 text-white/40"
              >
                ←
              </button>
              <div className="w-9 h-9 rounded-full bg-nx-violet/10 flex items-center justify-center text-nx-violet text-sm font-bold">
                {activeConvo.buyerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white">{activeConvo.buyerName}</span>
                  {activeConvo.buyerVerified && <Verified className="w-3 h-3 text-nx-cyan" />}
                </div>
                <p className="text-[11px] text-white/30 truncate">Re: {activeConvo.listingTitle} • KES {activeConvo.listingPrice.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                  <Package className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Listing reference */}
              <div className="flex justify-center">
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-[11px] text-white/30">
                    Conversation about <span className="text-nx-violet/60">{activeConvo.listingTitle}</span> • KES {activeConvo.listingPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {activeConvo.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "seller" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                    msg.sender === "seller"
                      ? "bg-nx-violet/10 border border-nx-violet/10 rounded-br-md"
                      : "bg-white/[0.03] border border-white/5 rounded-bl-md"
                  }`}>
                    <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-white/20">{msg.time}</span>
                      {msg.sender === "seller" && (
                        msg.read ? (
                          <CheckCheck className="w-3 h-3 text-nx-cyan" />
                        ) : (
                          <Check className="w-3 h-3 text-white/20" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0">
                  <Image className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMessage.trim()) {
                      setNewMessage("");
                    }
                  }}
                />
                <button
                  disabled={!newMessage.trim()}
                  className="p-2.5 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-white/15 mt-1.5 text-center">
                Messages are encrypted • Escrow protection active for this transaction
              </p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="text-center">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
