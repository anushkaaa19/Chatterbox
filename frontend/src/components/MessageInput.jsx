import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

// Utility to upload files to Cloudinary
const uploadToCloudinary = async (file, resourceType = "auto") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_upload_preset"); // change this
  const res = await fetch(`https://api.cloudinary.com/v1_1/your_cloud_name/${resourceType}/upload`, {
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
  const [isRecognizing, setIsRecognizing] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { socket, authUser } = useAuthStore();

  // Typing indicator
  useEffect(() => {
    if (!socket || !authUser || !selectedUser) return;
    let timeout;
    if (text.trim()) {
      socket.emit("typing", {
        fromUserId: authUser._id,
        toUserId: selectedUser._id,
      });

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        socket.emit("stopTyping", {
          fromUserId: authUser._id,
          toUserId: selectedUser._id,
        });
      }, 1000);
    } else {
      socket.emit("stopTyping", {
        fromUserId: authUser._id,
        toUserId: selectedUser._id,
      });
    }
    return () => clearTimeout(timeout);
  }, [text, socket, authUser, selectedUser]);

  // Image Handling
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const imageURL = URL.createObjectURL(file);
    setImagePreview(imageURL);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio Recording
  const toggleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  // Speech Recognition
  const toggleSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported");
      return;
    }

    if (isRecognizing) {
      recognitionRef.current.stop();
      setIsRecognizing(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let interim = "";
        let finalText = text;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          event.results[i].isFinal ? (finalText += transcript + " ") : (interim += transcript);
        }
        setText(finalText + interim);
      };

      recognitionRef.current.onerror = (e) => {
        toast.error("Speech error: " + e.error);
        setIsRecognizing(false);
      };

      recognitionRef.current.onend = () => setIsRecognizing(false);
      recognitionRef.current.start();
      setIsRecognizing(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let imageUrl = null;
      let audioUrl = null;

      if (fileInputRef.current?.files[0]) {
        imageUrl = await uploadToCloudinary(fileInputRef.current.files[0], "image");
      }

      if (audioBlob) {
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
        audioUrl = await uploadToCloudinary(audioFile, "video");
      }

      await sendMessage({
        to: selectedUser._id,
        text: text.trim(),
        image: imageUrl,
        audio: audioUrl,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Send failed", err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {audioBlob && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <button onClick={removeAudio} className="btn btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecording}
          />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isRecording}
          />

          <button
            type="button"
            className={`btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording}
            title="Upload Image"
          >
            <Image size={20} />
          </button>
        </div>

        {/* Voice-to-Text */}
        <button
          type="button"
          className={`btn btn-circle ${isRecognizing ? "text-blue-600" : "text-zinc-400"}`}
          onClick={toggleSpeechRecognition}
          disabled={isRecording}
          title={isRecognizing ? "Stop Voice to Text" : "Start Voice to Text"}
        >
          <MessageCircle size={22} />
        </button>
        
        {/* Record Audio */}
        <button
          type="button"
          className={`btn btn-circle ${isRecording ? "text-red-500" : "text-zinc-400"}`}
          onClick={toggleAudioRecording}
          disabled={isRecognizing}
          title={isRecording ? "Stop Recording" : "Record Audio"}
        >
          {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
          title="Send Message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
