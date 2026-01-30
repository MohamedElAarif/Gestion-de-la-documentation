import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Search, Pencil, Trash2, ArrowUpDown, CheckCircle, Printer, Loader2, ChevronDown, ChevronRight } from "lucide-react";
const ComboInput = ({ label, placeholder, options, textValue, selectedId, onTextChange, onSelectOption, }) => {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = textValue.trim().toLowerCase();
  const suggestions = useMemo(() => {
    const base = normalizedQuery ? options.filter((opt) => opt.label.toLowerCase().includes(normalizedQuery)) : options;
    return base.slice(0, 8);
  }, [options, normalizedQuery]);
  return (<div className="space-y-2">
    <Label>{label}</Label>
    <div className="relative">
      <Input placeholder={placeholder} value={textValue} onChange={(e) => {
        onTextChange(e.target.value);
        setIsOpen(true);
      }} onFocus={() => setIsOpen(true)} onBlur={() => {
        window.setTimeout(() => setIsOpen(false), 120);
      }} />
      {selectedId && (<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
        #{selectedId}
      </span>)}
      {isOpen && (<div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow">
        {suggestions.length === 0 ? (<div className="px-3 py-2 text-sm text-gray-500">Aucun résultat</div>) : (suggestions.map((option) => (<button type="button" key={option.id} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100" onMouseDown={(e) => e.preventDefault()} onClick={() => {
          onTextChange(option.label);
          onSelectOption(option);
          setIsOpen(false);
        }}>
          <span>{option.label}</span>
          <span className="text-xs text-gray-500">#{option.id}</span>
        </button>)))}
      </div>)}
    </div>
  </div>);
};
const DocumentExemplaireInline = ({ documentLabel, exemplaires }) => {
  const label = documentLabel ?? "-";
  const items = Array.isArray(exemplaires) ? exemplaires : [];
  const hasItems = items.length > 0;
  return (<div className="flex flex-wrap items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
    <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
    {hasItems && (<>
      <ChevronRight className="h-4 w-4 text-slate-400" />
      <div className="flex flex-wrap items-center gap-1">
        {items.map((ex) => (<Badge key={ex.id} variant="outline" className="text-[11px] font-semibold uppercase tracking-wide">
          {ex.code_exemplaire ?? `Exemplaire #${ex.id}`}
        </Badge>))}
      </div>
    </>)}
  </div>);
};
function getCsrfToken() {
  const el = document.querySelector('meta[name="csrf-token"]');
  return el?.content ?? "";
}
async function fetchJson(url, method = "GET", body) {
  const headers = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };
  const opts = { method, credentials: "same-origin", headers };
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
  return (await res.json());
}
const normalizeEmprunt = (e) => ({
  id: Number(e.id),
  document_id: e.document_id ?? null,
  emprunteur_id: e.emprunteur_id ?? null,
  batch_code: e.batch_code ?? null,
  document: e.document ?? "",
  emprunteur: e.emprunteur ?? "",
  date_emprunt: e.date_emprunt ?? null,
  date_retour_prevue: e.date_retour_prevue ?? null,
  date_retour_reelle: e.date_retour_reelle ?? null,
  status: e.status ?? "En cours",
  en_retard: !!e.en_retard,
  retard_notifie: !!e.retard_notifie,
  exemplaires: Array.isArray(e.exemplaires)
    ? e.exemplaires.map((ex) => ({ id: Number(ex.id), code_exemplaire: ex.code_exemplaire ?? null }))
    : [],
});

const isPendingStatus = (status) => {
  const value = status ?? "En cours";
  return value === "En cours" || value === "En retard";
};

const isReturnedStatus = (status) => {
  const value = status ?? "En cours";
  return value === "Retourné";
};

const deriveGroupStatusMeta = (rows) => {
  const collection = Array.isArray(rows) ? rows : [];
  const hasRetard = collection.some((row) => !!row.en_retard);
  const hasPending = collection.some((row) => isPendingStatus(row.status));
  const hasReturned = collection.some((row) => isReturnedStatus(row.status));

  if (hasRetard) {
    return { label: "En retard", variant: "destructive" };
  }
  if (hasPending && hasReturned) {
    return { label: "Partiel", variant: "outline" };
  }
  if (hasPending) {
    return { label: "En cours", variant: "default" };
  }
  return { label: "Retourné", variant: "secondary" };
};
export default function EmpruntsList() {
  const { props } = usePage();
  const serverEmprunts = Array.isArray(props.allEmprunts) ? props.allEmprunts : null;
  const initialDocumentOptions = useMemo(() => (Array.isArray(props.documents) ? props.documents : []), [props.documents]);
  const initialMembreOptions = useMemo(() => (Array.isArray(props.membres) ? props.membres : []), [props.membres]);
  const [documentOptions, setDocumentOptions] = useState(initialDocumentOptions);
  const [membreOptions, setMembreOptions] = useState(initialMembreOptions);
  const [exemplaireOptions, setExemplaireOptions] = useState([]);
  const [loadingExemplaires, setLoadingExemplaires] = useState(false);
  const [emprunts, setEmprunts] = useState(() => (serverEmprunts ? serverEmprunts.map(normalizeEmprunt) : []));
  const [loading, setLoading] = useState(!serverEmprunts);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    date_emprunt: "",
    date_retour_prevue: "",
    date_retour_reelle: "",
    en_retard: false,
    retard_notifie: false,
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const createForm = useForm({
    document_id: "",
    document_label: "",
    emprunteur_id: "",
    emprunteur_label: "",
    date_emprunt: initialDate,
    date_retour_prevue: initialDate,
    selected_exemplaires: [],
    take_all_available: false,
    entries: [],
  });
  const handleDocumentTextChange = (value) => {
    createForm.setData("document_label", value);
    createForm.setData("document_id", "");
    createForm.setData("selected_exemplaires", []);
    createForm.setData("take_all_available", false);
    setExemplaireOptions([]);
  };
  const handleEmprunteurTextChange = (value) => {
    createForm.setData("emprunteur_label", value);
    createForm.setData("emprunteur_id", "");
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retardFilter, setRetardFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_emprunt");
  const [sortOrder, setSortOrder] = useState("desc");
  const wantsAllExemplaires = !!createForm.data.take_all_available;
  const selectedExemplaires = Array.isArray(createForm.data.selected_exemplaires)
    ? createForm.data.selected_exemplaires
    : [];
  const entryList = createForm.data.entries ?? [];
  const entryCount = entryList.length;
  const canQueueEntry = !!createForm.data.document_id &&
    (wantsAllExemplaires ? exemplaireOptions.length > 0 : selectedExemplaires.length > 0);
  const queueButtonDisabled = loadingExemplaires || !canQueueEntry;
  useEffect(() => {
    setDocumentOptions(initialDocumentOptions);
  }, [initialDocumentOptions]);
  useEffect(() => {
    setMembreOptions(initialMembreOptions);
  }, [initialMembreOptions]);
  const fetchOptions = useCallback(async () => {
    try {
      const data = await fetchJson("/Emprunts/options");
      if (Array.isArray(data.documents))
        setDocumentOptions(data.documents);
      if (Array.isArray(data.membres))
        setMembreOptions(data.membres);
    }
    catch (error) {
      console.error("Impossible de rafraîchir les options", error);
    }
  }, []);
  const fetchExemplairesForDocument = useCallback(async (documentId) => {
    if (!documentId) {
      setExemplaireOptions([]);
      return;
    }
    setLoadingExemplaires(true);
    try {
      const data = await fetchJson(`/Documents/${documentId}/exemplaires/available`);
      const normalized = Array.isArray(data)
        ? data.map((item) => ({ id: Number(item.id), label: item.label ?? `Exemplaire #${item.id}` }))
        : [];
      setExemplaireOptions(normalized);
    }
    catch (error) {
      console.error("Impossible de récupérer les exemplaires disponibles", error);
      setExemplaireOptions([]);
    }
    finally {
      setLoadingExemplaires(false);
    }
  }, []);
  useEffect(() => {
    if (!isCreateOpen)
      return;
    void fetchExemplairesForDocument(createForm.data.document_id || null);
  }, [isCreateOpen, createForm.data.document_id, fetchExemplairesForDocument]);
  const exemplaireSelectValue = wantsAllExemplaires ? "ALL" : "";
  const handleExemplaireSelect = (value) => {
    if (value === "ALL") {
      createForm.setData("take_all_available", true);
      createForm.setData("selected_exemplaires", []);
      return;
    }
    const normalized = String(value);
    if (!normalized)
      return;
    createForm.setData("take_all_available", false);
    if (selectedExemplaires.includes(normalized))
      return;
    createForm.setData("selected_exemplaires", [...selectedExemplaires, normalized]);
  };
  const handleRemoveSelectedExemplaire = (value) => {
    const normalized = String(value);
    if (!selectedExemplaires.includes(normalized))
      return;
    createForm.setData("selected_exemplaires", selectedExemplaires.filter((id) => id !== normalized));
  };
  const handleAddEntry = () => {
    const documentId = createForm.data.document_id;
    if (!documentId) {
      alert("Merci de sélectionner un document à ajouter.");
      return;
    }
    if (loadingExemplaires) {
      alert("Patientez pendant le chargement des exemplaires de ce document.");
      return;
    }
    if (!wantsAllExemplaires && selectedExemplaires.length === 0) {
      alert("Sélectionnez au moins un exemplaire disponible pour ce document avant de l'ajouter.");
      return;
    }
    if (wantsAllExemplaires && exemplaireOptions.length === 0) {
      alert("Aucun exemplaire n'est disponible pour ce document en ce moment.");
      return;
    }
    const documentOption = documentOptions.find((doc) => String(doc.id) === String(documentId));
    const normalizedDocumentId = String(documentId);
    const entry = {
      uid: `${documentId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      document_id: normalizedDocumentId,
      document_label: documentOption?.label ?? createForm.data.document_label ?? "",
      document_display: documentOption?.label ?? createForm.data.document_label ?? `Document #${documentId}`,
      take_all_available: wantsAllExemplaires,
      selected_exemplaires: wantsAllExemplaires ? [] : selectedExemplaires,
      exemplaires_labels: wantsAllExemplaires
        ? []
        : selectedExemplaires.map((id) => {
          const option = exemplaireOptions.find((opt) => String(opt.id) === String(id));
          return {
            id: String(id),
            label: option?.label ?? `Exemplaire #${id}`,
          };
        }),
      total_available_snapshot: exemplaireOptions.length,
    };
    const existingIndex = entryList.findIndex((item) => String(item.document_id) === normalizedDocumentId);
    if (existingIndex >= 0) {
      const existing = entryList[existingIndex];
      const merged = {
        ...existing,
        document_label: entry.document_label || existing.document_label,
        document_display: entry.document_display || existing.document_display,
        total_available_snapshot: Math.max(existing.total_available_snapshot, entry.total_available_snapshot),
      };
      if (entry.take_all_available || existing.take_all_available) {
        merged.take_all_available = true;
        merged.selected_exemplaires = [];
        merged.exemplaires_labels = [];
      }
      else {
        const combinedIds = Array.from(new Set([...existing.selected_exemplaires, ...entry.selected_exemplaires]));
        const labelsMap = new Map();
        existing.exemplaires_labels.forEach((ex) => labelsMap.set(ex.id, ex.label));
        entry.exemplaires_labels.forEach((ex) => labelsMap.set(ex.id, ex.label));
        merged.selected_exemplaires = combinedIds;
        merged.exemplaires_labels = combinedIds.map((id) => ({ id, label: labelsMap.get(id) ?? `Exemplaire #${id}` }));
      }
      const nextEntries = [...entryList];
      nextEntries[existingIndex] = merged;
      createForm.setData("entries", nextEntries);
    }
    else {
      createForm.setData("entries", [...entryList, entry]);
    }
    createForm.setData("document_id", "");
    createForm.setData("document_label", "");
    createForm.setData("selected_exemplaires", []);
    createForm.setData("take_all_available", false);
    setExemplaireOptions([]);
  };
  const handleRemoveEntry = (uid) => {
    createForm.setData("entries", entryList.filter((entry) => entry.uid !== uid));
  };
  const handleClearEntries = () => {
    if (entryCount === 0)
      return;
    createForm.setData("entries", []);
  };
  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  // load from API if no server data
  useEffect(() => {
    if (serverEmprunts)
      return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchJson("/Emprunts/data");
        const normalized = data.map(normalizeEmprunt);
        if (mounted)
          setEmprunts(normalized);
      }
      catch (err) {
        console.error(err);
        if (mounted)
          setEmprunts([]);
      }
      finally {
        if (mounted)
          setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [serverEmprunts]);
  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchJson("/Emprunts/data");
      const normalized = data.map(normalizeEmprunt);
      setEmprunts(normalized);
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  };
  const groupedEmprunts = useMemo(() => {
    const map = new Map();
    emprunts.forEach((item) => {
      const key = item.batch_code ? `batch-${item.batch_code}` : `single-${item.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          batch_code: item.batch_code ?? null,
          emprunteur: item.emprunteur ?? "",
          emprunteur_id: item.emprunteur_id ?? null,
          documentCount: 0,
          exemplaireCount: 0,
          date_emprunt: item.date_emprunt ?? null,
          date_retour_prevue: item.date_retour_prevue ?? null,
          date_retour_reelle: item.date_retour_reelle ?? null,
          statusLabel: item.status ?? "En cours",
          en_retard: !!item.en_retard,
          rows: [],
        });
      }
      const group = map.get(key);
      group.rows.push(item);
      group.documentCount = group.rows.length;
      group.exemplaireCount += Array.isArray(item.exemplaires) ? item.exemplaires.length : 0;
      if (!group.date_emprunt)
        group.date_emprunt = item.date_emprunt ?? null;
      if (!group.date_retour_prevue)
        group.date_retour_prevue = item.date_retour_prevue ?? null;
      if (!group.date_retour_reelle && item.date_retour_reelle) {
        group.date_retour_reelle = item.date_retour_reelle;
      }
      if (!group.en_retard && item.en_retard) {
        group.en_retard = true;
      }
      const statusMeta = deriveGroupStatusMeta(group.rows);
      group.statusLabel = statusMeta.label;
      group.statusVariant = statusMeta.variant;
    });
    return Array.from(map.values());
  }, [emprunts]);
  const updateEmprunt = async (id, payload) => {
    await fetchJson(`/Emprunts/${id}`, "PUT", payload);
    await reload();
  };
  const deleteEmprunt = async (id) => {
    if (!confirm("Supprimer cet emprunt ?"))
      return;
    await fetchJson(`/Emprunts/${id}`, "DELETE");
    await reload();
  };
  const deleteGroup = async (group) => {
    if (!confirm("Supprimer tous les documents de cet emprunt ?"))
      return;
    for (const row of group.rows) {
      await fetchJson(`/Emprunts/${row.id}`, "DELETE");
    }
    await reload();
  };
  const markReturned = async (id) => {
    await fetchJson(`/Emprunts/${id}/return`, "PUT", {});
    await reload();
  };
  const markGroupReturned = async (group) => {
    const pending = group.rows.filter((row) => isPendingStatus(row.status));
    if (pending.length === 0)
      return;
    for (const row of pending) {
      await fetchJson(`/Emprunts/${row.id}/return`, "PUT", {});
    }
    await reload();
  };
  const printGroup = (group) => {
    const w = window.open("", "_blank");
    if (!w)
      return;
    const docsList = group.rows
      .map((row) => {
        const exemplairesLines = Array.isArray(row.exemplaires) && row.exemplaires.length > 0
          ? row.exemplaires.map((ex) => `- ${ex.code_exemplaire ?? `Exemplaire #${ex.id}`} (#${ex.id})`).join("<br />")
          : "-";
        return `<li><strong>${row.document ?? `Document #${row.document_id}`}</strong><br />${exemplairesLines}</li>`;
      })
      .join("");
    w.document.write(`<html><head><title>Lot d'emprunt</title></head><body>
      <h2>Lot d'emprunt ${group.batch_code ? `#${group.batch_code}` : ""}</h2>
      <p><strong>Emprunteur:</strong> ${group.emprunteur ?? "-"}</p>
      <p><strong>Date emprunt:</strong> ${group.date_emprunt ?? "-"}</p>
      <p><strong>Date retour prévue:</strong> ${group.date_retour_prevue ?? "-"}</p>
      <ul>${docsList}</ul>
    </body></html>`);
    w.document.close();
    w.print();
  };
  const openGroupEditor = (group) => {
    const firstRow = group.rows[0];
    if (!firstRow)
      return;
    openEditModal(firstRow);
  };
  const openCreateModal = () => {
    void fetchOptions();
    createForm.setData("document_id", createForm.data.document_id || "");
    createForm.setData("emprunteur_id", createForm.data.emprunteur_id || "");
    createForm.setData("date_emprunt", createForm.data.date_emprunt || new Date().toISOString().slice(0, 10));
    createForm.setData("date_retour_prevue", createForm.data.date_retour_prevue || new Date().toISOString().slice(0, 10));
    createForm.setData("selected_exemplaires", []);
    createForm.setData("take_all_available", false);
    createForm.setData("entries", []);
    setExemplaireOptions([]);
    setIsCreateOpen(true);
  };
  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setExemplaireOptions([]);
    createForm.setData("selected_exemplaires", []);
    createForm.setData("take_all_available", false);
    createForm.setData("entries", []);
  };
  const openEditModal = (item) => {
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
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingTarget)
      return;
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
      selected_exemplaires: [],
      take_all_available: false,
      entries: [],
    });
    setExemplaireOptions([]);
  };
  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    let emprunteurId = createForm.data.emprunteur_id;
    let emprunteurLabel = (createForm.data.emprunteur_label || "").trim();
    if (!emprunteurId && emprunteurLabel) {
      const existingMember = membreOptions.find((m) => m.label.toLowerCase() === emprunteurLabel.toLowerCase());
      if (existingMember) {
        emprunteurId = String(existingMember.id);
        emprunteurLabel = existingMember.label;
      }
    }
    const hasMembreId = !!emprunteurId;
    const hasMembreText = emprunteurLabel.length > 0;
    if (entryList.length === 0) {
      alert("Ajoutez au moins un document via le bouton \"Ajouter ce document\" avant de valider l'emprunt.");
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
    const entriesPayload = entryList.map((entry) => {
      const entryPayload = {
        take_all_available: entry.take_all_available,
      };
      if (entry.document_id) {
        entryPayload.document_id = Number(entry.document_id);
      }
      else if (entry.document_label) {
        entryPayload.document_label = entry.document_label;
      }
      if (!entry.take_all_available) {
        entryPayload.exemplaire_ids = entry.selected_exemplaires.map((id) => Number(id));
      }
      return entryPayload;
    });
    const payload = {
      date_emprunt: createForm.data.date_emprunt,
      date_retour_prevue: createForm.data.date_retour_prevue,
      entries: entriesPayload,
    };
    if (hasMembreId) {
      payload.emprunteur_id = Number(emprunteurId);
    }
    else if (emprunteurLabel) {
      payload.emprunteur_label = emprunteurLabel;
    }
    try {
      await fetchJson("/Emprunts", "POST", payload);
      await reload();
      await fetchOptions();
      resetCreateForm();
      closeCreateModal();
    }
    catch (error) {
      console.error("Erreur lors de la création de l'emprunt", error);
      alert("Impossible de créer l'emprunt. Veuillez réessayer.");
    }
  };
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = (group) => {
      if (!q)
        return true;
      return group.rows.some((row) => {
        const doc = (row.document ?? "").toLowerCase();
        const emp = (row.emprunteur ?? "").toLowerCase();
        return doc.includes(q) || emp.includes(q);
      });
    };
    const matchesStatus = (group) => {
      if (statusFilter === "all")
        return true;
      if (statusFilter === "En cours") {
        return group.rows.some((row) => isPendingStatus(row.status));
      }
      if (statusFilter === "Retourné") {
        return group.rows.every((row) => isReturnedStatus(row.status));
      }
      return true;
    };
    const matchesRetard = (group) => {
      if (retardFilter === "all")
        return true;
      const hasRetard = group.rows.some((row) => !!row.en_retard);
      if (retardFilter === "retard")
        return hasRetard;
      if (retardFilter === "non-retard")
        return !hasRetard;
      return true;
    };
    const getSortValue = (group) => {
      switch (sortBy) {
        case "document":
          return (group.rows[0]?.document ?? "").toLowerCase();
        case "emprunteur":
          return (group.emprunteur ?? "").toLowerCase();
        case "date_retour_prevue":
          return group.date_retour_prevue ?? "";
        case "date_retour_reelle":
          return group.date_retour_reelle ?? "";
        case "date_emprunt":
        default:
          return group.date_emprunt ?? "";
      }
    };
    return groupedEmprunts
      .filter((group) => matchesSearch(group) && matchesStatus(group) && matchesRetard(group))
      .sort((a, b) => {
        const aVal = getSortValue(a);
        const bVal = getSortValue(b);
        if (sortBy.includes("date")) {
          const at = Number(new Date(aVal || "").getTime()) || 0;
          const bt = Number(new Date(bVal || "").getTime()) || 0;
          return sortOrder === "asc" ? at - bt : bt - at;
        }
        if (aVal === bVal)
          return 0;
        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
  }, [groupedEmprunts, searchQuery, statusFilter, retardFilter, sortBy, sortOrder]);
  const toggleSort = (field) => {
    if (sortBy === field)
      setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };
  const handlePrint = (emprunt) => {
    const w = window.open("", "_blank");
    if (!w)
      return;
    const exemplairesLines = Array.isArray(emprunt.exemplaires) && emprunt.exemplaires.length > 0
      ? emprunt.exemplaires
        .map((ex) => `- ${ex.code_exemplaire ?? `Exemplaire #${ex.id}`} (#${ex.id})`)
        .join("<br />")
      : "-";
    w.document.write(`<html><head><title>Ticket ${emprunt.id}</title></head><body>
      <h2>Ticket d'emprunt #${emprunt.id}</h2>
      <p><strong>Emprunteur:</strong> ${emprunt.emprunteur ?? "-"}</p>
      <p><strong>Document:</strong> ${emprunt.document ?? "-"}</p>
      <p><strong>Exemplaires:</strong><br />${exemplairesLines}</p>
      <p><strong>Date emprunt:</strong> ${emprunt.date_emprunt ?? "-"}</p>
      <p><strong>Date retour prévue:</strong> ${emprunt.date_retour_prevue ?? "-"}</p>
    </body></html>`);
    w.document.close();
    w.print();
  };
  return (<div>
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

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 dark:bg-slate-900/40">
                  <TableHead className="w-12" />
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Lot</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("emprunteur")}>
                      Emprunteur <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("document")}>
                      Documents <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("date_emprunt")}>
                      Date emprunt <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("date_retour_prevue")}>
                      Date retour prévue <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <button type="button" className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("date_retour_reelle")}>
                      Date retour réelle <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">Statut</TableHead>
                  <TableHead className="w-48 text-right text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={9}>Chargement...</TableCell></TableRow>) : filteredGroups.length === 0 ? (<TableRow><TableCell colSpan={9}>Aucun emprunt</TableCell></TableRow>) : (filteredGroups.map((group) => {
                  const expanded = !!expandedGroups[group.key];
                  const groupLabel = group.batch_code
                    ? `Lot ${group.batch_code.slice(0, 8)}`
                    : `Emprunt #${group.rows[0]?.id ?? "-"}`;
                  const documentsPreview = group.rows.slice(0, 2);
                  const remainingDocs = group.documentCount - documentsPreview.length;
                  const hasPending = group.rows.some((row) => isPendingStatus(row.status));
                  const statusVariant = group.statusVariant ??
                    (group.statusLabel === "Retourné"
                      ? "secondary"
                      : group.statusLabel === "Partiel"
                        ? "outline"
                        : group.statusLabel === "En retard"
                          ? "destructive"
                          : "default");
                  return (<React.Fragment key={group.key}>
                    <TableRow className="border-b border-slate-100 text-sm transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
                      <TableCell className="align-middle">
                        <button type="button" className={`rounded-full border p-1 transition-colors ${expanded ? "bg-slate-200/80" : "hover:bg-slate-100"}`} onClick={() => toggleGroup(group.key)} aria-label="Basculer les détails">
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="align-top font-semibold text-slate-700 dark:text-slate-200">
                        <div className="flex flex-col gap-1">
                          <span>{groupLabel}</span>
                          <span className="text-xs text-muted-foreground">{group.documentCount} document(s)</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm font-medium text-slate-900 dark:text-slate-100">
                        {group.emprunteur ?? "-"}
                      </TableCell>
                      <TableCell className="align-top text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex flex-col gap-1">
                          {documentsPreview.map((row) => (<div key={row.id} className="flex items-center gap-2">
                            <span className="truncate font-medium">{row.document ?? `Document #${row.document_id}`}</span>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                              {(row.exemplaires?.length ?? 0) || 1} ex.
                            </Badge>
                          </div>))}
                          {remainingDocs > 0 && (<span className="text-xs text-muted-foreground">+ {remainingDocs} autre(s)</span>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">{group.date_emprunt ?? "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">{group.date_retour_prevue ?? "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">{group.date_retour_reelle ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={statusVariant}
                            className="w-fit"
                          >
                            {group.statusLabel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 align-middle">
                        <div className="flex items-center justify-end gap-3">
                          {hasPending && (<Button variant="ghost" size="icon" onClick={() => void markGroupReturned(group)} title="Tout retourner">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </Button>)}
                          <Button variant="ghost" size="icon" onClick={() => printGroup(group)} title="Imprimer le lot">
                            <Printer className="h-5 w-5 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openGroupEditor(group)} title="Modifier">
                            <Pencil className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => void deleteGroup(group)} title="Supprimer le lot">
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded && (<TableRow className="bg-muted/30">
                      <TableCell colSpan={9} className="p-0">
                        <div className="space-y-4 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
                          {group.rows.map((row) => (<div key={row.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {row.document ?? `Document #${row.document_id}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Emprunteur : {row.emprunteur ?? group.emprunteur ?? "-"}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {isPendingStatus(row.status) && (<Button variant="ghost" size="sm" onClick={() => void markReturned(row.id)} title="Marquer comme retourné">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>)}
                                <Button variant="ghost" size="sm" onClick={() => handlePrint(row)} title="Imprimer">
                                  <Printer className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} title="Modifier">
                                  <Pencil className="h-4 w-4 text-gray-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void deleteEmprunt(row.id)} title="Supprimer">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="border-t border-dashed border-slate-200 pt-2 dark:border-slate-700">
                              <DocumentExemplaireInline documentLabel={row.document} exemplaires={row.exemplaires} />
                            </div>
                          </div>))}
                        </div>
                      </TableCell>
                    </TableRow>)}
                  </React.Fragment>);
                }))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isCreateOpen} onOpenChange={(open) => {
      if (!open)
        closeCreateModal();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel emprunt</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          <ComboInput label="Document" placeholder="Chercher ou saisir un document" options={documentOptions} textValue={createForm.data.document_label} selectedId={createForm.data.document_id} onTextChange={handleDocumentTextChange} onSelectOption={(option) => {
            createForm.setData("document_id", String(option.id));
            createForm.setData("document_label", option.label);
            createForm.setData("selected_exemplaires", []);
            createForm.setData("take_all_available", false);
            setExemplaireOptions([]);
            void fetchExemplairesForDocument(option.id);
          }} />

          <div className="space-y-2">
            <Label>Exemplaire(s)</Label>
            {!createForm.data.document_id ? (<p className="text-sm text-muted-foreground">Sélectionnez d'abord un document pour voir ses exemplaires disponibles.</p>) : loadingExemplaires ? (<div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des exemplaires...
            </div>) : exemplaireOptions.length === 0 ? (<p className="text-sm text-red-500">Aucun exemplaire disponible pour ce document.</p>) : (<div className="space-y-3">
              <Select value={exemplaireSelectValue} onValueChange={handleExemplaireSelect}>
                <SelectTrigger><SelectValue placeholder="Choisir un exemplaire ou tout prendre" /></SelectTrigger>
                <SelectContent>
                  {exemplaireOptions.map((option) => (<SelectItem key={option.id} value={String(option.id)}>
                    {option.label}
                  </SelectItem>))}
                  <SelectItem value="ALL" className="font-semibold">
                    Tous les exemplaires disponibles ({exemplaireOptions.length})
                  </SelectItem>
                </SelectContent>
              </Select>
              {!wantsAllExemplaires && selectedExemplaires.length > 0 && (<div className="flex flex-wrap gap-2">
                {selectedExemplaires.map((selectedId) => {
                  const option = exemplaireOptions.find((opt) => String(opt.id) === String(selectedId));
                  const label = option?.label ?? `Exemplaire #${selectedId}`;
                  return (<span key={selectedId} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                    {label}
                    <button type="button" className="text-xs text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-white" onClick={() => handleRemoveSelectedExemplaire(String(selectedId))} aria-label="Retirer cet exemplaire">
                      ×
                    </button>
                  </span>);
                })}
              </div>)}
              <div className="flex flex-col gap-2 rounded-md border border-dashed border-slate-200 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <span>
                  {wantsAllExemplaires
                    ? `Tous les exemplaires disponibles (actuellement ${exemplaireOptions.length}) seront ajoutés à cet emprunt.`
                    : selectedExemplaires.length > 0
                      ? "Ajoutez ou retirez des exemplaires via la liste, puis cliquez sur \"Ajouter ce document\"."
                      : "Sélectionnez un ou plusieurs exemplaires avant d'ajouter le document à la liste."}
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddEntry} disabled={queueButtonDisabled}>
                  Ajouter ce document
                </Button>
              </div>
            </div>)}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Documents ajoutés ({entryCount})</Label>
              {entryCount > 0 && (<Button type="button" variant="ghost" size="sm" onClick={handleClearEntries}>
                Tout retirer
              </Button>)}
            </div>
            {entryCount === 0 ? (<p className="text-sm text-muted-foreground">
              Ajoutez un document via le sélecteur ci-dessus pour préparer un emprunt groupé.
            </p>) : (<div className="max-h-56 space-y-3 overflow-y-auto pr-1">
              {entryList.map((entry) => (<div key={entry.uid} className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.document_display}</p>
                    {entry.document_id && (<p className="text-[11px] uppercase tracking-wide text-slate-400">ID #{entry.document_id}</p>)}
                    <p className="text-xs text-muted-foreground">
                      {entry.take_all_available
                        ? `Tous les exemplaires disponibles (snapshot : ${entry.total_available_snapshot})`
                        : entry.exemplaires_labels.length === 1
                          ? "1 exemplaire sélectionné"
                          : `${entry.exemplaires_labels.length} exemplaires sélectionnés`}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveEntry(entry.uid)} aria-label="Retirer ce document">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                {entry.take_all_available ? (<Badge variant="secondary" className="mt-3 w-fit text-xs">
                  Tous les exemplaires de ce document seront ajoutés
                </Badge>) : entry.exemplaires_labels.length > 0 ? (<div className="mt-3 flex flex-wrap gap-2">
                  {entry.exemplaires_labels.map((ex) => (<Badge key={`${entry.uid}-${ex.id}`} variant="outline" className="text-xs">
                    {ex.label}
                  </Badge>))}
                </div>) : null}
              </div>))}
            </div>)}
          </div>

          <ComboInput label="Emprunteur" placeholder="Chercher ou saisir un emprunteur" options={membreOptions} textValue={createForm.data.emprunteur_label} selectedId={createForm.data.emprunteur_id} onTextChange={handleEmprunteurTextChange} onSelectOption={(option) => {
            createForm.setData("emprunteur_id", String(option.id));
            createForm.setData("emprunteur_label", option.label);
          }} />

          <div className="space-y-2">
            <Label htmlFor="create-date-emprunt">Date emprunt</Label>
            <Input id="create-date-emprunt" type="date" value={createForm.data.date_emprunt} onChange={(e) => createForm.setData("date_emprunt", e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-date-retour-prevue">Date retour prévue</Label>
            <Input id="create-date-retour-prevue" type="date" value={createForm.data.date_retour_prevue} onChange={(e) => createForm.setData("date_retour_prevue", e.target.value)} required />
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
      if (!open)
        setEditingTarget(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;emprunt #{editingTarget?.id}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-date-emprunt">Date emprunt</Label>
            <Input id="edit-date-emprunt" type="date" value={editForm.date_emprunt} onChange={(e) => setEditForm((prev) => ({ ...prev, date_emprunt: e.target.value }))} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date-retour-prevue">Date retour prévue</Label>
            <Input id="edit-date-retour-prevue" type="date" value={editForm.date_retour_prevue} onChange={(e) => setEditForm((prev) => ({ ...prev, date_retour_prevue: e.target.value }))} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date-retour-reelle">Date retour réelle</Label>
            <Input id="edit-date-retour-reelle" type="date" value={editForm.date_retour_reelle} onChange={(e) => setEditForm((prev) => ({ ...prev, date_retour_reelle: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeEditModal}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>);
}
