import { useRef, useState } from "react";
const MessageInput = () => {
    const[text, setText] = useState("");
    const[imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const handleImageChange = () => {};
    const removeImage = () => {};
    const handleSendMessage = () => {};
    return (
        <div>MessagedInput</div>
    )
}
export default MessageInput;