/* PLACEHOLDER CODE */
import MessageInput from "@/components/MessageInput";
import ChatHeader from "@/components/ChatHeader";
export default function Chat() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <ChatHeader />
      <p>messages...</p>
      <MessageInput />
    </main>
  );
}
