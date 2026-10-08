import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseclient";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
// 1. Tambahkan FileText ke import icon
import { ChevronDown, Plus, FileText } from "lucide-react";
import SubmissionModal from "./activityModal";
import ActivityEditForm from "./ActivityEditForm";
import SubmissionList from "./SubmissionList";
import ActivityHeader from "./ActivityHeader";

export default function ActivityManagement() {
    const { id_mapel } = useParams();
    const mapelId = useMemo(() => (id_mapel ? parseInt(id_mapel) : null), [id_mapel]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
    const [mapelName, setMapelName] = useState<string | null>(null);

    // ... (Fungsi fetchActivities, toggleExpand, dll TETAP SAMA seperti kode awal Anda) ...
    const fetchActivities = async () => {
        if (!mapelId) return;
        setLoading(true);

        try {
            const { data: mapelData } = await supabase
                .from("mata_pelajaran")
                .select("nama_mapel")
                .eq("id_mapel", mapelId)
                .single();

            if (mapelData) {
                setMapelName(mapelData.nama_mapel);
            }

            const { data: activityData, error: activityError } = await supabase
                .from("activity")
                .select("*")
                .eq("id_mapel", mapelId)
                .order("id_activity", { ascending: true });

            if (activityError) {
                console.error("Gagal memuat aktivitas:", activityError);
                setLoading(false);
                return;
            }

            const results = await Promise.all(
                (activityData || []).map(async (act) => {
                    const [modul, tugas, kuis] = await Promise.all([
                        supabase.from("modul").select("*").eq("id_activity", act.id_activity),
                        supabase.from("tugas").select("*").eq("id_activity", act.id_activity),
                        supabase.from("kuis").select("*").eq("id_activity", act.id_activity),
                    ]);

                    return {
                        ...act,
                        modul: modul.data || [],
                        tugas: tugas.data || [],
                        kuis: kuis.data || [],
                    };
                })
            );

            setActivities(results);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [mapelId]);

    const toggleExpand = (id: number) => {
        setExpanded(expanded === id ? null : id);
    };

    const toggleEditMode = () => {
        setEditMode((prev) => !prev);
        if (editMode) fetchActivities();
    };

    const addActivity = () => {
        setActivities((prev) => [
            ...prev,
            {
                id_activity: Date.now(),
                judul: "Aktivitas Baru",
                deskripsi: "",
                id_mapel: mapelId,
                isNew: true,
            },
        ]);
    };

    const updateActivity = (id: number, updates: any) => {
        setActivities((prev) =>
            prev.map((a) => (a.id_activity === id ? { ...a, ...updates } : a))
        );
    };

    const saveChanges = async () => {
        setLoading(true);
        try {
            for (const act of activities) {
                const { modul, tugas, kuis, isNew, ...activityData } = act;

                if (isNew) {
                    delete activityData.id_activity;

                    if (!activityData.judul || !activityData.id_mapel) {
                        console.warn("Data aktivitas tidak lengkap:", activityData);
                        continue;
                    }

                    const { data, error } = await supabase
                        .from("activity")
                        .insert([{
                            judul: activityData.judul,
                            id_mapel: activityData.id_mapel
                        }])
                        .select();

                    if (error) throw error;
                    console.log("Aktivitas baru berhasil ditambahkan:", data);
                } else {
                    const { error } = await supabase
                        .from("activity")
                        .update({ judul: act.judul })
                        .eq("id_activity", act.id_activity);

                    if (error) throw error;
                }
            }
            alert("Perubahan berhasil disimpan!");
            setEditMode(false);
            await fetchActivities();
        } catch (error) {
            console.error("Gagal menyimpan perubahan:", error);
            const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui";
            alert("Terjadi kesalahan saat menyimpan: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteActivity = async (id_activity: number) => {
        const confirmDelete = window.confirm("Yakin ingin menghapus aktivitas ini?");
        if (!confirmDelete) return;
        setLoading(true);
        try {
            await supabase.from("modul").delete().eq("id_activity", id_activity);
            await supabase.from("tugas").delete().eq("id_activity", id_activity);
            await supabase.from("kuis").delete().eq("id_activity", id_activity);
            await supabase.from("activity").delete().eq("id_activity", id_activity);
            setActivities((prev) => prev.filter((a) => a.id_activity !== id_activity));
            alert("Aktivitas berhasil dihapus!");
        } catch (error) {
            console.error("Gagal menghapus aktivitas:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (activityId: number) => {
        setSelectedActivity(activityId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedActivity(null);
    };

    const handleModalSuccess = () => {
        closeModal();
        fetchActivities();
    };

    return (
        <div className="p-4 md:p-6">
            <PageMeta title="Kelola Aktivitas" description="Kelola aktivitas pembelajaran." />
            <PageBreadcrumb pageTitle="Kelola Aktivitas" />

            {/* ===== ACTIVITY HEADER ===== */}
            <ActivityHeader
                mapelName={mapelName}
                activities={activities}
                editMode={editMode}
                loading={loading}
                onToggleEditMode={toggleEditMode}
                onSave={saveChanges}
            />

            {/* ===== ACTION BAR (TOMBOL REKAP & TAMBAH) ===== */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mb-6 mt-4">

                {/* 2. Tombol Link ke Halaman Rekap Nilai */}
                <Link
                    to={`/pengajar/mapel/${mapelId}/rekap`} // Pastikan rute ini sesuai dengan router Anda
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium w-full sm:w-auto shadow-sm"
                >
                    <FileText className="w-5 h-5" />
                    Rekap Nilai Kelas
                </Link>

                {/* Tombol Tambah Aktivitas (Hanya Edit Mode) */}
                {editMode && (
                    <button
                        onClick={addActivity}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium w-full sm:w-auto shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Aktivitas
                    </button>
                )}
            </div>

            {/* ===== ACTIVITIES LIST ===== */}
            <div className="space-y-4">
                {loading && activities.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">Memuat aktivitas...</p>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada aktivitas.</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <ComponentCard key={activity.id_activity} title="">
                            <div className="space-y-0">
                                {editMode ? (
                                    <ActivityEditForm
                                        activity={activity}
                                        onUpdate={updateActivity}
                                        onDelete={deleteActivity}
                                    />
                                ) : (
                                    <>
                                        <div
                                            className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg"
                                            onClick={() => toggleExpand(activity.id_activity)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                    {activity.judul}
                                                </h2>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {activity.deskripsi}
                                                </p>
                                            </div>
                                            <ChevronDown
                                                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${expanded === activity.id_activity ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>

                                        {expanded === activity.id_activity && (
                                            <SubmissionList
                                                activity={activity}
                                                onAddSubmission={() => openModal(activity.id_activity)}
                                                onRefresh={fetchActivities}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </ComponentCard>
                    ))
                )}
            </div>

            {isModalOpen && selectedActivity && (
                <SubmissionModal
                    activityId={selectedActivity}
                    onClose={closeModal}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
}