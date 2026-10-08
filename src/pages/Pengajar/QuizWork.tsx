import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import { ArrowLeft, CheckCircle2, XCircle, Save, Calculator, FileText, User } from "lucide-react";

type Question = {
    id_soal: number;
    id_kuis: number;
    no_soal: number;
    pertanyaan: string;
    tipe_soal: "pilihan_ganda" | "essay";  // ← DIPERBAIKI
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    opsi_e?: string;
    kunci_jawaban: string;
    jawaban_essay?: string;
    bobot: number;
};

type Answer = {
    id_jawaban: number;
    id_soal: number;
    id_siswa: number;
    id_kuis: number;
    jawaban: string;
    benar: boolean | null;
    nilai_soal: number;
};

type StudentInfo = {
    id_siswa: number;
    nama: string;
    nis: string;
};

export default function QuizReview() {
    const { id_kuis, id_siswa } = useParams();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [essayScores, setEssayScores] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        if (id_kuis && id_siswa) {
            loadData();
        }
    }, [id_kuis, id_siswa]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Ambil info siswa
            const { data: siswaData, error: siswaError } = await supabase
                .from("siswa")
                .select("id_siswa, nama, nis")
                .eq("id_siswa", id_siswa)
                .single();

            if (siswaError) throw siswaError;
            setStudent(siswaData);

            // 2. Ambil soal kuis
            const { data: soalData, error: soalError } = await supabase
                .from("soal_kuis")
                .select("*")
                .eq("id_kuis", id_kuis)
                .order("no_soal", { ascending: true });

            if (soalError) throw soalError;
            setQuestions(soalData || []);

            // 3. Ambil jawaban siswa
            const { data: jawabanData, error: jawabanError } = await supabase
                .from("jawaban_kuis")
                .select("*")
                .eq("id_kuis", id_kuis)
                .eq("id_siswa", id_siswa);

            if (jawabanError) throw jawabanError;
            setAnswers(jawabanData || []);

            // 4. Load nilai essay yang sudah ada
            const initialScores: { [key: number]: number } = {};
            jawabanData?.forEach((ans) => {
                const q = soalData?.find((s) => s.id_soal === ans.id_soal);
                if (q?.tipe_soal === "essay") {
                    initialScores[ans.id_soal] = ans.nilai_soal || 0;
                }
            });
            setEssayScores(initialScores);

        } catch (error) {
            console.error("❌ Error loading data:", error);
            alert("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    // Update nilai essay langsung ke database
    const handleEssayScoreChange = async (idSoal: number, nilai: number) => {
        setEssayScores((prev) => ({ ...prev, [idSoal]: nilai }));

        const ans = answers.find((a) => a.id_soal === idSoal);
        if (!ans) return;

        try {
            const { error } = await supabase
                .from("jawaban_kuis")
                .update({ nilai_soal: nilai })
                .eq("id_jawaban", ans.id_jawaban);

            if (error) throw error;
            console.log(`✅ Nilai essay updated: Soal ${idSoal} = ${nilai}`);
        } catch (error) {
            console.error("❌ Error updating essay score:", error);
            alert("Gagal menyimpan nilai. Silakan coba lagi.");
        }
    };

    const calculateTotalScore = () => {
        let total = 0;
        let benarCount = 0;
        let salahCount = 0;

        questions.forEach((q) => {
            const ans = answers.find((a) => a.id_soal === q.id_soal);
            if (!ans) return;

            if (q.tipe_soal === "pilihan_ganda") {  // ← DIPERBAIKI
                if (ans.benar) {
                    total += q.bobot;
                    benarCount++;
                } else {
                    salahCount++;
                }
            } else {
                const score = essayScores[q.id_soal] || ans.nilai_soal || 0;
                total += score;
            }
        });

        return { total, benarCount, salahCount, totalSoal: questions.length };
    };

    const saveAllScores = async () => {
        if (!id_kuis || !id_siswa) return;
        setSaving(true);

        try {
            const { total, benarCount, salahCount, totalSoal } = calculateTotalScore();

            // Cek apakah sudah ada record hasil kuis
            const { data: existing, error: checkError } = await supabase
                .from("hasil_kuis")
                .select("*")
                .eq("id_kuis", id_kuis)
                .eq("id_siswa", id_siswa)
                .maybeSingle();

            if (checkError) throw checkError;

            let hasilError;

            if (existing) {
                // UPDATE
                const { error } = await supabase
                    .from("hasil_kuis")
                    .update({
                        total_nilai: total,
                        benar: benarCount,
                        salah: salahCount,
                        total_soal: totalSoal
                    })
                    .eq("id_kuis", id_kuis)
                    .eq("id_siswa", id_siswa);

                hasilError = error;
            } else {
                // INSERT
                const { error } = await supabase
                    .from("hasil_kuis")
                    .insert({
                        id_kuis: parseInt(id_kuis),
                        id_siswa: parseInt(id_siswa),
                        total_nilai: total,
                        benar: benarCount,
                        salah: salahCount,
                        total_soal: totalSoal
                    });

                hasilError = error;
            }

            if (hasilError) throw hasilError;

            alert("✅ Nilai berhasil disimpan!");
            await loadData();
        } catch (error) {
            console.error("❌ Error saving scores:", error);
            alert("❌ Gagal menyimpan nilai. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    };


    const { total, benarCount, salahCount, totalSoal } = calculateTotalScore();

    if (loading) {
        return (
            <div className="p-4 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="mb-6">
                <Link
                    to={`/pengajar/quiz-result-preview/${id_kuis}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-3 transition font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {student?.nama}
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                            NIS: {student?.nis} • Review Jawaban Kuis
                        </p>
                    </div>

                    <button
                        onClick={saveAllScores}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Menyimpan..." : "Simpan Semua Nilai"}
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Nilai</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Benar</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{benarCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Salah</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{salahCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Soal</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSoal}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                {questions.length === 0 && (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada soal untuk kuis ini.
                    </div>
                )}

                {questions.map((q, i) => {
                    const ans = answers.find((a) => a.id_soal === q.id_soal);
                    const isCorrect = ans?.benar;

                    return (
                        <div
                            key={q.id_soal}
                            className={`p-5 rounded-xl border-2 bg-white dark:bg-gray-800 transition-all ${q.tipe_soal === "pilihan_ganda"  // ← DIPERBAIKI
                                ? isCorrect
                                    ? "border-green-200 dark:border-green-800"
                                    : "border-red-200 dark:border-red-800"
                                : "border-gray-200 dark:border-gray-700"
                                }`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Soal #{q.no_soal || i + 1}
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${q.tipe_soal === "pilihan_ganda"  // ← DIPERBAIKI
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                                }`}
                                        >
                                            {q.tipe_soal === "pilihan_ganda" ? "Pilihan Ganda" : "Essay"}  {/* ← DIPERBAIKI */}
                                        </span>
                                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
                                            Bobot: {q.bobot}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                        {q.pertanyaan}
                                    </h3>
                                </div>

                                {q.tipe_soal === "pilihan_ganda" && ans && (  // ← DIPERBAIKI
                                    <div className="ml-4">
                                        {isCorrect ? (
                                            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-xs font-medium">Benar</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                                                <XCircle className="w-4 h-4" />
                                                <span className="text-xs font-medium">Salah</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pilihan Ganda */}
                            {q.tipe_soal === "pilihan_ganda" && (  // ← DIPERBAIKI
                                <div className="space-y-3">
                                    {["A", "B", "C", "D", "E"].map((opt) => {
                                        const optKey = `opsi_${opt.toLowerCase()}` as keyof Question;
                                        const optValue = q[optKey] as string;

                                        if (!optValue || optValue.trim() === "") return null;

                                        const isStudentAnswer = ans?.jawaban?.toUpperCase().trim() === opt;
                                        const isCorrectAnswer = q.kunci_jawaban?.toUpperCase().trim() === opt;

                                        return (
                                            <div
                                                key={opt}
                                                className={`p-3 rounded-lg border-2 transition-all ${isCorrectAnswer
                                                    ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                                                    : isStudentAnswer
                                                        ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                                                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCorrectAnswer
                                                            ? "bg-green-500 text-white"
                                                            : isStudentAnswer
                                                                ? "bg-red-500 text-white"
                                                                : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {opt}
                                                    </div>
                                                    <span className="text-sm text-gray-900 dark:text-white flex-1">
                                                        {optValue}
                                                    </span>
                                                    {isCorrectAnswer && (
                                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                                            ✓ Kunci Jawaban
                                                        </span>
                                                    )}
                                                    {isStudentAnswer && !isCorrectAnswer && (
                                                        <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                                            ✗ Jawaban Siswa
                                                        </span>
                                                    )}
                                                    {isStudentAnswer && isCorrectAnswer && (
                                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                                            ✓ Jawaban Siswa (Benar)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {!ans && (
                                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                ⚠️ Siswa tidak menjawab soal ini
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Nilai:{" "}
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {isCorrect ? q.bobot : 0} / {q.bobot}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Essay */}
                            {q.tipe_soal === "essay" && (
                                <div className="space-y-4">
                                    {q.jawaban_essay && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                                Kunci Jawaban / Pedoman:
                                            </label>
                                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                    {q.jawaban_essay}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Jawaban Siswa:
                                        </label>
                                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 min-h-[100px]">
                                            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                {ans?.jawaban || "(Tidak dijawab)"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Nilai (Max: {q.bobot}):
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={q.bobot}
                                            value={essayScores[q.id_soal] ?? ans?.nilai_soal ?? 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                if (val >= 0 && val <= q.bobot) {
                                                    handleEssayScoreChange(q.id_soal, val);
                                                }
                                            }}
                                            className="w-24 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            / {q.bobot}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Action */}
            {questions.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={saveAllScores}
                        disabled={saving}
                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {saving ? "Menyimpan..." : "Simpan Nilai ke Hasil Kuis"}
                    </button>
                </div>
            )}
        </div>
    );
}