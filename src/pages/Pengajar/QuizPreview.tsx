// pages/QuizPreview.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { ArrowLeft, Plus, Edit, Trash2, Eye } from "lucide-react";
import QuestionModal from "./QuestionModal";

interface Quiz {
    id_kuis: number;
    judul: string;
    deskripsi: string;
    durasi: number;
    id_activity: number; // Kunci yang menyimpan ID Mapel tujuan
}

interface Question {
    id_soal: number;
    id_kuis: number;
    pertanyaan: string;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    opsi_e?: string;
    kunci_jawaban?: string;
    jawaban_essay?: string;
    no_soal: string;
    tipe_soal: string;
    bobot?: number;
}

export default function QuizPreview() {
    const { id_kuis } = useParams<{ id_kuis: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    const fetchQuizAndQuestions = async () => {
        // 💡 Pastikan id_kuis adalah integer jika kolom di DB Anda integer
        const quizIdNumber = id_kuis ? parseInt(id_kuis) : null;

        if (!quizIdNumber) {
            setLoading(false);
            return;
        }

        try {
            // Query menggunakan id_kuis yang sudah dikonversi ke number
            const { data: quizData } = await supabase
                .from("kuis")
                .select("*")
                .eq("id_kuis", quizIdNumber)
                .single();

            setQuiz(quizData as Quiz);

            // 💡 DEBUGGING: Log nilai yang akan digunakan untuk navigasi
            console.log("ID Kuis yang Di-fetch:", quizIdNumber);
            console.log("ID Mapel (id_activity) yang Ditemukan:", quizData?.id_activity);

            // ... (lanjutkan fetching questionData)
            const { data: questionData } = await supabase
                .from("soal_kuis")
                .select("*")
                .eq("id_kuis", quizIdNumber)
                .order("no_soal", { ascending: true });

            setQuestions((questionData || []) as Question[]);
        } catch (error) {
            // ...
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizAndQuestions();
    }, [id_kuis]);

    const openAddModal = () => {
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const openEditModal = (question: Question) => {
        setEditingQuestion(question);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingQuestion(null);
    };

    const handleSaveQuestion = async (questionData: any) => {
        try {
            if (editingQuestion) {
                await supabase
                    .from("soal_kuis")
                    .update(questionData)
                    .eq("id_soal", editingQuestion.id_soal);
            } else {
                await supabase
                    .from("soal_kuis")
                    .insert({
                        ...questionData,
                        id_kuis: id_kuis,
                    });
            }

            closeModal();
            await fetchQuizAndQuestions();
            alert("Soal berhasil disimpan!");
        } catch (error) {
            console.error("Error saving question:", error);
            alert("Gagal menyimpan soal");
        }
    };

    const deleteQuestion = async (id_soal: number) => {
        if (!window.confirm("Yakin ingin menghapus soal ini?")) return;

        try {
            await supabase.from("soal_kuis").delete().eq("id_soal", id_soal);
            setQuestions((prev) => prev.filter((q) => q.id_soal !== id_soal));
            alert("Soal berhasil dihapus!");
        } catch (error) {
            console.error("Error deleting question:", error);
            alert("Gagal menghapus soal");
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6">
                <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <PageMeta title="Preview Kuis" description="Preview soal dan atur kuis" />
            <PageBreadcrumb pageTitle="Preview Kuis" />

            {/* Tombol kembali yang DIPERBAIKI */}
            <button
                onClick={() => {
                    // 1. Cek secara eksplisit apakah nilai tersedia dan valid (lebih dari 0)
                    if (quiz?.id_activity && quiz.id_activity > 0) {
                        navigate(`/Pengajar/Mapel/${quiz.id_activity}`);
                    } else {
                        // 2. Jika nilai tidak valid, berikan notifikasi
                        console.error("Kesalahan Navigasi: id_activity tidak valid atau belum dimuat:", quiz?.id_activity);
                        alert("Gagal menemukan ID Mata Pelajaran. Cek koneksi atau data kuis.");
                    }
                }}
                className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700 hover:underline"
                // 3. Matikan tombol jika ID Mapel tidak ada
                disabled={!quiz?.id_activity || quiz.id_activity <= 0}
            >
                <ArrowLeft className="w-5 h-5" />
                Kembali
            </button>

            {/* Card Info Kuis */}
            {quiz && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {quiz.judul}
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Total Soal</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {questions.length}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Durasi</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {quiz.durasi || "-"} menit
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="font-medium text-gray-700 dark:text-gray-300">Total Bobot</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {questions.reduce((sum, q) => sum + (q.bobot || 0), 0)} poin
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header daftar soal */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Daftar Soal
                </h2>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/pengajar/quiz-result-preview/${id_kuis}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                    >
                        <Eye className="w-5 h-5" />
                        Lihat Hasil Kuis
                    </button>

                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Soal
                    </button>
                </div>
            </div>

            {/* LIST SOAL */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400">Belum ada soal</p>
                    </div>
                ) : (
                    questions.map((question) => (
                        <div
                            key={question.id_soal}
                            className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Soal {question.no_soal}: {question.pertanyaan}
                                    </h3>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Tipe:
                                        <span className="font-medium text-gray-800 dark:text-gray-200 ml-1">
                                            {question.tipe_soal}
                                        </span>
                                        {" • "}
                                        Bobot:
                                        <span className="font-medium text-gray-800 dark:text-gray-200 ml-1">
                                            {question.bobot || 10}
                                        </span>
                                    </p>

                                    {/* Pilihan ganda */}
                                    {question.tipe_soal === "pilihan_ganda" && (
                                        <div className="space-y-1 text-sm">
                                            {[
                                                { label: "A", value: question.opsi_a },
                                                { label: "B", value: question.opsi_b },
                                                { label: "C", value: question.opsi_c },
                                                { label: "D", value: question.opsi_d },
                                                { label: "E", value: question.opsi_e },
                                            ]
                                                .filter((opt) => opt.value && opt.value !== "-")
                                                .map((opt) => (
                                                    <p
                                                        key={opt.label}
                                                        className={`${opt.label === question.kunci_jawaban
                                                            ? "font-semibold text-green-600 dark:text-green-400"
                                                            : "text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {opt.label}. {opt.value}
                                                    </p>
                                                ))}
                                        </div>
                                    )}

                                    {/* Essay */}
                                    {question.tipe_soal === "essay" && (
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm">
                                            <p className="text-blue-700 dark:text-blue-300">
                                                ℹ️ Soal essay akan dikoreksi oleh guru.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* tombol */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openEditModal(question)}
                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => deleteQuestion(question.id_soal)}
                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <QuestionModal
                    question={editingQuestion}
                    onClose={closeModal}
                    onSave={handleSaveQuestion}
                />
            )}
        </div>
    );
}