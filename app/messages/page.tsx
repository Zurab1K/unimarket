"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  markMessagesAsRead,
  getProfileByUserId,
  type Conversation,
  type Message,
} from "@/lib/supabaseData";

type RealtimeMessageRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  conversation_id?: string | null;
  is_read: boolean;
};

function MessagesPageContent() {
  const ready = useAuthGuard();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => { selectedUserIdRef.current = selectedUserId; }, [selectedUserId]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // Load current user and conversations
  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (!session) {
        setError("Not authenticated.");
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: convData, error: convError } = await getConversations(
        session.user.id
      );
      if (!active) return;

      if (convError) {
        setError(convError.message ?? "Failed to load conversations.");
      } else {
        const sellerId = searchParams.get("sellerId");
        let finalConversations = convData;
        let selectedId: string | null = null;

        if (sellerId) {
          const existing = convData.find((c) => c.participantId === sellerId);
          if (existing) {
            selectedId = sellerId;
          } else {
            const sellerProfile = await getProfileByUserId(sellerId);
            const username = sellerProfile?.username ?? "Seller";
            const newConversation: Conversation = {
              participantId: sellerId,
              participantUsername: username,
              lastMessage: null,
              lastMessageTime: null,
              unreadCount: 0,
              isInitiatedByUser: true,
            };
            finalConversations = [newConversation, ...convData];
            selectedId = sellerId;
          }
        }

        if (!selectedId && finalConversations.length > 0) {
          selectedId = finalConversations[0].participantId;
        }

        setConversations(finalConversations);
        setSelectedUserId(selectedId);
      }

      setLoading(false);
    }

    loadData();
    return () => {
      active = false;
    };
  }, [ready, searchParams]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`messages-realtime-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as RealtimeMessageRow;
          const myId = currentUserIdRef.current;
          const selectedId = selectedUserIdRef.current;
          if (!myId) return;

          if (newMsg.sender_id === selectedId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", newMsg.sender_id)
              .single();

            const message: Message = {
              id: newMsg.id,
              content: newMsg.content,
              senderId: newMsg.sender_id,
              senderUsername: profile?.username ?? "Unknown",
              receiverId: newMsg.receiver_id,
              receiverUsername: "",
              isRead: false,
              conversationId: newMsg.conversation_id ?? null,
              createdAt: newMsg.created_at,
              updatedAt: newMsg.updated_at ?? newMsg.created_at,
            };
            setMessages((prev) => [...prev, message]);
            await markMessagesAsRead(myId, newMsg.sender_id);
          }

          const { data: convData } = await getConversations(myId);
          setConversations(convData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Load messages when selected user changes
  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    let active = true;

    async function loadMessages() {
      setMessagesLoading(true);

      const { data: msgData, error: msgError } = await getMessagesWithUser(
        currentUserId!,
        selectedUserId!
      );
      if (!active) return;

      if (msgError) {
        setError(msgError.message ?? "Failed to load messages.");
      } else {
        setMessages(msgData);
        // Mark messages as read
        await markMessagesAsRead(currentUserId!, selectedUserId!);
      }

      setMessagesLoading(false);
    }

    loadMessages();
    return () => {
      active = false;
    };
  }, [selectedUserId, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUserId || !currentUserId) return;

    setSending(true);
    const { data: newMsg, error: sendError } = await sendMessage(
      selectedUserId,
      messageInput
    );
    setSending(false);

    if (sendError) {
      setError(sendError.message ?? "Failed to send message.");
      return;
    }

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");

      // Update conversations list
      const { data: convData } = await getConversations(currentUserId);
      setConversations(convData);
    }
  };

  if (!ready) return null;

  const selectedConversation = conversations.find(
    (c) => c.participantId === selectedUserId
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe8_0%,#f3e7df_45%,#efe2d8_100%)] px-2 pb-3 pt-20 sm:px-3 sm:pb-4 sm:pt-24">
      <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[calc(100vw-1rem)] overflow-hidden rounded-[1.8rem] border border-[#eadccf] bg-[rgba(255,249,245,0.78)] shadow-[0_20px_50px_rgba(88,43,30,0.08)] backdrop-blur-sm sm:h-[calc(100vh-7rem)]">
        {/* Conversations sidebar */}
        <div
          className={`flex flex-col border-r border-[#eadccf] bg-[rgba(255,251,247,0.86)] ${
            selectedUserId ? "hidden sm:flex" : "flex"
          } w-full sm:w-80`}
        >
          <div className="border-b border-[#eadccf] bg-[rgba(255,247,241,0.75)] px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-[#2a1714]">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[#8a736b]">
                Loading conversations…
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-[#d7cdc3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-sm text-[#8a736b]">No messages yet</p>
                <p className="text-xs text-[#b8aea4]">
                  Start a conversation with another user
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.participantId}
                    onClick={() => setSelectedUserId(conversation.participantId)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      selectedUserId === conversation.participantId
                        ? "border border-[#ecd4c7] bg-[linear-gradient(180deg,#fff7f1,#f8e8de)] shadow-sm"
                        : "border border-transparent hover:bg-[#fcf4ee]"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-[#2a1714]">
                        {conversation.participantUsername}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="rounded-full bg-[rgb(var(--brand-accent))] px-2 py-0.5 text-xs font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[#8a736b]">
                      {conversation.lastMessage ?? "(No messages)"}
                    </p>
                    {conversation.lastMessageTime && (
                      <p className="mt-1 text-xs text-[#b8aea4]">
                        {new Date(conversation.lastMessageTime).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages view */}
        <div className="hidden flex-1 flex-col sm:flex">
          {selectedUserId && selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#eadccf] bg-[rgba(255,247,241,0.75)] px-4 py-4 sm:px-6">
                <div>
                  <h3 className="font-semibold text-[#2a1714]">
                    {selectedConversation.participantUsername}
                  </h3>
                  <p className="text-xs text-[#8a736b]">Tap to message</p>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="rounded-lg p-2 hover:bg-[#f6f0ea] sm:hidden"
                >
                  ←
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 bg-[rgba(255,250,246,0.72)] px-4 py-4 sm:px-6">
                {messagesLoading ? (
                  <p className="text-center text-sm text-[#8a736b]">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-[#8a736b]">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUserId ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                          message.senderId === currentUserId
                            ? "bg-[rgb(var(--brand-accent))] text-white"
                            : "bg-[#f0e7e0] text-[#2a1714]"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            message.senderId === currentUserId
                              ? "text-white/70"
                              : "text-[#8a736b]"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#eadccf] bg-[rgba(255,247,241,0.78)] px-4 py-4 sm:px-6"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1 rounded-full border border-[#d7cdc3] bg-[#fffaf6] px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#b8aea4] transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2.5 font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-[rgb(var(--brand-primary))]">{error}</p>
                )}
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[rgba(255,250,246,0.72)]">
              <p className="text-sm text-[#8a736b]">Select a conversation to start messaging</p>
            </div>
          )}
        </div>

        {/* Mobile message view */}
        {selectedUserId && selectedConversation && (
          <div className="flex w-full flex-col bg-[rgba(255,251,247,0.9)] sm:hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eadccf] bg-[rgba(255,247,241,0.75)] px-4 py-4">
              <button
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg p-1.5 hover:bg-[#f6f0ea]"
              >
                ← Back
              </button>
              <h3 className="font-semibold text-[#2a1714]">
                {selectedConversation.participantUsername}
              </h3>
              <div className="w-11" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 bg-[rgba(255,250,246,0.72)] px-4 py-4">
              {messagesLoading ? (
                <p className="text-center text-sm text-[#8a736b]">Loading messages…</p>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-sm text-[#8a736b]">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUserId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                        message.senderId === currentUserId
                          ? "bg-[rgb(var(--brand-accent))] text-white"
                          : "bg-[#f0e7e0] text-[#2a1714]"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.senderId === currentUserId
                            ? "text-white/70"
                            : "text-[#8a736b]"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-[#eadccf] bg-[rgba(255,247,241,0.78)] px-4 py-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 rounded-full border border-[#d7cdc3] bg-[#fffaf6] px-3 py-2 text-sm text-[#2a1714] outline-none placeholder:text-[#b8aea4] transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="rounded-full bg-[rgb(var(--brand-accent))] px-3 py-2 font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-[rgb(var(--brand-primary))]">{error}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent />
    </Suspense>
  );
}
