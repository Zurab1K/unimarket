"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  markMessagesAsRead,
  getProfileByUserId,
  searchUsers,
  uploadChatAttachment,
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
  attachment_url?: string | null;
  attachment_type?: string | null;
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

  // Typing indicator
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; fullName: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: "image" | "file" } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => { selectedUserIdRef.current = selectedUserId; }, [selectedUserId]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // Load current user + conversations
  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setError("Not authenticated."); setLoading(false); return; }

      setCurrentUserId(session.user.id);

      const { data: convData, error: convError } = await getConversations(session.user.id);
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
            finalConversations = [
              {
                participantId: sellerId,
                participantUsername: sellerProfile?.username ?? "Seller",
                lastMessage: null,
                lastMessageTime: null,
                unreadCount: 0,
                isInitiatedByUser: true,
              },
              ...convData,
            ];
            selectedId = sellerId;
          }
        }

        if (!selectedId && finalConversations.length > 0) selectedId = finalConversations[0].participantId;
        setConversations(finalConversations);
        setSelectedUserId(selectedId);
      }

      setLoading(false);
    }

    loadData();
    return () => { active = false; };
  }, [ready, searchParams]);

  // Realtime: new messages + read-status updates
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`messages-realtime-${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${currentUserId}`,
      }, async (payload) => {
        const newMsg = payload.new as RealtimeMessageRow;
        const myId = currentUserIdRef.current;
        const selectedId = selectedUserIdRef.current;
        if (!myId) return;

        if (newMsg.sender_id === selectedId) {
          const { data: profile } = await supabase
            .from("profiles").select("username").eq("id", newMsg.sender_id).single();
          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              content: newMsg.content,
              senderId: newMsg.sender_id,
              senderUsername: profile?.username ?? "Unknown",
              receiverId: newMsg.receiver_id,
              receiverUsername: "",
              isRead: false,
              conversationId: newMsg.conversation_id ?? null,
              attachmentUrl: newMsg.attachment_url ?? null,
              attachmentType: (newMsg.attachment_type as Message["attachmentType"]) ?? null,
              createdAt: newMsg.created_at,
              updatedAt: newMsg.updated_at ?? newMsg.created_at,
            },
          ]);
          await markMessagesAsRead(myId, newMsg.sender_id);
        }

        const { data: convData } = await getConversations(myId);
        setConversations(convData);
      })
      // Watch for is_read updates on messages I sent
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${currentUserId}`,
      }, (payload) => {
        const updated = payload.new as RealtimeMessageRow;
        if (updated.is_read) {
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, isRead: true } : m)),
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Typing broadcast channel per conversation
  useEffect(() => {
    if (!currentUserId || !selectedUserId) {
      setIsOtherTyping(false);
      return;
    }

    const channelId = [currentUserId, selectedUserId].sort().join("-");
    console.log("[typing] subscribing to channel:", `typing:${channelId}`);
    const channel = supabase.channel(`typing:${channelId}`);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        console.log("[typing] broadcast received:", payload);
        if (payload.userId === selectedUserId) {
          console.log("[typing] setting isOtherTyping:", payload.isTyping);
          setIsOtherTyping(payload.isTyping);
        }
      })
      .subscribe((status) => {
        console.log("[typing] channel status:", status);
      });

    typingChannelRef.current = channel;

    return () => {
      console.log("[typing] removing channel:", `typing:${channelId}`);
      supabase.removeChannel(channel);
      setIsOtherTyping(false);
      typingChannelRef.current = null;
    };
  }, [currentUserId, selectedUserId]);

  // Load messages when selected user changes
  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    let active = true;

    async function loadMessages() {
      setMessagesLoading(true);
      const { data: msgData, error: msgError } = await getMessagesWithUser(currentUserId!, selectedUserId!);
      if (!active) return;
      if (msgError) {
        setError(msgError.message ?? "Failed to load messages.");
      } else {
        setMessages(msgData);
        await markMessagesAsRead(currentUserId!, selectedUserId!);
        // Update unread badge in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.participantId === selectedUserId ? { ...c, unreadCount: 0 } : c,
          ),
        );
      }
      setMessagesLoading(false);
    }

    loadMessages();
    return () => { active = false; };
  }, [selectedUserId, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // User search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      if (!currentUserId) return;
      const results = await searchUsers(searchQuery, currentUserId);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  }, [searchQuery, currentUserId]);

  function handleInputChange(value: string) {
    setMessageInput(value);
    if (typingChannelRef.current && currentUserId) {
      const isTyping = value.length > 0;
      console.log("[typing] broadcasting isTyping:", isTyping, "channel:", typingChannelRef.current);
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping },
      });
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (isTyping) {
        typingDebounceRef.current = setTimeout(() => {
          console.log("[typing] debounce: clearing isTyping");
          typingChannelRef.current?.send({
            type: "broadcast",
            event: "typing",
            payload: { userId: currentUserId, isTyping: false },
          });
        }, 3000);
      }
    } else {
      console.log("[typing] no channel or user — channel:", typingChannelRef.current, "userId:", currentUserId);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setUploadingFile(true);
    const isImage = file.type.startsWith("image/");
    const { url, error: uploadError } = await uploadChatAttachment(file, currentUserId);
    setUploadingFile(false);
    if (uploadError || !url) { setError("File upload failed."); return; }
    setPendingAttachment({ url, type: isImage ? "image" : "file" });
    // Reset input so same file can be reselected
    e.target.value = "";
  }

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !pendingAttachment) || !selectedUserId || !currentUserId) return;

    setSending(true);
    const { data: newMsg, error: sendError } = await sendMessage(
      selectedUserId,
      messageInput,
      pendingAttachment ?? undefined,
    );
    setSending(false);

    if (sendError) { setError(sendError.message ?? "Failed to send message."); return; }

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");
      setPendingAttachment(null);
      if (typingChannelRef.current) typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUserId, isTyping: false } });
      const { data: convData } = await getConversations(currentUserId);
      setConversations(convData);
    }
  }, [messageInput, pendingAttachment, selectedUserId, currentUserId]);

  function startConversation(userId: string, username: string) {
    setSearchQuery("");
    setSearchResults([]);
    const existing = conversations.find((c) => c.participantId === userId);
    if (!existing) {
      setConversations((prev) => [
        {
          participantId: userId,
          participantUsername: username,
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0,
          isInitiatedByUser: true,
        },
        ...prev,
      ]);
    }
    setSelectedUserId(userId);
  }

  if (!ready) return null;

  const selectedConversation = conversations.find((c) => c.participantId === selectedUserId);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe8_0%,#f3e7df_45%,#efe2d8_100%)] px-2 pb-3 pt-20 sm:px-3 sm:pb-4 sm:pt-24">
      <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[calc(100vw-1rem)] overflow-hidden rounded-[1.8rem] border border-[#eadccf] bg-[rgba(255,249,245,0.78)] shadow-[0_20px_50px_rgba(88,43,30,0.08)] backdrop-blur-sm sm:h-[calc(100vh-7rem)]">

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div className={`flex flex-col border-r border-[#eadccf] bg-[rgba(255,251,247,0.86)] ${selectedUserId ? "hidden sm:flex" : "flex"} w-full sm:w-80`}>

          {/* Sidebar header */}
          <div className="border-b border-[#eadccf] bg-[rgba(255,247,241,0.75)] px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#2a1714]">Messages</h2>
                {totalUnread > 0 && (
                  <span className="rounded-full bg-[rgb(var(--brand-accent))] px-2 py-0.5 text-xs font-bold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
            </div>

            {/* Search users */}
            <div className="relative mt-2.5">
              <input
                type="text"
                placeholder="Search users to message…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-[#e0cfc6] bg-white px-4 py-2 text-sm text-[#2a1714] outline-none placeholder:text-[#b8aea4] focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.18)]"
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs text-[#8a736b]">…</span>
              )}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-2xl border border-[#eadccf] bg-[#fffaf6] shadow-[0_12px_30px_rgba(75,36,28,0.1)]">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => startConversation(u.id, u.username)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fff1e8]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--brand-accent),0.14)] text-xs font-bold text-[rgb(var(--brand-primary))]">
                        {(u.fullName ?? u.username)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2a1714]">@{u.username}</p>
                        {u.fullName && <p className="text-xs text-[#8a736b]">{u.fullName}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[#8a736b]">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#d7cdc3]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-[#8a736b]">No messages yet</p>
                <p className="text-xs text-[#b8aea4]">Search for a user above to start chatting</p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {conversations.map((conv) => {
                  const hasUnread = conv.unreadCount > 0;
                  const isSelected = selectedUserId === conv.participantId;
                  return (
                    <button
                      key={conv.participantId}
                      onClick={() => setSelectedUserId(conv.participantId)}
                      className={`w-full rounded-xl px-3 py-3 text-left transition ${
                        isSelected
                          ? "border border-[#ecd4c7] bg-[linear-gradient(180deg,#fff7f1,#f8e8de)] shadow-sm"
                          : hasUnread
                          ? "border border-[rgba(var(--brand-accent),0.2)] bg-[rgba(var(--brand-accent),0.05)] hover:bg-[rgba(var(--brand-accent),0.08)]"
                          : "border border-transparent hover:bg-[#fcf4ee]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${hasUnread ? "font-bold text-[#1a0f0d]" : "font-medium text-[#2a1714]"}`}>
                          {conv.participantUsername}
                        </p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {conv.lastMessageTime && (
                            <span className="text-[10px] text-[#b8aea4]">
                              {new Date(conv.lastMessageTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {hasUnread && (
                            <span className="rounded-full bg-[rgb(var(--brand-accent))] px-2 py-0.5 text-xs font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`truncate text-xs ${hasUnread ? "font-medium text-[#53433d]" : "text-[#8a736b]"}`}>
                        {conv.lastMessage ?? "(No messages)"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop chat panel ────────────────────────────────────────── */}
        <div className="hidden flex-1 flex-col sm:flex">
          {selectedUserId && selectedConversation ? (
            <ChatPanel
              key={selectedUserId}
              conversation={selectedConversation}
              messages={messages}
              messagesLoading={messagesLoading}
              currentUserId={currentUserId}
              messageInput={messageInput}
              sending={sending}
              uploadingFile={uploadingFile}
              pendingAttachment={pendingAttachment}
              isOtherTyping={isOtherTyping}
              error={error}
              messagesEndRef={messagesEndRef}
              fileInputRef={fileInputRef}
              onBack={() => setSelectedUserId(null)}
              onInputChange={handleInputChange}
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              onRemoveAttachment={() => setPendingAttachment(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[rgba(255,250,246,0.72)]">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#d7cdc3]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mt-3 text-sm text-[#8a736b]">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile chat panel ─────────────────────────────────────────── */}
        {selectedUserId && selectedConversation && (
          <div className="flex w-full flex-col bg-[rgba(255,251,247,0.9)] sm:hidden">
            <ChatPanel
              key={selectedUserId}
              conversation={selectedConversation}
              messages={messages}
              messagesLoading={messagesLoading}
              currentUserId={currentUserId}
              messageInput={messageInput}
              sending={sending}
              uploadingFile={uploadingFile}
              pendingAttachment={pendingAttachment}
              isOtherTyping={isOtherTyping}
              error={error}
              messagesEndRef={messagesEndRef}
              fileInputRef={fileInputRef}
              onBack={() => setSelectedUserId(null)}
              onInputChange={handleInputChange}
              onSend={handleSendMessage}
              onFileSelect={handleFileSelect}
              onRemoveAttachment={() => setPendingAttachment(null)}
              mobile
            />
          </div>
        )}
      </div>
    </main>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

function ChatPanel({
  conversation,
  messages,
  messagesLoading,
  currentUserId,
  messageInput,
  sending,
  uploadingFile,
  pendingAttachment,
  isOtherTyping,
  error,
  messagesEndRef,
  fileInputRef,
  onBack,
  onInputChange,
  onSend,
  onFileSelect,
  onRemoveAttachment,
  mobile = false,
}: {
  conversation: Conversation;
  messages: Message[];
  messagesLoading: boolean;
  currentUserId: string | null;
  messageInput: string;
  sending: boolean;
  uploadingFile: boolean;
  pendingAttachment: { url: string; type: "image" | "file" } | null;
  isOtherTyping: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onBack: () => void;
  onInputChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  mobile?: boolean;
}) {
  // Group messages: show date separator when date changes
  const msgGroups: { date: string; msgs: Message[] }[] = [];
  messages.forEach((m) => {
    const d = new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const last = msgGroups[msgGroups.length - 1];
    if (last?.date === d) { last.msgs.push(m); } else { msgGroups.push({ date: d, msgs: [m] }); }
  });

  // Last outgoing message to show read receipt on
  const lastOutgoingId = messages.slice().reverse().find((m) => m.senderId === currentUserId)?.id;

  return (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-[#eadccf] bg-[rgba(255,247,241,0.75)] px-4 py-3 ${mobile ? "" : "sm:px-6"}`}>
        <div className="flex items-center gap-3">
          {mobile && (
            <button onClick={onBack} className="rounded-lg p-1.5 text-sm font-medium text-[#7a5a52] hover:bg-[#f6f0ea]">
              ← Back
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(var(--brand-accent),0.14)] text-sm font-bold text-[rgb(var(--brand-primary))]">
            {conversation.participantUsername[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#2a1714]">{conversation.participantUsername}</p>
            {isOtherTyping ? (
              <span className="flex items-center gap-1">
                <span className="text-xs font-medium text-[rgb(var(--brand-primary))]">typing</span>
                <span className="flex items-end gap-[3px] pb-[1px]">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-primary))] animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </span>
            ) : (
              <p className="text-xs text-[#8a736b]">Active</p>
            )}
          </div>
        </div>
        {!mobile && (
          <button onClick={onBack} className="rounded-lg p-2 text-[#8a736b] hover:bg-[#f6f0ea] sm:hidden">←</button>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto bg-[rgba(255,250,246,0.72)] px-4 sm:px-6">
        <div className="flex min-h-full flex-col justify-end gap-1 py-4">
          {messagesLoading ? (
            <p className="text-center text-sm text-[#8a736b]">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-[#8a736b]">No messages yet. Start the conversation!</p>
          ) : (
            msgGroups.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="my-3 flex items-center gap-3">
                  <div className="flex-1 border-t border-[#e8dcd3]" />
                  <span className="shrink-0 rounded-full bg-[#f0e7e0] px-3 py-0.5 text-[10px] font-medium text-[#8a736b]">{group.date}</span>
                  <div className="flex-1 border-t border-[#e8dcd3]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  {group.msgs.map((message) => {
                    const isMine = message.senderId === currentUserId;
                    const isLastOutgoing = isMine && message.id === lastOutgoingId;
                    return (
                      <div key={message.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-sm ${isMine ? "bg-[rgb(var(--brand-accent))] text-white" : "bg-[#f0e7e0] text-[#2a1714]"}`}>
                          {/* Attachment */}
                          {message.attachmentUrl && message.attachmentType === "image" && (
                            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={message.attachmentUrl}
                                alt="attachment"
                                className="mb-2 max-h-48 w-full rounded-xl object-cover"
                              />
                            </a>
                          )}
                          {message.attachmentUrl && message.attachmentType === "file" && (
                            <a
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${isMine ? "border-white/30 bg-white/10" : "border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037]"}`}
                            >
                              📎 Download file
                            </a>
                          )}
                          {/* Text content */}
                          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
                          {/* Timestamp */}
                          <p className={`mt-1 text-[10px] ${isMine ? "text-white/60" : "text-[#8a736b]"}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {/* Read receipt — only on the last outgoing message */}
                        {isLastOutgoing && (
                          <p className={`mt-0.5 text-[10px] font-medium ${message.isRead ? "text-[rgb(var(--brand-accent))]" : "text-[#b8aea4]"}`}>
                            {message.isRead ? "✓✓ Seen" : "✓ Sent"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={onSend}
        className={`border-t border-[#eadccf] bg-[rgba(255,247,241,0.78)] px-4 py-3 ${mobile ? "" : "sm:px-6"}`}
      >
        {/* Pending attachment preview */}
        {pendingAttachment && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#e0cfc6] bg-[#faf5f2] px-3 py-2">
            {pendingAttachment.type === "image" ? (
              <img src={pendingAttachment.url} alt="preview" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="text-base">📎</span>
            )}
            <span className="flex-1 truncate text-xs text-[#6d4037]">
              {pendingAttachment.type === "image" ? "Image ready to send" : "File ready to send"}
            </span>
            <button type="button" onClick={onRemoveAttachment} className="text-xs text-[#8a736b] hover:text-red-500">✕</button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="shrink-0 rounded-full border border-[#e0cfc6] bg-[#faf5f2] p-2.5 text-[#7a5a52] transition hover:bg-[#f1e4dc] disabled:opacity-50"
            title="Attach image or file"
          >
            {uploadingFile ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-[#e0cfc6] border-t-[#7a5a52]" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={onFileSelect}
          />

          <input
            type="text"
            value={messageInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type a message…"
            disabled={sending}
            className="flex-1 rounded-full border border-[#d7cdc3] bg-[#fffaf6] px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#b8aea4] transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || (!messageInput.trim() && !pendingAttachment)}
            className="shrink-0 rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2.5 font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </form>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageContent />
    </Suspense>
  );
}
