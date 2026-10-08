// components/items/ModuleItem.tsx
import { Edit3, Trash2, Film, Download, FileText } from "lucide-react";
import { useState } from "react";

interface ModuleItemProps {
    modul: any;
    onEdit: () => void;
    onDelete: () => void;
}

export default function ModuleItem({ modul, onEdit, onDelete }: ModuleItemProps) {
    const [showPreview, setShowPreview] = useState(false);

    const getYoutubeEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        try {
            const videoId = new URL(url).searchParams.get("v");
            if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            const match = url.match(/youtu\.be\/([^?]+)/);
            if (match) return `https://www.youtube.com/embed/${match[1]}`;
            return null;
        } catch {
            return null;
        }
    };

    const extractFileName = (url: string): string => {
        const parts = url.split("/");
        return parts[parts.length - 1] || "file";
    };

    const embedUrl = modul.url_video ? getYoutubeEmbedUrl(modul.url_video) : null;
    const isFile = modul.url_file && modul.url_file.match(/\.(mp4|webm|ogg|pdf|doc|docx|xls|xlsx)$/i);

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {modul.judul}
                    </p>
                    {modul.deskripsi && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {modul.deskripsi}
                        </p>
                    )}

                    {/* Preview Video YouTube */}
                    {embedUrl && showPreview && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                            <iframe
                                src={embedUrl}
                                title={modul.judul}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-400 h-200 rounded-lg"
                            ></iframe>
                        </div>
                    )}

                    {/* File Link */}
                    {isFile && (
                        <a
                            href={modul.url_file}
                            download
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs mt-2"
                        >
                            <Download className="w-3 h-3" />
                            {extractFileName(modul.url_file)}
                        </a>
                    )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                    {embedUrl && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded transition"
                            title="Preview"
                        >
                            <Film className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-gray-700 rounded transition"
                        title="Edit"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-gray-700 rounded transition"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}