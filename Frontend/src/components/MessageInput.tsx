import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import Compressor from "compressorjs";

const MAX_IMAGES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per image

interface ImageItem {
    preview: string;
    loading: boolean;
}

export const MessageInput = () => {
    const [text, setText] = useState("");
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { sendMessage } = useChatStore();

    const imagesLoading = images.some((img) => img.loading);
    const hasContent = text.trim() || images.length > 0;
    const sendDisabled = !hasContent || imagesLoading || isSending;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) {
            toast.error(`Max ${MAX_IMAGES} images at a time`);
            e.target.value = "";
            return;
        }

        const filesToProcess = files.slice(0, remaining);
        if (files.length > remaining) {
            toast.error(`Only ${remaining} more image(s) allowed`);
        }

        // Validate all files first
        for (const file of filesToProcess) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select image files only");
                e.target.value = "";
                return;
            }
            if (file.size > MAX_SIZE) {
                toast.error(`Max image size is ${MAX_SIZE / (1024 * 1024)}MB`);
                e.target.value = "";
                return;
            }
        }

        // Add placeholders (loading state)
        const startIndex = images.length;
        const placeholders: ImageItem[] = filesToProcess.map(() => ({
            preview: "",
            loading: true,
        }));
        setImages((prev) => [...prev, ...placeholders]);

        // Compress each file
        filesToProcess.forEach((file, i) => {
            new Compressor(file, {
                quality: 0.4,
                success(compressedFile) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImages((prev) => {
                            const updated = [...prev];
                            const idx = startIndex + i;
                            if (idx < updated.length) {
                                updated[idx] = {
                                    preview: reader.result as string,
                                    loading: false,
                                };
                            }
                            return updated;
                        });
                    };
                    reader.readAsDataURL(compressedFile);
                },
                error() {
                    toast.error("Failed to compress image");
                    setImages((prev) => prev.filter((_, idx) => idx !== startIndex + i));
                },
            });
        });

        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (sendDisabled) return;

        setIsSending(true);
        try {
            // Send first image with the message (backend expects single imageBase64)
            const firstImage = images.length > 0 ? images[0].preview : null;
            await sendMessage({ text: text.trim(), imageBase64: firstImage });

            // Send remaining images as separate messages
            for (let i = 1; i < images.length; i++) {
                await sendMessage({ text: "", imageBase64: images[i].preview });
            }

            // Clear form
            setText("");
            setImages([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Message sending failed");
        } finally {
            setIsSending(false);
        }
    };

    const loadingCount = images.filter((img) => img.loading).length;

    return (
        <div className="p-4 w-full">
            {/* Image previews */}
            {images.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {images.map((img, index) => (
                            <div key={index} className="relative">
                                {img.loading ? (
                                    <div className="w-20 h-20 rounded-lg border border-zinc-700 bg-base-200 flex items-center justify-center">
                                        <Loader2 className="size-6 animate-spin text-zinc-400" />
                                    </div>
                                ) : (
                                    <img
                                        src={img.preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
                                    />
                                )}
                                <button
                                    onClick={() => removeImage(index)}
                                    aria-label="Remove image"
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                                    type="button"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Loading indicator text */}
                    {imagesLoading && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
                            <Loader2 className="size-3 animate-spin" />
                            <span>Compressing {loadingCount} image{loadingCount > 1 ? "s" : ""}...</span>
                        </div>
                    )}
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
                        disabled={isSending}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        multiple
                    />
                    <button
                        type="button"
                        className={`hidden sm:flex btn btn-circle ${images.length > 0 ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={images.length >= MAX_IMAGES || isSending}
                    >
                        <Image size={20} />
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-sm btn-circle"
                    disabled={sendDisabled}
                >
                    {isSending ? (
                        <Loader2 size={22} className="animate-spin" />
                    ) : (
                        <Send size={22} />
                    )}
                </button>
            </form>
        </div>
    );
};
