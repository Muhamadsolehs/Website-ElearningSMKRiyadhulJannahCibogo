// SubmissionModal.tsx
import { useState } from "react";
import { X, ChevronLeft, BookOpen, CheckSquare, Brain, ArrowRight } from "lucide-react";
import ModuleModal from "./ModulModal";
import TugasModal from "./TugasModal";
import KuisModal from "./KuisModal";

type ModalView = 'select' | 'modul' | 'tugas' | 'kuis';

interface SubmissionModalProps {
    activityId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SubmissionModal({ activityId, onClose, onSuccess }: SubmissionModalProps) {
    const [currentView, setCurrentView] = useState<ModalView>('select');

    const handleBackToSelect = () => {
        setCurrentView('select');
    };

    const handleSuccessAndClose = () => {
        onSuccess();
        onClose();
    };

    const renderContent = () => {
        switch (currentView) {
            case 'select':
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                ➕ Tambah Submission
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pilih jenis submission yang ingin ditambahkan ke aktivitas ini.
                            </p>
                        </div>

                        {/* Submission Options */}
                        <div className="grid gap-3">
                            {/* Modul Card */}
                            <button
                                onClick={() => setCurrentView('modul')}
                                className="group relative px-5 py-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-600 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Modul
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                Video atau file materi pembelajaran
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            {/* Tugas Card */}
                            <button
                                onClick={() => setCurrentView('tugas')}
                                className="group relative px-5 py-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md transition-all duration-200 text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-600 rounded-lg">
                                            <CheckSquare className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Tugas
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                Tugas dengan deadline dan file
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            {/* Kuis Card */}
                            <button
                                onClick={() => setCurrentView('kuis')}
                                className="group relative px-5 py-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200 text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-600 rounded-lg">
                                            <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                Kuis
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                Kuis dengan durasi dan deadline
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                <span className="font-semibold">💡 Note:</span> Silahkan pilih submission apa yang ingin anda buat.
                            </p>
                        </div>
                    </div>
                );

            case 'modul':
                return (
                    <ModuleModal
                        activityId={activityId}
                        onBack={handleBackToSelect}
                        onSuccess={handleSuccessAndClose}
                    />
                );

            case 'tugas':
                return (
                    <TugasModal
                        activityId={activityId}
                        onBack={handleBackToSelect}
                        onSuccess={handleSuccessAndClose}
                    />
                );

            case 'kuis':
                return (
                    <KuisModal
                        activityId={activityId}
                        onBack={handleBackToSelect}
                        onSuccess={handleSuccessAndClose}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-slideUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentView !== 'select' && (
                            <button
                                onClick={handleBackToSelect}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-gray-600 dark:text-gray-400"
                                title="Kembali"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition text-gray-600 dark:text-gray-400"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}