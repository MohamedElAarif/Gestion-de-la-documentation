import React from "react";
import { usePage } from "@inertiajs/react";
import { LayoutShell } from "./Layout";

interface SharedPageProps {
    [key: string]: unknown;
    auth?: {
        user?: {
            name?: string;
            email?: string;
        } | null;
    };
    notificationsOverview?: {
        unread_count: number;
    };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { url, props } = usePage<SharedPageProps>();

    const currentPath = (url ?? "").toLowerCase();
    const authUser = props?.auth?.user ?? null;
    const unreadNotifications = Number(props?.notificationsOverview?.unread_count ?? 0);

    return (
        <LayoutShell currentPath={currentPath} authUser={authUser} unreadNotifications={unreadNotifications}>
            {children}
        </LayoutShell>
    );
}
