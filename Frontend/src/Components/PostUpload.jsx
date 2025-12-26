import { useState, useRef } from "react";
import API from "../utils/axiosClient";
import { Camera } from "lucide-react";

export default function PostUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

  const onPick = (e) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("Please select an image or video file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File too large (max 50MB)");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("media", file);
      fd.append("caption", caption || "");

      const res = await API.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpload?.(res.data);

      setFile(null);
      setPreview(null);
      setCaption("");
      ref.current.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
          <Camera className="w-4 h-4" />
          <span className="text-sm text-gray-700">Photo/Video</span>
          <input ref={ref} type="file" accept="image/*,video/*" onChange={onPick} className="hidden" />
        </label>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
        />

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {uploading ? "Posting..." : "Post"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {preview && (
        <div className="mt-3 rounded-md overflow-hidden bg-gray-50">
          {file.type.startsWith("image/") ? (
            <img src={preview} alt="preview" className="w-full object-cover max-h-[40vh]" />
          ) : (
            <video controls src={preview} className="w-full object-contain max-h-[40vh]" />
          )}
        </div>
      )}
    </div>
  );
}
