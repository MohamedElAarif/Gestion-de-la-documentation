import { useMemo } from "react";
import logo from "../assets/2369cb0083dbddb94f8822f18a0d3359cf9027d5.png";
import {
    BookOpen,
    FileText,
    Grid3x3,
    FolderOpen,
    FileType,
    Users,
    Bell,
    Settings,
} from "lucide-react";
import { Link, router } from "@inertiajs/react";

interface LayoutProps {
    children: React.ReactNode;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}

interface LayoutShellProps {
    children: React.ReactNode;
    currentPath?: string;
    authUser?: {
        name?: string;
        email?: string;
    } | null;
    unreadNotifications?: number;
}

export default function Layout({ children }: LayoutProps) {
    // IMPORTANT: Layout must not call usePage(). Some pages already wrap themselves
    // and we also assign layouts dynamically. The Inertia-aware wrapper below handles props.
    return <LayoutShell>{children}</LayoutShell>;
}

export function LayoutShell({
    children,
    currentPath = "",
    authUser = null,
    unreadNotifications = 0,
}: LayoutShellProps) {
    const notificationBadge = unreadNotifications > 99 ? "99+" : unreadNotifications;

    const logout = () => {
        router.post("/logout");
    };

    const navItems: NavItem[] = useMemo(
        () => [
            { id: "emprunts", label: "Emprunts", icon: BookOpen, href: "/Emprunts" },
            { id: "documents", label: "Documents", icon: FileText, href: "/Documents" },
            { id: "rayonnage", label: "Rayonnages", icon: Grid3x3, href: "Rayonnages" },
            { id: "categorie", label: "Catégories", icon: FolderOpen, href: "Categories" },
            { id: "typeDocument", label: "Types", icon: FileType, href: "Type Documents" },
            { id: "membres", label: "Membres", icon: Users, href: "/Membres" },
            { id: "notification", label: "Notifications", icon: Bell, href: "/Notifications" },
            { id: "settings", label: "Paramètres", icon: Settings, href: "/Settings" },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between gap-6 px-8 py-4">
                    <div className="flex items-start gap-4">
                        <img src={logo} alt="AULSH Logo" className="h-12 w-auto" />
                        <div className="leading-tight">
                            <div className="text-lg font-semibold text-gray-900">Système de gestion de bibliothèque</div>
                            <div className="text-sm text-gray-600">Tableau de bord du bibliothécaire</div>
                        </div>
                    </div>

                    {authUser ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-700">Admin</span>
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Logout
                            </button>
                        </div>
                    ) : null}
                </div>

                {authUser ? (
                    <nav className="flex gap-6 px-8 pb-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const normalizedHref = item.href.toLowerCase();
                            const disabled = item.href === "#";
                            const isActive = !disabled && currentPath.startsWith(normalizedHref);

                            return (
                                <Link
                                    href={item.href}
                                    key={item.id}
                                    onClick={(event) => {
                                        if (disabled) {
                                            event.preventDefault();
                                        }
                                    }}
                                    aria-disabled={disabled}
                                    className={`flex items-center gap-2 px-1 py-2 text-sm transition-colors ${isActive ? "text-gray-900 border-b-2" : "text-gray-600 hover:text-gray-900"
                                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                    style={isActive ? { borderColor: "#147a40" } : undefined}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                    {item.id === "notification" && unreadNotifications > 0 && (
                                        <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                                            {notificationBadge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                ) : null}
            </header>

            <main className="p-8">{children}</main>
        </div>
    );
}