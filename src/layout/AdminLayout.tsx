import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation, useNavigate } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AdminSidebar from "./AppSidebar"; // 🔹 sidebar khusus admin
import { useEffect } from "react";

const LayoutContent: React.FC = () => {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    return (
        <div className="min-h-screen xl:flex">
            <div>
                <AdminSidebar />
                <Backdrop />
            </div>
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
                    } ${isMobileOpen ? "ml-0" : ""}`}
            >
                <AppHeader />
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const AdminLayout: React.FC = () => {
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

        if (userRole !== "admin") {
            navigate("/not-found");
            return;
        }

    }, []);

    return (
        <SidebarProvider>
            <LayoutContent />
        </SidebarProvider>
    );
};

export default AdminLayout;
