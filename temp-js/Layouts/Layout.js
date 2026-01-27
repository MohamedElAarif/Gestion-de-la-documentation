import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import logo from "../assets/2369cb0083dbddb94f8822f18a0d3359cf9027d5.png";
import { BookOpen, FileText, Grid3x3, FolderOpen, FileType, Users, Bell, } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
export default function Layout({ children }) {
    const { url } = usePage();
    const currentPath = url?.toLowerCase() ?? "";
    const navItems = useMemo(() => [
        { id: "emprunts", label: "Emprunts", icon: BookOpen, href: "/Emprunts" },
        { id: "documents", label: "Documents", icon: FileText, href: "/Documents" },
        { id: "rayonnage", label: "Rayonnage", icon: Grid3x3, href: "#" },
        { id: "categorie", label: "Catégories", icon: FolderOpen, href: "#" },
        { id: "typeDocument", label: "Types", icon: FileType, href: "#" },
        { id: "membres", label: "Membres", icon: Users, href: "/Membres" },
        { id: "notification", label: "Notifications", icon: Bell, href: "#" },
    ], []);
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "min-h-screen bg-gray-100", children: [_jsxs("header", { className: "bg-white border-b border-gray-200 px-8 py-4", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("img", { src: logo, alt: "AULSH Logo", className: "h-16" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Syst\u00E8me de gestion de biblioth\u00E8que" }), _jsx("p", { className: "text-sm text-gray-600", children: "Tableau de bord du biblioth\u00E9caire" })] })] }), _jsx("nav", { className: "flex gap-1", children: navItems.map((item) => {
                                const Icon = item.icon;
                                const normalizedHref = item.href.toLowerCase();
                                const disabled = item.href === "#";
                                const isActive = !disabled && currentPath.startsWith(normalizedHref);
                                return (_jsxs(Link, { href: item.href, onClick: (event) => {
                                        if (disabled) {
                                            event.preventDefault();
                                        }
                                    }, "aria-disabled": disabled, className: `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive ? "text-gray-900 border-b-2" : "text-gray-600 hover:text-gray-900"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`, style: { borderColor: "#147a40" }, children: [_jsx(Icon, { className: "w-4 h-4" }), item.label] }, item.id));
                            }) })] }), _jsx("main", { className: "p-8", children: children })] }) }));
}
