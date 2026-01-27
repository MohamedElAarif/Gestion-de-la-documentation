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
} from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

interface LayoutProps {
    children: React.ReactNode;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}

interface SharedPageProps {
    [key: string]: unknown;
    notificationsOverview?: {
        unread_count: number;
    };
}

export default function Layout({ children }: LayoutProps) {
    const { url, props } = usePage<SharedPageProps>();
    const currentPath = url?.toLowerCase() ?? "";
    const unreadNotifications = Number(props?.notificationsOverview?.unread_count ?? 0);
    const notificationBadge = unreadNotifications > 99 ? "99+" : unreadNotifications;

        const navItems: NavItem[] = useMemo(
            () => [
                { id: "emprunts", label: "Emprunts", icon: BookOpen, href: "/Emprunts" },
                { id: "documents", label: "Documents", icon: FileText, href: "/Documents" },
                { id: "rayonnage", label: "Rayonnage", icon: Grid3x3, href: "#" },
                { id: "categorie", label: "Catégories", icon: FolderOpen, href: "#" },
                { id: "typeDocument", label: "Types", icon: FileType, href: "#" },
                { id: "membres", label: "Membres", icon: Users, href: "/Membres" },
                { id: "notification", label: "Notifications", icon: Bell, href: "/Notifications" },
            ],
            []
        );
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={logo} alt="AULSH Logo" className="h-16" />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Système de gestion de bibliothèque</h1>
                            <p className="text-sm text-gray-600">Tableau de bord du bibliothécaire</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex gap-1">
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
                                                className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                                                    isActive ? "text-gray-900 border-b-2" : "text-gray-600 hover:text-gray-900"
                                                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                                style={{ borderColor: "#147a40" }}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                    {item.id === "notification" && unreadNotifications > 0 && (
                                        <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                                            {notificationBadge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </header>

                {/* Main Content */}
                <main className="p-8">{children}</main>
            </div>
        </div>
    );
}