import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { Image, Send, X, Mic, StopCircle, MessageCircle } from "lucide-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const socket = useAuthStore((state) => state.socket);
  const authUser = useAuthStore((state) => state.authUser);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const { sendMessage } = useChatStore();

  useEffect(() => {
    if (!socket || !authUser || !selectedUser) return;

    let typingTimeout;
    if (text.trim()) {
      socket.emit("typing", {
        fromUserId: authUser._id,
        toUserId: selectedUser._id,
      });

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
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

    return () => clearTimeout(typingTimeout);
  }, [text, socket, authUser, selectedUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setFileData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
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
      toast.error("Speech recognition not supported in this browser");
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
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
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
    if (!text.trim() && !fileData && !audioBlob) return;

    let audioDataUrl = null;
    if (audioBlob) {
      audioDataUrl = await blobToDataURL(audioBlob);
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: fileData,
        audio: audioDataUrl,
      });

      setText("");
      removeFile();
      removeAudio();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {/* File Preview */}
      {filePreview && (
        <div className="mb-3 relative w-fit">
          <img
            src={filePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
          />
          <button
            onClick={removeFile}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            type="button"
            aria-label="Remove file"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {audioBlob && (
        <div className="mb-3 flex items-center gap-2">
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <button
            onClick={removeAudio}
            className="btn btn-sm btn-circle"
            type="button"
            aria-label="Remove audio"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecordingAudio}
          />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isRecordingAudio}
          />

          <button
            type="button"
            className={`btn btn-circle ${filePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecordingAudio}
            aria-label="Attach file"
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="button"
          className={`btn btn-circle ${isRecognizing ? "text-blue-600" : "text-zinc-400"}`}
          onClick={toggleSpeechRecognition}
          disabled={isRecordingAudio}
          aria-label="Toggle speech-to-text"
        >
          <MessageCircle size={24} />
        </button>

        <button
          type="button"
          className={`btn btn-circle ${isRecordingAudio ? "text-red-500" : "text-zinc-400"}`}
          onClick={toggleAudioRecording}
          disabled={isRecognizing}
          aria-label="Toggle voice recording"
        >
          {isRecordingAudio ? <StopCircle size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !fileData && !audioBlob}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
