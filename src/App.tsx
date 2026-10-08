import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseclient";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import Login from "./pages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import AdminLayout from "./layout/AdminLayout";
import PengajarLayout from "./layout/PengajarLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Admin/Home";
import KelolaSiswa from "./pages/Admin/Siswa/view";
import KelolaPengajar from "./pages/Admin/Pengajar/view";
import KelolaJurusan from "./pages/Admin/Jurusan/view";
import KelolaKelas from "./pages/Admin/Kelas/view";
import KelolaMapel from "./pages/Admin/Mapel/view";
import KelolaTahun from "./pages/Admin/Tahun/view";
import HomePengajar from "./pages/Pengajar/Home";
import Mapel from "./pages/Pengajar/mapel";
import AuthCallback from "./pages/AuthCallback";
import TaskPreview from "./pages/Pengajar/TaskPreview";
import QuizPreview from "./pages/Pengajar/QuizPreview";
import HalamanRekapNilai from "./pages/Pengajar/HalamanRekapNilai";
import QuizResultPreview from "./pages/Pengajar/QuizResultPreview";
import QuizResultDetail from "./pages/Pengajar/QuizWork";
import Perwalian from "./pages/Pengajar/perwalian";



export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil role user dari localStorage (bukan dari Supabase Auth)
  useEffect(() => {
    const checkSession = async () => {
      const storedRole = localStorage.getItem("user_role");
      const storedUsername = localStorage.getItem("username");

      // Kalau sudah login manual, lanjutkan
      if (storedRole && storedUsername) {
        setUserRole(storedRole);
        setLoading(false);
        return;
      }

      // Cek sesi dari Supabase Auth (Google SSO)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (user) {
        // Cek apakah dia admin di tabel
        const { data: admin } = await supabase
          .from("admin")
          .select("*")
          .eq("email", user.email)
          .single();

        if (admin) {
          localStorage.setItem("user_role", "admin");
          localStorage.setItem("username", admin.username);
          localStorage.setItem("id_user", admin.id_admin.toString());
          localStorage.setItem("nama", admin.nama);
          setUserRole("admin");
        } else {
          await supabase.auth.signOut();
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    };

    checkSession();
  }, []);


  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // 🔹 Tentukan layout berdasarkan tabel user
  const Layout =
    userRole === "pengajar"
      ? PengajarLayout
      : userRole === "admin"
        ? AdminLayout
        : AppLayout;

  // 🔹 Kalau belum login, redirect ke login page
  // if (!userRole) {
  //   window.location.href = "/";
  //   return null;
  // }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Halaman Login Default */}
        <Route path="/" element={<Login />} />
        {/* Layout dinamis berdasarkan role */}
        <Route element={<Layout />}>


          <Route path="/Admin/Home" element={<Home />} />
          <Route path="/Pengajar/Home" element={<HomePengajar />} />

          <Route path="/kelolaSiswa" element={<KelolaSiswa />} />
          <Route path="/kelolaPengajar" element={<KelolaPengajar />} />
          <Route path="/kelolaJurusan" element={<KelolaJurusan />} />
          <Route path="/kelolaKelas" element={<KelolaKelas />} />
          <Route path="/kelolaMapel" element={<KelolaMapel />} />
          <Route path="/kelolaTahun" element={<KelolaTahun />} />
          <Route
            path="/Pengajar/Mapel/:id_mapel"
            element={<Mapel />}
          />

          <Route path="/Pengajar/TaskPreview/:id_tugas" element={<TaskPreview />} />
          <Route path="/Pengajar/QuizPreview/:id_kuis" element={<QuizPreview />} />
          <Route path="/Pengajar/Mapel/:id_mapel/rekap" element={<HalamanRekapNilai />} />
          <Route path="/pengajar/quiz-result-preview/:id_kuis" element={<QuizResultPreview />} />
          <Route path="/pengajar/quiz-result-detail/:id_kuis/:id_siswa" element={<QuizResultDetail />} />
          <Route path="/pengajar/Perwalian" element={<Perwalian />} />


          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/form-elements" element={<FormElements />} />
          <Route path="/basic-tables" element={<BasicTables />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
