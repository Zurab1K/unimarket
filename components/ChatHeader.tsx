import Image from "next/image";

const ChatHeader = () => {
  return (
    <div className="border-b border-base-300 p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="relative size-10 rounded-full">
              <Image src="/placeholder-avatar-picture.jpg" alt="Jane Doe" fill className="rounded-full object-cover" />
            </div>
          </div>

          <div>
            <h3 className="font-medium">Jane Doe</h3>
            <p className="text-sm text-base-content/70">Online</p>
          </div>
        </div>

        <button type="button">
          <p>Close Button</p>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
