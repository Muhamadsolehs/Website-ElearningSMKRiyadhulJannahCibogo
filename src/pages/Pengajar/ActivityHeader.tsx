// components/ActivityHeader.tsx
import { BookOpen, FileText, CheckSquare, Brain, Edit3, Save, X } from "lucide-react";

interface ActivityHeaderProps {
    mapelName: string | null;
    activities: any[];
    editMode: boolean;
    loading: boolean;
    onToggleEditMode: () => void;
    onSave: () => void;
}

export default function ActivityHeader({
    mapelName,
    activities,
    editMode,
    loading,
    onToggleEditMode,
    onSave,
}: ActivityHeaderProps) {
    // Hitung total submissions
    const totalModul = activities.reduce((sum, act) => sum + (act.modul?.length || 0), 0);
    const totalTugas = activities.reduce((sum, act) => sum + (act.tugas?.length || 0), 0);
    const totalKuis = activities.reduce((sum, act) => sum + (act.kuis?.length || 0), 0);

    return (
        <div className="mb-8">
            {/* Top Section - Mata Pelajaran */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mata Pelajaran</p>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {mapelName || "Memuat..."}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {!editMode ? (
                        <button
                            onClick={onToggleEditMode}
                            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-md hover:shadow-lg"
                        >
                            <Edit3 className="w-4 h-4" /> Edit Mode
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onSave}
                                disabled={loading}
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> Simpan
                            </button>
                            <button
                                onClick={onToggleEditMode}
                                disabled={loading}
                                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                <X className="w-4 h-4" /> Batal
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {/* Activities Count */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Aktivitas</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {activities.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Module Count */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Modul</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalModul}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Task Count */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Tugas</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalTugas}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quiz Count */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Kuis</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalKuis}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Content */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-indigo-100">Total Konten</p>
                            <p className="text-2xl font-bold text-white">
                                {totalModul + totalTugas + totalKuis}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Kelola Aktivitas Pembelajaran
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Atur modul pembelajaran, tugas, dan kuis untuk mata pelajaran ini. Klik tombol Edit Mode untuk menambah atau mengubah aktivitas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}