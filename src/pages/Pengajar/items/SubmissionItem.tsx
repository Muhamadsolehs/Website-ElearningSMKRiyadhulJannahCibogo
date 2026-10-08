// components/items/SubmissionItem.tsx
import { Edit3, Trash2, Clock } from "lucide-react";

interface SubmissionItemProps {
    item: any;
    type: "tugas" | "kuis";
    onEdit: (item: any) => void;
    onDelete: () => void;
}

export default function SubmissionItem({
    item,
    type,
    onEdit,
    onDelete,
}: SubmissionItemProps) {
    const formatDeadline = (value: string | null | undefined) => {
        if (!value) return null;
        try {
            const date = new Date(value);
            return date.toLocaleString("id-ID", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return value;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {item.judul}
                    </p>

                    {item.deskripsi && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {item.deskripsi}
                        </p>
                    )}

                    {/* DIBUKA */}
                    {item.dibuka && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Dibuka: {formatDeadline(item.dibuka)}</span>
                        </div>
                    )}


                    {/* DEADLINE */}
                    {item.deadline && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>Deadline: {formatDeadline(item.deadline)}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={() => onEdit(item)}
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
