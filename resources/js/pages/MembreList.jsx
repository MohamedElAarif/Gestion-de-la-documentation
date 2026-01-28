import React, { useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
const emptyForm = {
    nom: "",
    prenom: "",
    cin: "",
    email: "",
    telephone: "",
    is_active: true,
};
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
export default function MembreList() {
    const { props } = usePage();
    const initialMembres = useMemo(() => (Array.isArray(props.membres) ? props.membres : []), [props.membres]);
    const [membres, setMembres] = useState(initialMembres);
    const [loading, setLoading] = useState(initialMembres.length === 0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        setMembres(initialMembres);
        if (initialMembres.length > 0) {
            setLoading(false);
        }
    }, [initialMembres]);
    useEffect(() => {
        if (initialMembres.length === 0) {
            void reload();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const reload = async () => {
        setLoading(true);
        try {
            const data = await fetchJson("/Membres/data");
            setMembres(Array.isArray(data) ? data : []);
        }
        catch (error) {
            console.error("Impossible de recharger les membres", error);
        }
        finally {
            setLoading(false);
        }
    };
    const openNewModal = () => {
        setEditing(null);
        setFormData(emptyForm);
        setIsDialogOpen(true);
    };
    const openEditModal = (membre) => {
        setEditing(membre);
        setFormData({
            nom: membre.nom,
            prenom: membre.prenom,
            cin: membre.cin,
            email: membre.email,
            telephone: membre.telephone,
            is_active: membre.actif,
        });
        setIsDialogOpen(true);
    };
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditing(null);
        setFormData(emptyForm);
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting)
            return;
        setSubmitting(true);
        try {
            if (editing) {
                await fetchJson(`/Membres/${editing.id}`, "PUT", formData);
            }
            else {
                await fetchJson("/Membres", "POST", formData);
            }
            await reload();
            closeDialog();
        }
        catch (error) {
            console.error(error);
            alert("Impossible d'enregistrer le membre. Vérifiez les informations et réessayez.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (membre) => {
        if (!confirm(`Supprimer ${membre.prenom} ${membre.nom} ?`))
            return;
        try {
            await fetchJson(`/Membres/${membre.id}`, "DELETE");
            await reload();
        }
        catch (error) {
            console.error(error);
            alert("Impossible de supprimer ce membre.");
        }
    };
    const filteredMembres = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q)
            return membres;
        return membres.filter((membre) => {
            return [
                membre.nom,
                membre.prenom,
                membre.email,
                membre.telephone,
                membre.cin,
            ].some((value) => value?.toLowerCase().includes(q));
        });
    }, [membres, searchQuery]);
    return (<div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des Membres</CardTitle>
              <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={openNewModal}>
                <Plus className="w-4 h-4"/>
                Nouveau membre
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"/>
              <Input placeholder="Rechercher par nom, email, téléphone, CIN..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10"/>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>CIN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (<TableRow>
                      <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin"/>
                          Chargement des membres...
                        </div>
                      </TableCell>
                    </TableRow>) : filteredMembres.length === 0 ? (<TableRow>
                      <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                        Aucun membre ne correspond à votre recherche.
                      </TableCell>
                    </TableRow>) : (filteredMembres.map((membre) => (<TableRow key={membre.id}>
                        <TableCell>#{membre.id}</TableCell>
                        <TableCell className="font-semibold">{membre.nom}</TableCell>
                        <TableCell>{membre.prenom}</TableCell>
                        <TableCell>{membre.cin}</TableCell>
                        <TableCell>{membre.email}</TableCell>
                        <TableCell>{membre.telephone}</TableCell>
                        <TableCell>{membre.dateCreation ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(membre)} title="Modifier">
                              <Pencil className="w-4 h-4 text-gray-600"/>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(membre)} title="Supprimer">
                              <Trash2 className="w-4 h-4 text-red-600"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(true))}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier le membre" : "Nouveau membre"}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" value={formData.nom} onChange={(event) => setFormData({ ...formData, nom: event.target.value })} required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" value={formData.prenom} onChange={(event) => setFormData({ ...formData, prenom: event.target.value })} required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cin">CIN</Label>
                  <Input id="cin" value={formData.cin} onChange={(event) => setFormData({ ...formData, cin: event.target.value.toUpperCase() })} required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" value={formData.telephone} onChange={(event) => setFormData({ ...formData, telephone: event.target.value })} required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required/>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} style={{ backgroundColor: "#147a40" }}>
                  {submitting ? "Enregistrement..." : editing ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>);
}
