import { useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";
import toast from "react-hot-toast";
import { Image, Send, X, Mic, StopCircle, MessageCircle } from "lucide-react";

const GroupMessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const socket = useAuthStore((state) => state.socket);
  const authUser = useAuthStore((state) => state.authUser);
  const selectedGroup = useGroupStore((state) => state.selectedGroup);
  const sendGroupMessage = useGroupStore((state) => state.sendGroupMessage);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
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
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm", // ✅ Force audio MIME
        });
        audioChunksRef.current = [];
  
        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
  
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); // Keep MIME here too
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
    if (!selectedGroup) {
      toast.error("No group selected");
      return;
    }
    if (!text.trim() && !imagePreview && !audioBlob) return;

    let audioDataUrl = null;
    if (audioBlob) {
      audioDataUrl = await blobToDataURL(audioBlob);
    }

    try {
      await sendGroupMessage(selectedGroup._id, {
        text: text.trim(),
        image: imagePreview,
        audio: audioDataUrl,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send group message:", error);
      toast.error("Failed to send group message");
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
            >
              <X className="size-3" />
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
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isRecordingAudio}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isRecordingAudio}
          />
          <button
            type="button"
            className={`btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecordingAudio}
            title="Upload Image"
          >
            <Image size={20} />
          </button>
        </div>

        <button
          type="button"
          className={`btn btn-circle ${isRecognizing ? "text-blue-600" : "text-zinc-400"}`}
          onClick={toggleSpeechRecognition}
          title={isRecognizing ? "Stop Voice to Text" : "Start Voice to Text"}
          disabled={isRecordingAudio}
        >
          <MessageCircle size={24} />
        </button>

        <button
          type="button"
          className={`btn btn-circle ${isRecordingAudio ? "text-red-500" : "text-zinc-400"}`}
          onClick={toggleAudioRecording}
          title={isRecordingAudio ? "Stop Recording" : "Record Audio"}
          disabled={isRecognizing}
        >
          {isRecordingAudio ? <StopCircle size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioBlob}
          title="Send Group Message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput;
