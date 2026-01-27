import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import Layout from "../Layouts/Layout";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Search, Trash2, Check, RefreshCw, MailCheck, Loader2, Info } from "lucide-react";

function getCsrfToken() {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el?.content ?? "";
}

async function fetchJson(url, method = "GET", body) {
    const headers = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    const options = {
        method,
        headers,
        credentials: "same-origin",
    };

    if (method !== "GET") {
        headers["Content-Type"] = "application/json";
        headers["X-CSRF-TOKEN"] = getCsrfToken();
        options.body = body !== undefined ? JSON.stringify(body) : undefined;
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return undefined;
    }

    return (await response.json());
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export default function NotificationList() {
    const { props } = usePage();
    const initialNotifications = useMemo(() => (Array.isArray(props.notifications) ? props.notifications : []), [props.notifications]);
    const [notifications, setNotifications] = useState(initialNotifications);
    const [loading, setLoading] = useState(initialNotifications.length === 0);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setNotifications(initialNotifications);
        if (initialNotifications.length > 0) {
            setLoading(false);
        }
    }, [initialNotifications]);

    useEffect(() => {
        if (initialNotifications.length === 0) {
            void reload();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reload = async () => {
        setLoading(true);
        try {
            const data = await fetchJson("/Notifications/data");
            setNotifications(Array.isArray(data) ? data : []);
        }
        catch (error) {
            console.error("Impossible de recharger les notifications", error);
        }
        finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await fetchJson(`/Notifications/${id}/mark-read`, "PATCH");
            await reload();
        }
        catch (error) {
            console.error("Impossible de marquer la notification comme lue", error);
            alert("Impossible de marquer cette notification comme lue.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Supprimer cette notification ?")) {
            return;
        }

        try {
            await fetchJson(`/Notifications/${id}`, "DELETE");
            await reload();
        }
        catch (error) {
            console.error("Impossible de supprimer la notification", error);
            alert("Impossible de supprimer cette notification.");
        }
    };

    const handleMarkAllRead = async () => {
        if (!notifications.some((notif) => !notif.est_lu)) {
            return;
        }

        setIsMarkingAll(true);
        try {
            await fetchJson("/Notifications/mark-all-read", "PATCH");
            await reload();
        }
        catch (error) {
            console.error("Impossible de marquer toutes les notifications comme lues", error);
            alert("Impossible d'exécuter cette action. Réessayez plus tard.");
        }
        finally {
            setIsMarkingAll(false);
        }
    };

    const filteredNotifications = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return notifications;
        }

        return notifications.filter((notif) => {
            const haystack = [
                notif.message,
                notif.emprunt?.document,
                notif.emprunt?.emprunteur,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [notifications, searchQuery]);

    const unreadCount = useMemo(() => notifications.filter((notif) => !notif.est_lu).length, [notifications]);

    return (
        <Layout>
            <div className="p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-2">
                                <CardTitle>Centre de notifications</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    Suivez en un coup d'œil les retards et rappels liés aux emprunts.
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={unreadCount ? "destructive" : "secondary"} className="font-semibold uppercase">
                                    {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
                                </Badge>
                                <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleMarkAllRead}
                                    disabled={isMarkingAll || unreadCount === 0}
                                    className="gap-2"
                                >
                                    {isMarkingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                                    Tout marquer comme lu
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Rechercher par message, document ou emprunteur"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Emprunt</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="w-32">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Chargement des notifications...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredNotifications.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                Aucune notification à afficher.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredNotifications.map((notif) => (
                                            <TableRow key={notif.id} className={!notif.est_lu ? "bg-amber-50/60" : ""}>
                                                <TableCell>#{notif.id}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-slate-900">{notif.message}</p>
                                                        {notif.emprunt?.emprunteur && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Emprunteur : {notif.emprunt.emprunteur}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {notif.emprunt ? (
                                                        <div className="text-sm text-slate-700">
                                                            <p className="font-medium">
                                                                #{notif.emprunt.id}
                                                                {notif.emprunt.document ? ` — ${notif.emprunt.document}` : ""}
                                                            </p>
                                                            {notif.emprunt.date_retour_prevue && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Retour prévu le {notif.emprunt.date_retour_prevue}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{formatDate(notif.created_at)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={notif.est_lu ? "secondary" : "default"} className="w-fit">
                                                        {notif.est_lu ? "Lue" : "Non lue"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {!notif.est_lu && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => void handleMarkAsRead(notif.id)}
                                                                title="Marquer comme lue"
                                                            >
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => void handleDelete(notif.id)}
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
