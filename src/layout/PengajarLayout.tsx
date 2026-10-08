import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation, useNavigate } from "react-router";
import AppHeader2 from "./AppHeader2"; // Tetap ada
import Backdrop from "./Backdrop"; // Tetap ada
import { useEffect } from "react";
// import PengajarSidebar from "./PengajarSidebar"; // Dihapus

const LayoutContent: React.FC = () => {
    // Kita tetap memanggil useSidebar, meskipun state margin tidak lagi digunakan
    const { isMobileOpen } = useSidebar();

    return (
        // Tambahkan flex-col di div terluar untuk tata letak vertikal
        <div className="min-h-screen xl:flex flex-col">
            <div>
                {/* PengajarSidebar telah dihapus */}
                {/* <PengajarSidebar /> */}
                <Backdrop /> {/* Tetap ada */}
            </div>
            <div
                // 1. HAPUS SEMUA LOGIKA MARGIN KIRI (lg:ml-[...]) di sini.
                // 2. Tambahkan 'flex flex-col w-full' untuk tata letak konten yang benar.
                className={`flex-1 transition-all duration-300 ease-in-out ${isMobileOpen ? "ml-0" : ""} flex flex-col w-full`}
            >
                <AppHeader2 /> {/* Header kini akan dimulai dari tepi kiri */}

                {/* 3. Sesuaikan Div Konten Utama */}
                <div className="flex-1 p-4 w-full md:p-6">
                    {/* Hapus 'mx-auto' dan 'max-w-(--breakpoint-2xl)' untuk lebar penuh */}

                    {/* 4. Bungkus <Outlet /> dengan container Grid Responsif untuk Kartu */}
                    <div className="flex-1 p-4 w-full md:p-6">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PengajarLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const segments = location.pathname.split('/');

    const segment = segments[1]?.toLowerCase();

    useEffect(() => {
        const userRole = localStorage.getItem("user_role");

        if (userRole === null) {
            navigate("/");
            return;
        }

        if (segment !== userRole) {
            navigate("/not-found");
            return;
        }
    }, []);
    // SidebarProvider tetap harus ada
    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
};

export default PengajarLayout;