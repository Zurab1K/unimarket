const ChatHeader = () => {
     return (
        <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
                <div className="size-10 rounded-full relative">
                <img src={ /* selectedUser.profilePic || */ "/avatar.png"} alt={/* selectedUser.fullName */ "Jane Doe"} />
                </div>
            </div>

            {/* User info */}
            <div>
                <h3 className="font-medium">{"Jane Doe"}</h3>
                <p className="text-sm text-base-content/70">
                {true /* adding logic here to show online status*/? "Online" : "Offline"}
                </p>
            </div>
            </div>

            {/* Close button */}
            <button onClick={() => {/* logic to set selected user to null */}}>
                <p>Close Button</p> // or an image icon
            </button>
        </div>
        </div>
    );
};
export default ChatHeader;