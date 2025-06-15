import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { Image, Send, X, Mic, StopCircle, MessageCircle } from "lucide-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const authUser = useAuthStore((state) => state.authUser);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat_uploads"); // ✅ your actual upload preset
      const res = await fetch("https://api.cloudinary.com/v1_1/dwuadroo0/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
      } else {
        toast.error("Image upload failed");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Error uploading image");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
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
        setIsRecordingAudio(true);
      } catch {
        toast.error("Microphone access denied");
      }
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
  };

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
        let interimTranscript = "";
        let finalTranscript = text;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript + " ";
          else interimTranscript += transcript;
        }

        setText(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        toast.error("Speech recognition error: " + event.error);
        setIsRecognizing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecognizing(false);
      };

      recognitionRef.current.start();
      setIsRecognizing(true);
    }
  };

  const blobToDataURL = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChat) return toast.error("No user selected");
    if (!text.trim() && !imagePreview && !audioBlob) return;

    let audioDataUrl = null;
    if (audioBlob) audioDataUrl = await blobToDataURL(audioBlob);

    try {
      await sendMessage(selectedChat._id, {
        text: text.trim(),
        image: imagePreview,
        audio: audioDataUrl,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border" />
            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 btn btn-xs btn-circle bg-base-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {audioBlob && (
        <div className="mb-3 flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <button onClick={removeAudio} className="btn btn-sm btn-circle ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered w-full input-sm sm:input-md"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecordingAudio}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            disabled={isRecordingAudio}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            disabled={isRecordingAudio}
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`btn btn-circle ${isRecognizing ? "text-blue-600" : "text-zinc-400"}`}
          disabled={isRecordingAudio}
        >
          <MessageCircle size={24} />
        </button>

        <button
          type="button"
          onClick={toggleAudioRecording}
          className={`btn btn-circle ${isRecordingAudio ? "text-red-500" : "text-zinc-400"}`}
          disabled={isRecognizing}
        >
          {isRecordingAudio ? <StopCircle size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;