import React, { useCallback, useEffect, useMemo, useState } from "react";
import { router, useForm, usePage } from "@inertiajs/react";
import Layout from "../Layouts/Layout";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Search, Pencil, Trash2, ArrowUpDown, CheckCircle, Printer } from "lucide-react";

type EmpruntItem = {
  id: number;
  document_id?: number | null;
  emprunteur_id?: number | null;
  document?: string | null;
  emprunteur?: string | null;
  date_emprunt?: string | null;
  date_retour_prevue?: string | null;
  date_retour_reelle?: string | null;
  status?: string | null;
  en_retard?: boolean;
  retard_notifie?: boolean;
};

type OptionItem = {
  id: number;
  label: string;
};

type ComboInputProps = {
  label: string;
  placeholder: string;
  options: OptionItem[];
  textValue: string;
  selectedId: string;
  onTextChange: (value: string) => void;
  onSelectOption: (option: OptionItem) => void;
};

const ComboInput: React.FC<ComboInputProps> = ({
  label,
  placeholder,
  options,
  textValue,
  selectedId,
  onTextChange,
  onSelectOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = textValue.trim().toLowerCase();
  const suggestions = useMemo(() => {
    const base = normalizedQuery ? options.filter((opt) => opt.label.toLowerCase().includes(normalizedQuery)) : options;
    return base.slice(0, 8);
  }, [options, normalizedQuery]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={textValue}
          onChange={(e) => {
            onTextChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
        />
        {selectedId && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            #{selectedId}
          </span>
        )}
        {isOpen && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow">
            {suggestions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Aucun résultat</div>
            ) : (
              suggestions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onTextChange(option.label);
                    onSelectOption(option);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-500">#{option.id}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function getCsrfToken(): string {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  return el?.content ?? "";
}

async function fetchJson<T = any>(url: string, method = "GET", body?: any): Promise<T> {
  const headers: Record<string, string> = { 
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest" 
  };
  const opts: RequestInit = { method, credentials: "same-origin", headers };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-TOKEN"] = getCsrfToken();
    opts.body = body !== undefined ? JSON.stringify(body) : undefined;
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request failed ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export default function EmpruntsList(): React.JSX.Element {
  const { props } = usePage<{ allEmprunts?: EmpruntItem[]; documents?: OptionItem[]; membres?: OptionItem[] }>();
  const serverEmprunts = Array.isArray(props.allEmprunts) ? props.allEmprunts : null;
  const initialDocumentOptions = useMemo(() => (Array.isArray(props.documents) ? props.documents : []), [props.documents]);
  const initialMembreOptions = useMemo(() => (Array.isArray(props.membres) ? props.membres : []), [props.membres]);
  const [documentOptions, setDocumentOptions] = useState<OptionItem[]>(initialDocumentOptions);
  const [membreOptions, setMembreOptions] = useState<OptionItem[]>(initialMembreOptions);
  const [emprunts, setEmprunts] = useState<EmpruntItem[]>(serverEmprunts ?? []);
  const [loading, setLoading] = useState<boolean>(!serverEmprunts);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<EmpruntItem | null>(null);
  const [editForm, setEditForm] = useState({
    date_emprunt: "",
    date_retour_prevue: "",
    date_retour_reelle: "",
    en_retard: false,
    retard_notifie: false,
  });

  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const createForm = useForm({
    document_id: "",
    document_label: "",
    emprunteur_id: "",
    emprunteur_label: "",
    date_emprunt: initialDate,
    date_retour_prevue: initialDate,
  });

  const handleDocumentTextChange = (value: string) => {
    createForm.setData("document_label", value);
    createForm.setData("document_id", "");
  };

  const handleEmprunteurTextChange = (value: string) => {
    createForm.setData("emprunteur_label", value);
    createForm.setData("emprunteur_id", "");
  };

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [retardFilter, setRetardFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_emprunt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setDocumentOptions(initialDocumentOptions);
  }, [initialDocumentOptions]);

  useEffect(() => {
    setMembreOptions(initialMembreOptions);
  }, [initialMembreOptions]);

  const fetchOptions = useCallback(async () => {
    try {
      const data = await fetchJson<{ documents?: OptionItem[]; membres?: OptionItem[] }>("/Emprunts/options");
      if (Array.isArray(data.documents)) setDocumentOptions(data.documents);
      if (Array.isArray(data.membres)) setMembreOptions(data.membres);
    } catch (error) {
      console.error("Impossible de rafraîchir les options", error);
    }
  }, []);

  // load from API if no server data
  useEffect(() => {
    if (serverEmprunts) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchJson<EmpruntItem[]>("/Emprunts/data");
        const normalized = data.map((e) => ({
          id: Number(e.id),
          document_id: e.document_id ?? null,
          emprunteur_id: e.emprunteur_id ?? null,
          document: e.document ?? "",
          emprunteur: e.emprunteur ?? "",
          date_emprunt: e.date_emprunt ?? null,
          date_retour_prevue: e.date_retour_prevue ?? null,
          date_retour_reelle: e.date_retour_reelle ?? null,
          status: e.status ?? "En cours",
          en_retard: !!e.en_retard,
          retard_notifie: !!e.retard_notifie,
        }));
        if (mounted) setEmprunts(normalized);
      } catch (err) {
        console.error(err);
        if (mounted) setEmprunts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [serverEmprunts]);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<EmpruntItem[]>("/Emprunts/data");
      const normalized = data.map((e) => ({
        id: Number(e.id),
        document_id: e.document_id ?? null,
        emprunteur_id: e.emprunteur_id ?? null,
        document: e.document ?? "",
        emprunteur: e.emprunteur ?? "",
        date_emprunt: e.date_emprunt ?? null,
        date_retour_prevue: e.date_retour_prevue ?? null,
        date_retour_reelle: e.date_retour_reelle ?? null,
        status: e.status ?? "En cours",
        en_retard: !!e.en_retard,
        retard_notifie: !!e.retard_notifie,
      }));
      setEmprunts(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateEmprunt = async (id: number, payload: Partial<EmpruntItem>) => {
    await fetchJson(`/Emprunts/${id}`, "PUT", payload);
    await reload();
  };

  const deleteEmprunt = async (id: number) => {
    if (!confirm("Supprimer cet emprunt ?")) return;
    await fetchJson(`/Emprunts/${id}`, "DELETE");
    await reload();
  };

  const markReturned = async (id: number) => {
    await fetchJson(`/Emprunts/${id}/return`, "PUT", {});
    await reload();
  };

  const openCreateModal = () => {
    void fetchOptions();
    createForm.setData("document_id", createForm.data.document_id || "");
    createForm.setData("emprunteur_id", createForm.data.emprunteur_id || "");
    createForm.setData("date_emprunt", createForm.data.date_emprunt || new Date().toISOString().slice(0, 10));
    createForm.setData("date_retour_prevue", createForm.data.date_retour_prevue || new Date().toISOString().slice(0, 10));
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
  };

  const openEditModal = (item: EmpruntItem) => {
    setEditingTarget(item);
    setEditForm({
      date_emprunt: item.date_emprunt ?? "",
      date_retour_prevue: item.date_retour_prevue ?? "",
      date_retour_reelle: item.date_retour_reelle ?? "",
      en_retard: !!item.en_retard,
      retard_notifie: !!item.retard_notifie,
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingTarget(null);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTarget) return;
    await updateEmprunt(editingTarget.id, {
      date_emprunt: editForm.date_emprunt,
      date_retour_prevue: editForm.date_retour_prevue,
      date_retour_reelle: editForm.date_retour_reelle || null,
      en_retard: editForm.en_retard,
      retard_notifie: editForm.retard_notifie,
    });
    closeEditModal();
  };

  const resetCreateForm = () => {
    const today = new Date().toISOString().slice(0, 10);
    createForm.setData({
      document_id: "",
      document_label: "",
      emprunteur_id: "",
      emprunteur_label: "",
      date_emprunt: today,
      date_retour_prevue: today,
    });
  };

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let documentId = createForm.data.document_id;
    let emprunteurId = createForm.data.emprunteur_id;
    let documentLabel = (createForm.data.document_label || "").trim();
    let emprunteurLabel = (createForm.data.emprunteur_label || "").trim();

    if (!documentId && documentLabel) {
      const existingDoc = documentOptions.find((doc) => doc.label.toLowerCase() === documentLabel.toLowerCase());
      if (existingDoc) {
        documentId = String(existingDoc.id);
        documentLabel = existingDoc.label;
      }
    }

    if (!emprunteurId && emprunteurLabel) {
      const existingMember = membreOptions.find((m) => m.label.toLowerCase() === emprunteurLabel.toLowerCase());
      if (existingMember) {
        emprunteurId = String(existingMember.id);
        emprunteurLabel = existingMember.label;
      }
    }

    const hasDocumentId = !!documentId;
    const hasDocumentText = documentLabel.length > 0;
    const hasMembreId = !!emprunteurId;
    const hasMembreText = emprunteurLabel.length > 0;

    if (!hasDocumentId && !hasDocumentText) {
      alert("Merci de choisir un document ou d'en saisir un nouveau.");
      return;
    }
    if (!hasMembreId && !hasMembreText) {
      alert("Merci de choisir un emprunteur ou d'en saisir un nouveau.");
      return;
    }

    if (createForm.data.date_retour_prevue && createForm.data.date_emprunt) {
      const dRetour = new Date(createForm.data.date_retour_prevue).setHours(0, 0, 0, 0);
      const dEmprunt = new Date(createForm.data.date_emprunt).setHours(0, 0, 0, 0);
      if (dRetour < dEmprunt) {
        alert("La date de retour prévue ne peut pas être antérieure à la date d'emprunt.");
        return;
      }
    }

    const payload: any = {
      date_emprunt: createForm.data.date_emprunt,
      date_retour_prevue: createForm.data.date_retour_prevue,
    };
    if (hasDocumentId) payload.document_id = Number(documentId);
    else payload.document_label = documentLabel;

    if (hasMembreId) payload.emprunteur_id = Number(emprunteurId);
    else payload.emprunteur_label = emprunteurLabel;

    try {
      await fetchJson("/Emprunts", "POST", payload);
      await reload();
      await fetchOptions();
      resetCreateForm();
      closeCreateModal();
    } catch (error) {
      console.error("Erreur lors de la création de l'emprunt", error);
      alert("Impossible de créer l'emprunt. Veuillez réessayer.");
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return emprunts
      .filter((e) => {
        if (q && !((e.emprunteur ?? "").toLowerCase().includes(q) || (e.document ?? "").toLowerCase().includes(q))) return false;
        if (statusFilter !== "all" && (e.status ?? "") !== statusFilter) return false;
        if (retardFilter !== "all") {
          const isRetard = !!e.en_retard;
          if (retardFilter === "retard" && !isRetard) return false;
          if (retardFilter === "non-retard" && isRetard) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal: any = (a as any)[sortBy] ?? "";
        const bVal: any = (b as any)[sortBy] ?? "";
        if (sortBy.includes("date")) {
          const at = Number(new Date(aVal || "").getTime()) || 0;
          const bt = Number(new Date(bVal || "").getTime()) || 0;
          return sortOrder === "asc" ? at - bt : bt - at;
        }
        const as = String(aVal).toLowerCase();
        const bs = String(bVal).toLowerCase();
        if (as === bs) return 0;
        return sortOrder === "asc" ? (as > bs ? 1 : -1) : (as < bs ? 1 : -1);
      });
  }, [emprunts, searchQuery, statusFilter, retardFilter, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const handlePrint = (emprunt: EmpruntItem) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Ticket ${emprunt.id}</title></head><body>
      <h2>Ticket d'emprunt #${emprunt.id}</h2>
      <p><strong>Emprunteur:</strong> ${emprunt.emprunteur ?? "-"}</p>
      <p><strong>Document:</strong> ${emprunt.document ?? "-"}</p>
      <p><strong>Date emprunt:</strong> ${emprunt.date_emprunt ?? "-"}</p>
      <p><strong>Date retour prévue:</strong> ${emprunt.date_retour_prevue ?? "-"}</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gestion des Emprunts</CardTitle>
              <Button className="gap-2" onClick={openCreateModal}>
                <Plus className="w-4 h-4" /> Nouvel Emprunt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Retourné">Retourné</SelectItem>
                </SelectContent>
              </Select>

              <Select value={retardFilter} onValueChange={setRetardFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrer retard" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="retard">En retard</SelectItem>
                  <SelectItem value="non-retard">À temps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort("emprunteur")}>Emprunteur <ArrowUpDown className="w-3 h-3" /></Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort("document")}>Document <ArrowUpDown className="w-3 h-3" /></Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => toggleSort("date_emprunt")}>Date emprunt <ArrowUpDown className="w-3 h-3" /></Button>
                    </TableHead>
                    <TableHead>Date retour prévue</TableHead>
                    <TableHead>Date retour réelle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8}>Chargement...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8}>Aucun emprunt</TableCell></TableRow>
                  ) : (
                    filtered.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.id}</TableCell>
                        <TableCell className="font-medium">{e.emprunteur ?? "-"}</TableCell>
                        <TableCell>{e.document ?? "-"}</TableCell>
                        <TableCell>{e.date_emprunt ?? "-"}</TableCell>
                        <TableCell>{e.date_retour_prevue ?? "-"}</TableCell>
                        <TableCell>{e.date_retour_reelle ?? "-"}</TableCell>
                        <TableCell><Badge variant={e.status === "En cours" ? "default" : "secondary"}>{e.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {e.status === "En cours" && (
                              <Button variant="ghost" size="sm" onClick={() => void markReturned(e.id)} title="Marquer comme retourné"><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handlePrint(e)} title="Imprimer"><Printer className="w-4 h-4 text-blue-600" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(e)} title="Modifier"><Pencil className="w-4 h-4 text-gray-600" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => void deleteEmprunt(e.id)} title="Supprimer"><Trash2 className="w-4 h-4 text-red-600" /></Button>
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

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel emprunt</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <ComboInput
              label="Document"
              placeholder="Chercher ou saisir un document"
              options={documentOptions}
              textValue={createForm.data.document_label}
              selectedId={createForm.data.document_id}
              onTextChange={handleDocumentTextChange}
              onSelectOption={(option) => {
                createForm.setData("document_id", String(option.id));
                createForm.setData("document_label", option.label);
              }}
            />

            <ComboInput
              label="Emprunteur"
              placeholder="Chercher ou saisir un emprunteur"
              options={membreOptions}
              textValue={createForm.data.emprunteur_label}
              selectedId={createForm.data.emprunteur_id}
              onTextChange={handleEmprunteurTextChange}
              onSelectOption={(option) => {
                createForm.setData("emprunteur_id", String(option.id));
                createForm.setData("emprunteur_label", option.label);
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="create-date-emprunt">Date emprunt</Label>
              <Input
                id="create-date-emprunt"
                type="date"
                value={createForm.data.date_emprunt}
                onChange={(e) => createForm.setData("date_emprunt", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-date-retour-prevue">Date retour prévue</Label>
              <Input
                id="create-date-retour-prevue"
                type="date"
                value={createForm.data.date_retour_prevue}
                onChange={(e) => createForm.setData("date_retour_prevue", e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeCreateModal}>Annuler</Button>
              <Button type="submit">
                Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setEditingTarget(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;emprunt #{editingTarget?.id}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-date-emprunt">Date emprunt</Label>
              <Input
                id="edit-date-emprunt"
                type="date"
                value={editForm.date_emprunt}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date_emprunt: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date-retour-prevue">Date retour prévue</Label>
              <Input
                id="edit-date-retour-prevue"
                type="date"
                value={editForm.date_retour_prevue}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date_retour_prevue: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date-retour-reelle">Date retour réelle</Label>
              <Input
                id="edit-date-retour-reelle"
                type="date"
                value={editForm.date_retour_reelle}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date_retour_reelle: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeEditModal}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
