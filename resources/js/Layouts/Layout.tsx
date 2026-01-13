import { Children, useState } from "react";
import logo from "../assets/2369cb0083dbddb94f8822f18a0d3359cf9027d5.png";
import { 
  BookOpen, 
  FileText, 
  Grid3x3, 
  FolderOpen, 
  FileType, 
  Users, 
  Bell 
} from "lucide-react";
import { Link } from "@inertiajs/react";

type TabType = "emprunts" | "documents" | "rayonnage" | "categorie" | "typeDocument" | "membre" | "notification";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps){
    const [activeTab, setActiveTab] = useState<TabType>("emprunts");
    const navItems = [
        { id: "emprunts" as TabType, label: "Emprunts", icon: BookOpen },
        { id: "documents" as TabType, label: "Documents", icon: FileText },
        { id: "rayonnage" as TabType, label: "Rayonnage", icon: Grid3x3 },
        { id: "categorie" as TabType, label: "Categorie", icon: FolderOpen },
        { id: "typeDocument" as TabType, label: "Type Document", icon: FileType },
        { id: "membre" as TabType, label: "Membre", icon: Users },
        { id: "notification" as TabType, label: "Notification", icon: Bell },
    ];
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={logo} alt="AULSH Logo" className="h-16" />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Système de gestion de bibliothèque
                            </h1>
                            <p className="text-sm text-gray-600">
                                Tableau de bord du bibliothécaire
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    href={item.label}
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isActive
                                            ? "text-gray-900 border-b-2"
                                            : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    style={{borderColor:'#147a40'}}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </header>

                {/* Main Content */}
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}