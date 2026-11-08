import { useState, useRef } from "react";
import { RepairImage } from "@/types/repair";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Plus, ZoomIn, Loader2 } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface ImageUploaderProps {
  images: RepairImage[];
  onChange: (images: RepairImage[]) => void;
  readOnly?: boolean;
}

const MAX_SIZE = 800;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = (h / w) * MAX_SIZE; w = MAX_SIZE; }
          else { w = (w / h) * MAX_SIZE; h = MAX_SIZE; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        // Try WebP first (much lighter), fallback to JPEG
        const useWebP = typeof canvas.toBlob === "function";
        const mime = useWebP ? "image/webp" : "image/jpeg";
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, mime, 0.6);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ImageUploader = ({ images, onChange, readOnly = false }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const newImages: RepairImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      try {
        const blob = await resizeImage(file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const fileName = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage
          .from("repair-images")
          .upload(fileName, blob, { contentType: blob.type, upsert: false });

        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        // Use signed URL (valid 1 year) since bucket is private
        const { data: signedData, error: signError } = await supabase.storage
          .from("repair-images")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

        if (signError || !signedData?.signedUrl) {
          console.error("Signed URL error:", signError);
          continue;
        }

        newImages.push({
          id: `img-${Date.now()}-${i}`,
          dataUrl: signedData.signedUrl,
          fecha: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Image processing error:", err);
      }
    }

    if (newImages.length > 0) onChange([...images, ...newImages]);
    if (inputRef.current) inputRef.current.value = "";
    setUploading(false);
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const openAt = (idx: number) => setPreviewIdx(idx);
  const step = (delta: number) =>
    setPreviewIdx((cur) => {
      if (cur === null || images.length === 0) return cur;
      return (cur + delta + images.length) % images.length;
    });

  return (
    <div>
      {/* Grid of thumbnails */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/30">
            <img
              src={img.dataUrl}
              alt="Equipo"
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => openAt(idx)}
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              aria-label="Ampliar foto"
              onClick={() => openAt(idx)}
              className="absolute bottom-1 right-1 bg-background/80 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ZoomIn className="w-3 h-3 text-foreground" />
            </button>
          </div>
        ))}

        {/* Add button */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors min-h-[80px] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
            <span className="text-[10px] font-medium">{uploading ? "Subiendo..." : "Agregar"}</span>
          </button>
        )}
      </div>

      {/* Hidden input */}
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      )}

      {/* Add more button for mobile */}
      {!readOnly && images.length > 0 && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex items-center gap-1.5 text-primary text-sm font-medium active:opacity-70 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Agregar más fotos
        </button>
      )}

      {/* Fullscreen viewer with zoom */}
      {previewIdx !== null && images[previewIdx] && (
        <ImageLightbox
          src={images[previewIdx].dataUrl}
          alt={images[previewIdx].nota || "Foto del equipo"}
          index={previewIdx}
          total={images.length}
          onPrev={images.length > 1 ? () => step(-1) : undefined}
          onNext={images.length > 1 ? () => step(1) : undefined}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>
  );
};

export default ImageUploader;
