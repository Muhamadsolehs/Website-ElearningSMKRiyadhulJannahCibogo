// components/ActivityEditForm.tsx
import { Trash2 } from "lucide-react";

interface ActivityEditFormProps {
    activity: any;
    onUpdate: (id: number, updates: any) => void;
    onDelete: (id: number) => void;
}

export default function ActivityEditForm({
    activity,
    onUpdate,
    onDelete,
}: ActivityEditFormProps) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 border-l-4 border-yellow-500">
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Judul Aktivitas
                </label>
                <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    value={activity.judul}
                    onChange={(e) =>
                        onUpdate(activity.id_activity, { judul: e.target.value })
                    }
                    placeholder="Masukkan judul aktivitas..."
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onDelete(activity.id_activity)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    <Trash2 className="w-4 h-4" /> Hapus Aktivitas
                </button>
            </div>
        </div>
    );
}