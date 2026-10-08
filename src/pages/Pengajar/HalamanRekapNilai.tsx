import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import { ArrowLeft, FileSpreadsheet, Search, Save, AlertCircle } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";

// Tipe data untuk struktur tabel
type Student = {
    id_siswa: number;
    nama_siswa: string;
    nisn?: string;
    total_score: number;
    average_score: string;
    uts_score?: number;
    uas_score?: number;
};

type AssessmentItem = {
    id: string;
    originalId: number;
    title: string;
    type: "tugas" | "kuis";
    activityTitle: string;
    maxScore: number;
};

type ScoreMap = {
    [studentId: number]: {
        [assessmentId: string]: number;
    };
};

type ExamScores = {
    [studentId: number]: {
        uts?: number;
        uas?: number;
    };
};

export default function HalamanRekapNilai() {
    const { id_mapel } = useParams();
    const mapelId = useMemo(() => (id_mapel ? parseInt(id_mapel) : null), [id_mapel]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mapelName, setMapelName] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
    const [scores, setScores] = useState<ScoreMap>({});
    const [examScores, setExamScores] = useState<ExamScores>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [className, setClassName] = useState("Memuat Kelas...");

    // Fetch Data Utama
    useEffect(() => {
        if (!mapelId) return;

        // Load exam scores FIRST, sebelum fetch data
        const loadedExamScores = loadExamScoresFromStorage();

        // Pass exam scores ke fetchRekapData
        fetchRekapData(loadedExamScores);
    }, [mapelId]);

    // Load UTS/UAS dari localStorage
    const loadExamScoresFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(`exam_scores_mapel_${mapelId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                setExamScores(parsed);
                console.log("✅ Loaded exam scores from localStorage:", parsed);
                return parsed;
            }
            return {};
        } catch (error) {
            console.error("Error loading exam scores:", error);
            return {};
        }
    }, [mapelId]);

    // Save UTS/UAS ke localStorage
    const saveExamScoresToStorage = (newScores: ExamScores) => {
        try {
            localStorage.setItem(`exam_scores_mapel_${mapelId}`, JSON.stringify(newScores));
            console.log("💾 Saved exam scores to localStorage:", newScores);
        } catch (error) {
            console.error("Error saving exam scores:", error);
        }
    };

    // Recalculate students dengan UTS/UAS
    const recalculateStudents = useCallback((
        baseStudents: Omit<Student, 'total_score' | 'average_score' | 'uts_score' | 'uas_score'>[],
        assessmentList: AssessmentItem[],
        scoreMapping: ScoreMap,
        examScoreMapping: ExamScores
    ) => {
        console.log("🔄 Recalculating with:", {
            studentsCount: baseStudents.length,
            assessmentsCount: assessmentList.length,
            examScores: examScoreMapping
        });

        const studentsWithFinalScores: Student[] = baseStudents.map(student => {
            let totalScore = 0;
            let itemCount = 0;

            // Hitung nilai tugas & kuis
            assessmentList.forEach(ass => {
                const score = scoreMapping[student.id_siswa]?.[ass.id];
                if (typeof score === 'number') {
                    totalScore += score;
                    itemCount++;
                }
            });

            // Tambahkan UTS
            const utsScore = examScoreMapping[student.id_siswa]?.uts;
            if (typeof utsScore === 'number') {
                totalScore += utsScore;
                itemCount++;
            }

            // Tambahkan UAS
            const uasScore = examScoreMapping[student.id_siswa]?.uas;
            if (typeof uasScore === 'number') {
                totalScore += uasScore;
                itemCount++;
            }

            // Kalkulasi rata-rata
            const average = itemCount > 0 ? (totalScore / itemCount).toFixed(1) : "0.0";

            console.log(`Student ${student.nama_siswa}: total=${totalScore}, items=${itemCount}, avg=${average}, uts=${utsScore}, uas=${uasScore}`);

            return {
                ...student,
                total_score: totalScore,
                average_score: average,
                uts_score: utsScore,
                uas_score: uasScore,
            };
        });

        setStudents(studentsWithFinalScores);
    }, []);

    const fetchRekapData = useCallback(async (loadedExamScores: ExamScores = {}) => {
        if (!mapelId) return;
        setLoading(true);

        let baseStudents: Omit<Student, 'total_score' | 'average_score' | 'uts_score' | 'uas_score'>[] = [];
        let assessmentList: AssessmentItem[] = [];
        let scoreMapping: ScoreMap = {};

        try {
            // 1. AMBIL INFO MAPEL & ID KELAS
            const { data: mapelData, error: mapelError } = await supabase
                .from("mata_pelajaran")
                .select(`
                    nama_mapel, 
                    id_kelas,
                    kelas (nama_kelas)
                `)
                .eq("id_mapel", mapelId)
                .single();

            if (mapelError) throw { msg: "Gagal ambil mapel", err: mapelError };
            if (!mapelData) throw { msg: "Mapel tidak ditemukan" };

            setMapelName(mapelData.nama_mapel);
            if (mapelData.kelas && Array.isArray(mapelData.kelas) && mapelData.kelas[0]?.nama_kelas) {
                setClassName(mapelData.kelas[0].nama_kelas);
            } else {
                setClassName("Kelas Tidak Ditemukan");
            }

            // 2. AMBIL SISWA BERDASARKAN ID KELAS
            const { data: siswaData, error: siswaError } = await supabase
                .from("siswa")
                .select("id_siswa, nama, nis")
                .eq("id_kelas", mapelData.id_kelas)
                .order('nama', { ascending: true });

            if (siswaError) throw { msg: "Gagal ambil siswa", err: siswaError };

            baseStudents = (siswaData || []).map((s: any) => ({
                id_siswa: s.id_siswa,
                nama_siswa: s.nama,
                nisn: s.nis
            }));

            // 3. AMBIL ACTIVITY + TUGAS + KUIS
            const { data: activities, error: actError } = await supabase
                .from("activity")
                .select(`
                    id_activity,
                    judul,
                    tugas (id_tugas, judul),
                    kuis (id_kuis, judul)
                `)
                .eq("id_mapel", mapelId)
                .order("id_activity", { ascending: true });

            if (actError) throw { msg: "Gagal ambil aktivitas", err: actError };

            // Susun Header Kolom
            activities?.forEach((act) => {
                // @ts-ignore
                act.tugas?.forEach((t: any) => {
                    assessmentList.push({
                        id: `tugas-${t.id_tugas}`,
                        originalId: t.id_tugas,
                        title: t.judul,
                        type: "tugas",
                        activityTitle: act.judul,
                        maxScore: 100
                    });
                });
                // @ts-ignore
                act.kuis?.forEach((k: any) => {
                    assessmentList.push({
                        id: `kuis-${k.id_kuis}`,
                        originalId: k.id_kuis,
                        title: k.judul,
                        type: "kuis",
                        activityTitle: act.judul,
                        maxScore: 100
                    });
                });
            });
            setAssessments(assessmentList);

            // 4. AMBIL NILAI (Tugas & Kuis)
            const tugasIds = assessmentList.filter(a => a.type === 'tugas').map(a => a.originalId);
            const kuisIds = assessmentList.filter(a => a.type === 'kuis').map(a => a.originalId);

            // 4a. Fetch Nilai Tugas
            if (tugasIds.length > 0) {
                const { data: nilaiTugas } = await supabase
                    .from("pengumpulan_tugas")
                    .select("id_tugas, id_siswa, nilai")
                    .in("id_tugas", tugasIds)
                    .not("nilai", "is", null);

                nilaiTugas?.forEach((item: any) => {
                    if (!scoreMapping[item.id_siswa]) scoreMapping[item.id_siswa] = {};
                    scoreMapping[item.id_siswa][`tugas-${item.id_tugas}`] = item.nilai;
                });
            }

            // 4b. Fetch Nilai Kuis
            if (kuisIds.length > 0) {
                const { data: nilaiKuis } = await supabase
                    .from("hasil_kuis")
                    .select("id_kuis, id_siswa, total_nilai")
                    .in("id_kuis", kuisIds)
                    .not("total_nilai", "is", null);

                nilaiKuis?.forEach((item: any) => {
                    if (!scoreMapping[item.id_siswa]) scoreMapping[item.id_siswa] = {};
                    scoreMapping[item.id_siswa][`kuis-${item.id_kuis}`] = item.total_nilai;
                });
            }

            setScores(scoreMapping);

            // 5. KALKULASI dengan UTS/UAS dari localStorage
            console.log("📊 Recalculating with exam scores:", loadedExamScores);
            recalculateStudents(baseStudents, assessmentList, scoreMapping, loadedExamScores);

        } catch (err: any) {
            console.error("ERROR LOAD REKAP:", JSON.stringify(err, null, 2));
            if (err.msg) {
                console.error(`Error: ${err.msg}`);
            } else {
                console.error("Terjadi kesalahan sistem saat memuat data.");
            }
        } finally {
            setLoading(false);
        }
    }, [mapelId, recalculateStudents]);

    // Handle perubahan nilai UTS/UAS
    const handleExamScoreChange = (studentId: number, examType: 'uts' | 'uas', value: string) => {
        const numValue = value === '' ? undefined : parseFloat(value);

        // Validasi nilai 0-100
        if (numValue !== undefined && (numValue < 0 || numValue > 100)) {
            return;
        }

        console.log(`📝 Exam score changed: Student ${studentId}, ${examType}=${numValue}`);

        const newExamScores = {
            ...examScores,
            [studentId]: {
                ...examScores[studentId],
                [examType]: numValue,
            },
        };

        setExamScores(newExamScores);
        saveExamScoresToStorage(newExamScores);

        // Recalculate immediately dengan data terbaru
        const baseStudents = students.map(s => ({
            id_siswa: s.id_siswa,
            nama_siswa: s.nama_siswa,
            nisn: s.nisn,
        }));

        recalculateStudents(baseStudents, assessments, scores, newExamScores);
    };

    // Simpan nilai akhir ke database
    const handleSaveFinalScores = async () => {
        if (!mapelId) return;
        setSaving(true);

        try {
            const finalScoresData = students.map(s => ({
                id_siswa: s.id_siswa,
                id_mapel: mapelId,
                nilai_akhir: parseFloat(s.average_score),
                total_poin: s.total_score,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from("nilai_akhir")
                .upsert(finalScoresData, {
                    onConflict: 'id_siswa,id_mapel',
                    ignoreDuplicates: false
                });

            if (error) throw error;

            alert("✅ Nilai akhir berhasil disimpan ke database!");
        } catch (error) {
            console.error("❌ Error saving:", error);
            alert("❌ Gagal menyimpan nilai akhir. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    };

    // Export ke CSV
    const handleExportCSV = () => {
        const header = [
            "Nama Siswa",
            "NIS",
            ...assessments.map(a => `[${a.type === 'tugas' ? 'T' : 'K'}] ${a.title}`),
            "UTS",
            "UAS",
            "Total Poin",
            "Rata-rata Akhir"
        ];

        const rows = students.map(s => {
            const rowData = [
                `"${s.nama_siswa}"`,
                `"${s.nisn || '-'}"`,
                ...assessments.map(a => scores[s.id_siswa]?.[a.id] ?? 0),
                s.uts_score ?? 0,
                s.uas_score ?? 0,
                s.total_score,
                s.average_score
            ];
            return rowData.join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + header.join(",") + "\n"
            + rows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Nilai_${mapelName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Siswa
    const filteredStudents = students.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nisn && s.nisn.includes(searchTerm))
    );

    return (
        <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            <PageMeta title={`Rekap Nilai - ${mapelName} (${className})`} description="Halaman rekapitulasi nilai siswa" />

            {/* Header Area dengan Breadcrumb dan Tombol Kembali */}
            <div className="mb-6">
                <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex justify-end items-center">
                    <Link to="/" className="hover:text-blue-600">Home</Link>
                    <span className="mx-1">/</span>
                    <Link to={`/Pengajar/Mapel/${mapelId}`} className="hover:text-blue-600">{mapelName}</Link>
                    <span className="mx-1">/</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Rekap Nilai</span>
                </nav>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link
                            to={`/Pengajar/Mapel/${mapelId}`}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2 transition font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
                        </Link>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rekapitulasi Nilai Kelas {className}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{mapelName}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveFinalScores}
                            disabled={saving || loading || students.length === 0}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Menyimpan..." : "Simpan Nilai Akhir"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={loading || students.length === 0}
                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export Excel (CSV)
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Info:</strong> Input nilai UTS dan UAS akan otomatis dihitung dalam rata-rata akhir.
                    Klik <strong>"Simpan Nilai Akhir"</strong> untuk menyimpan ke database.
                </div>
            </div>

            {/* Filter Search */}
            <div className="mb-4 max-w-md relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Cari nama siswa atau NIS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Main Table Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Memuat data nilai...
                    </div>
                ) : students.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        Belum ada siswa terdaftar di mata pelajaran ini.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th scope="col" className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900 px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-200 dark:border-gray-700 min-w-[200px]">
                                        Identitas Siswa
                                    </th>

                                    {assessments.map((ass) => (
                                        <th key={ass.id} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] w-fit mx-auto ${ass.type === 'tugas' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    }`}>
                                                    {ass.type === 'tugas' ? 'TUGAS' : 'KUIS'}
                                                </span>
                                                <span className="line-clamp-2" title={ass.title}>{ass.title}</span>
                                            </div>
                                        </th>
                                    ))}

                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-orange-500 min-w-[100px]">
                                        UTS
                                    </th>

                                    <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-red-500 min-w-[100px]">
                                        UAS
                                    </th>

                                    <th scope="col" className="sticky right-[100px] z-20 px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 min-w-[100px]">
                                        Total Poin
                                    </th>

                                    <th scope="col" className="sticky right-0 z-20 px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 bg-blue-600 min-w-[100px]">
                                        Rata-rata Akhir
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id_siswa} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {student.nama_siswa}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {student.nisn || "No NIS"}
                                            </div>
                                        </td>

                                        {assessments.map((ass) => {
                                            const score = scores[student.id_siswa]?.[ass.id];
                                            const hasScore = typeof score === 'number';

                                            return (
                                                <td key={ass.id} className="px-4 py-4 whitespace-nowrap text-center text-sm border-gray-100 dark:border-gray-800">
                                                    {hasScore ? (
                                                        <span className={`font-medium ${score < 60 ? 'text-red-600 dark:text-red-400' :
                                                            score < 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                                                            }`}>
                                                            {score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        <td className="px-2 py-4 whitespace-nowrap text-center bg-orange-50 dark:bg-orange-900/20">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={student.uts_score ?? ''}
                                                onChange={(e) => handleExamScoreChange(student.id_siswa, 'uts', e.target.value)}
                                                placeholder="-"
                                                className="w-16 px-2 py-1 text-center border border-orange-300 dark:border-orange-700 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium bg-white dark:bg-gray-800 dark:text-white"
                                            />
                                        </td>

                                        <td className="px-2 py-4 whitespace-nowrap text-center bg-red-50 dark:bg-red-900/20">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={student.uas_score ?? ''}
                                                onChange={(e) => handleExamScoreChange(student.id_siswa, 'uas', e.target.value)}
                                                placeholder="-"
                                                className="w-16 px-2 py-1 text-center border border-red-300 dark:border-red-700 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium bg-white dark:bg-gray-800 dark:text-white"
                                            />
                                        </td>

                                        <td className="sticky right-[100px] z-10 px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 border-l border-gray-200 dark:border-gray-700">
                                            {student.total_score}
                                        </td>

                                        <td className="sticky right-0 z-10 px-3 py-4 whitespace-nowrap text-center text-base font-extrabold text-white bg-blue-700/90">
                                            {student.average_score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                Menampilkan {filteredStudents.length} dari {students.length} siswa.
                Nilai UTS/UAS tersimpan otomatis di browser. Geser tabel untuk melihat semua kolom.
            </div>
        </div>
    );
}