import { useEffect, useRef, useState } from "react";
import { Image, Mic, StopCircle, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

// Replace with your actual values
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME";
const UPLOAD_PRESET = "YOUR_UPLOAD_PRESET";

const uploadToCloudinary = async (file, resourceType = "auto") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`${CLOUDINARY_URL}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  return data.secure_url;
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);

  const { selectedUser, sendMessage } = useChatStore();
  const { authUser, socket } = useAuthStore();

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedUser._id });
    }, 3000);

    return () => clearTimeout(typingTimeout);
  }, [text]);

  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit("typing", { to: selectedUser._id });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImagePreview(file);
  };

  const handleAudioStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audio = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(audio);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const handleAudioStop = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetInputs = () => {
    setText("");
    setImagePreview(null);
    setAudioBlob(null);
  };

  const handleSend = async () => {
    if (!selectedUser?._id || (!text && !imagePreview && !audioBlob)) return;

    const messageData = {};
    if (text) messageData.text = text;

    try {
      if (imagePreview) {
        const imgUrl = await uploadToCloudinary(imagePreview, "image");
        messageData.image = imgUrl;
      }

      if (audioBlob) {
        const audioUrl = await uploadToCloudinary(audioBlob, "video");
        messageData.audio = audioUrl;
      }

      await sendMessage(selectedUser._id, messageData);
      resetInputs();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 bg-white border-t border-zinc-300 flex items-center gap-3">
      <label className="cursor-pointer">
        <Image className="w-5 h-5 text-zinc-500" />
        <input type="file" accept="image/*" hidden onChange={handleImageChange} />
      </label>

      {!isRecording ? (
        <button onClick={handleAudioStart}>
          <Mic className="w-5 h-5 text-zinc-500" />
        </button>
      ) : (
        <button onClick={handleAudioStop}>
          <StopCircle className="w-5 h-5 text-red-500" />
        </button>
      )}

      <textarea
        rows={1}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 resize-none border border-zinc-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />

      <button
        onClick={handleSend}
        disabled={!text && !imagePreview && !audioBlob}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
      </button>

      {/* Preview UI */}
      {(imagePreview || audioBlob) && (
        <div className="fixed bottom-20 right-4 bg-white border p-3 rounded-lg shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium mb-2">Preview</p>
            <button onClick={resetInputs}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
          {imagePreview && (
            <img
              src={URL.createObjectURL(imagePreview)}
              alt="Preview"
              className="max-w-xs rounded-md mt-2"
            />
          )}
          {audioBlob && (
            <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2 w-64" />
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
