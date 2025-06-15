import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

// Cloudinary Upload Helper
const uploadToCloudinary = async (file, resourceType = "auto") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_upload_preset"); // change
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

  // Typing Indicator Logic
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
  }, [text]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleAudioRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
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
      } catch (err) {
        toast.error("Microphone permission denied");
      }
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error("Speech Recognition not supported");

    if (isRecognizing) {
      recognitionRef.current?.stop();
      setIsRecognizing(false);
    } else {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (e) => {
        let final = text;
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += transcript + " ";
          else interim += transcript;
        }
        setText(final + interim);
      };

      recognitionRef.current.onerror = () => {
        toast.error("Speech recognition error");
        setIsRecognizing(false);
      };

      recognitionRef.current.onend = () => setIsRecognizing(false);
      recognitionRef.current.start();
      setIsRecognizing(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let imageUrl = null;
      let audioUrl = null;

      if (fileInputRef.current?.files[0]) {
        imageUrl = await uploadToCloudinary(fileInputRef.current.files[0], "image");
      }

      if (audioBlob) {
        const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" });
        audioUrl = await uploadToCloudinary(audioFile, "video");
      }

      await sendMessage({
        receiver: selectedUser._id,
        text: text.trim(),
        image: imageUrl,
        audio: audioUrl,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error("Failed to send");
    }
  };

  return (
    <div className="w-full p-3 border-t bg-base-100">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-2 relative w-fit">
          <img src={imagePreview} alt="preview" className="w-24 h-24 rounded-lg object-cover border" />
          <button
            onClick={removeImage}
            className="btn btn-xs btn-circle absolute -top-2 -right-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {audioBlob && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <button onClick={removeAudio} className="btn btn-xs btn-circle">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            className="input input-bordered w-full input-sm sm:input-md"
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
            className={`btn btn-circle ${imagePreview ? "text-green-600" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording}
            title="Upload Image"
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`btn btn-circle ${isRecognizing ? "text-blue-600" : "text-zinc-400"}`}
          disabled={isRecording}
          title={isRecognizing ? "Stop Voice to Text" : "Voice to Text"}
        >
          <MessageCircle size={20} />
        </button>

        <button
          type="button"
          onClick={toggleAudioRecording}
          className={`btn btn-circle ${isRecording ? "text-red-500" : "text-zinc-400"}`}
          disabled={isRecognizing}
          title={isRecording ? "Stop Recording" : "Record Audio"}
        >
          {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
        </button>

        <button
          type="submit"
          className="btn btn-circle btn-sm"
          disabled={!text.trim() && !imagePreview && !audioBlob}
          title="Send"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
