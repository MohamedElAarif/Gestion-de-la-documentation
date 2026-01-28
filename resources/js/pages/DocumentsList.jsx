import { Fragment, useEffect, useMemo, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronRight, Loader2, X, Archive, ArchiveRestore } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
function ComboInput({ label, placeholder, options, value, onChange, helperText }) {
    const [isOpen, setIsOpen] = useState(false);
    const [textValue, setTextValue] = useState("");
    useEffect(() => {
        const selected = options.find((option) => option.id.toString() === value);
        setTextValue(selected ? selected.nom : "");
    }, [options, value]);
    const normalizedQuery = textValue.trim().toLowerCase();
    const suggestions = useMemo(() => {
        const base = normalizedQuery
            ? options.filter((option) => option.nom.toLowerCase().includes(normalizedQuery))
            : options;
        return base.slice(0, 10);
    }, [options, normalizedQuery]);
    const handleSelect = (option) => {
        setTextValue(option.nom);
        onChange(option.id.toString());
        setIsOpen(false);
    };
    return (<div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input placeholder={placeholder} value={textValue} onChange={(event) => {
            setTextValue(event.target.value);
            setIsOpen(true);
        }} onFocus={() => setIsOpen(true)} onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150);
        }} onKeyDown={(event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                const first = suggestions[0];
                if (first)
                    handleSelect(first);
            }
        }}/>
        {isOpen && (<div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow">
            {suggestions.length === 0 ? (<div className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</div>) : (suggestions.map((option) => (<button type="button" key={option.id} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelect(option)}>
                  <span>{option.nom}</span>
                  <span className="text-xs text-muted-foreground">#{option.id}</span>
                </button>)))}
          </div>)}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>);
}
export default function DocumentsList({ allDocuments, rayonnages, categories, types }) {
    const initialDocuments = useMemo(() => (Array.isArray(allDocuments) ? allDocuments : []), [allDocuments]);
    const [documents, setDocuments] = useState(initialDocuments);
    const [searchQuery, setSearchQuery] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");
    const [rayonnageFilter, setRayonnageFilter] = useState("all");
    const [categorieFilter, setCategorieFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [archivedFilter, setArchivedFilter] = useState("active");
    const [structureQuery, setStructureQuery] = useState("");
    const [sortBy, setSortBy] = useState("titre");
    const [sortOrder, setSortOrder] = useState("asc");
    const [open, setOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [deletingExemplaireId, setDeletingExemplaireId] = useState(null);
    const [archivingExemplaireId, setArchivingExemplaireId] = useState(null);
    const [exemplaireModalDocument, setExemplaireModalDocument] = useState(null);
    const [exemplaireTags, setExemplaireTags] = useState([]);
    const [tagInputValue, setTagInputValue] = useState("");
    const [addingExemplaires, setAddingExemplaires] = useState(false);
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        }
        else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };
    const form = useForm({
        titre: "",
        description: "",
        date_achat: new Date().toISOString().slice(0, 10),
        rayonnage_id: "",
        categorie_id: "",
        type_id: "",
        is_archived: false,
        nombre_exemplaires: 1,
    });
    // legacy: exemplaire creation uses a simple quantity-based request
  useEffect(() => {
    setDocuments(initialDocuments);
    setExpandedRows((prev) => {
      if (!prev || Object.keys(prev).length === 0)
        return prev;
      const validIds = new Set(initialDocuments?.map((doc) => doc.id));
      const next = Object.entries(prev).reduce((acc, [key, value]) => {
        if (validIds.has(Number(key))) {
          acc[key] = value;
        }
        return acc;
      }, {});
      return next;
    });
  }, [initialDocuments]);
    const toggleRow = (id) => {
        setExpandedRows((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };
    const openAddExemplairesModal = (document) => {
        setExemplaireModalDocument(document);
        setExemplaireTags([]);
        setTagInputValue("");
    };
    const closeAddExemplairesModal = () => {
        setExemplaireModalDocument(null);
        setExemplaireTags([]);
        setTagInputValue("");
        setAddingExemplaires(false);
    };
    const addTag = (label) => {
        const value = label.trim();
        if (!value)
            return;
        if (exemplaireTags.length >= 50) {
            alert("Impossible d'ajouter plus de 50 exemplaires en une seule opération.");
            return;
        }
        setExemplaireTags((prev) => [...prev, value]);
        setTagInputValue("");
    };
    const handleTagInputKeyDown = (event) => {
        if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
            event.preventDefault();
            addTag(tagInputValue);
            return;
        }
        if (event.key === "Backspace" && !tagInputValue && exemplaireTags.length > 0) {
            event.preventDefault();
            setExemplaireTags((prev) => prev.slice(0, -1));
        }
    };
    const removeTag = (index) => {
        setExemplaireTags((prev) => prev.filter((_, idx) => idx !== index));
    };
    const handleSubmitExemplaires = (event) => {
        event.preventDefault();
        if (!exemplaireModalDocument)
            return;
        if (exemplaireTags.length === 0) {
            alert("Ajoutez au moins un exemplaire à créer.");
            return;
        }
        const payload = {
            labels: exemplaireTags,
        };
        setAddingExemplaires(true);
        router.post(`/Documents/${exemplaireModalDocument.id}/exemplaires`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                closeAddExemplairesModal();
            },
            onFinish: () => {
                setAddingExemplaires(false);
            },
        });
    };
    const rayonnageOptions = useMemo(() => rayonnages ?? [], [rayonnages]);
    const categorieOptions = useMemo(() => {
        if (categories && categories.length > 0)
            return categories;
        return documents.reduce((acc, doc) => {
            if (doc.categorie_id && doc.categorie) {
                acc.push({ id: doc.categorie_id, nom: doc.categorie, rayonnage_id: doc.rayonnage_id ?? null });
            }
            return acc;
        }, []);
    }, [categories, documents]);
    const typeOptions = useMemo(() => {
        if (types && types.length > 0)
            return types;
        return documents.reduce((acc, doc) => {
            if (doc.type_id && doc.type) {
                acc.push({ id: doc.type_id, nom: doc.type });
            }
            return acc;
        }, []);
    }, [types, documents]);
    const documentCategorieOptions = useMemo(() => {
        const selectedRayonnage = form.data?.rayonnage_id;
        if (!selectedRayonnage)
            return categorieOptions;
        return categorieOptions.filter((cat) => (cat.rayonnage_id ?? "").toString() === selectedRayonnage);
    }, [categorieOptions, form.data?.rayonnage_id]);
    useEffect(() => {
        if (!form.data?.categorie_id)
            return;
        const currentCategory = categorieOptions.find((cat) => cat.id.toString() === form.data.categorie_id);
        if (!currentCategory) {
            form.setData("categorie_id", "");
            return;
        }
        if (form.data?.rayonnage_id) {
            const belongsToSelectedRayonnage = (currentCategory.rayonnage_id ?? "").toString() === form.data.rayonnage_id;
            if (!belongsToSelectedRayonnage) {
                form.setData("categorie_id", "");
            }
        }
    }, [form.data?.rayonnage_id, form.data?.categorie_id, categorieOptions]);
    const visibleCategorieOptions = useMemo(() => {
        if (rayonnageFilter === "all")
            return categorieOptions;
        return categorieOptions.filter((cat) => (cat.rayonnage_id ?? "").toString() === rayonnageFilter);
    }, [categorieOptions, rayonnageFilter]);
    useEffect(() => {
        if (categorieFilter === "all")
            return;
        const stillValid = visibleCategorieOptions.some((cat) => cat.id.toString() === categorieFilter);
        if (!stillValid)
            setCategorieFilter("all");
    }, [visibleCategorieOptions, categorieFilter]);
    const openCreateModal = () => {
        setEditingDocument(null);
        form.setData({
            titre: "",
            description: "",
            date_achat: new Date().toISOString().slice(0, 10),
            rayonnage_id: rayonnageOptions[0]?.id?.toString() ?? "",
            categorie_id: categorieOptions[0]?.id?.toString() ?? "",
            type_id: typeOptions[0]?.id?.toString() ?? "",
            is_archived: false,
            nombre_exemplaires: 1,
        });
        setOpen(true);
    };
    const openEditModal = (document) => {
        setEditingDocument(document);
        form.setData({
            titre: document.titre ?? "",
            description: document.description ?? "",
            date_achat: document.dateAchat ?? "",
            rayonnage_id: document.rayonnage_id ? String(document.rayonnage_id) : "",
            categorie_id: document.categorie_id ? String(document.categorie_id) : "",
            type_id: document.type_id ? String(document.type_id) : "",
            is_archived: Boolean(document.is_archived),
            nombre_exemplaires: document.nombreExemplaires ?? 1,
        });
        setOpen(true);
    };
    const closeModal = () => {
        setOpen(false);
        setEditingDocument(null);
        form.reset();
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.data.titre.trim())
            return alert("Le titre du document est obligatoire.");
        if (!form.data.rayonnage_id || !form.data.categorie_id) {
            return alert("Sélectionnez un rayonnage et une catégorie.");
        }
        if (!form.data.nombre_exemplaires || Number(form.data.nombre_exemplaires) < 1) {
            return alert("Indiquez au moins un exemplaire.");
        }
        const options = {
            preserveScroll: true,
            onSuccess: closeModal,
        };
        if (editingDocument) {
            form.put(`/Documents/${editingDocument.id}`, options);
        }
        else {
            form.post("/Documents", options);
        }
    };
    const handleDelete = (id) => {
        if (!confirm("Supprimer ce document ?"))
            return;
        router.delete(`/Documents/${id}`, { preserveScroll: true });
    };
    const handleDeleteExemplaire = (documentId, exemplaire) => {
        if (!exemplaire.disponible) {
            alert("Impossible de supprimer un exemplaire actuellement emprunté.");
            return;
        }
        if (!confirm(`Supprimer l'exemplaire ${exemplaire.code_exemplaire} ?`))
            return;
        setDeletingExemplaireId(exemplaire.id);
        router.delete(`/Documents/${documentId}/exemplaires/${exemplaire.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingExemplaireId(null),
        });
    };
    const handleToggleArchive = (documentId, exemplaire, archived) => {
        if (archived && !exemplaire.disponible) {
            alert("Impossible d'archiver un exemplaire emprunté.");
            return;
        }
        setArchivingExemplaireId(exemplaire.id);
        router.patch(`/Documents/${documentId}/exemplaires/${exemplaire.id}/archive`, { archived }, {
            preserveScroll: true,
            onFinish: () => setArchivingExemplaireId(null),
        });
    };
    const handleRayonnageFilterChange = (value) => {
        setRayonnageFilter(value);
        setCategorieFilter("all");
    };
    const filteredDocuments = useMemo(() => {
        const structureNeedle = structureQuery.trim().toLowerCase();
        return documents
            .filter((doc) => {
            const matchesSearch = (doc.titre ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesAvailability = availabilityFilter === "all" ||
                (availabilityFilter === "disponible" && doc.disponible) ||
                (availabilityFilter === "emprunte" && !doc.disponible);
            const matchesRayonnage = rayonnageFilter === "all" || String(doc.rayonnage_id ?? "") === rayonnageFilter;
            const matchesCategorie = categorieFilter === "all" || String(doc.categorie_id ?? "") === categorieFilter;
            const matchesType = typeFilter === "all" || String(doc.type_id ?? "") === typeFilter;
            const hasArchivedCopies = Boolean(doc.hasArchivedExemplaires);
            const matchesArchived = archivedFilter === "all" ||
                (archivedFilter === "active" && !doc.is_archived) ||
                (archivedFilter === "archived" && Boolean(doc.is_archived)) ||
                (archivedFilter === "with_archived_exemplaires" && !doc.is_archived && hasArchivedCopies);
            const matchesStructure = structureNeedle.length === 0 ||
                [doc.rayonnage, doc.categorie, doc.type]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(structureNeedle));
            return (matchesSearch &&
                matchesAvailability &&
                matchesRayonnage &&
                matchesCategorie &&
                matchesType &&
                matchesArchived &&
                matchesStructure);
        })
            .sort((a, b) => {
            const aVal = a[sortBy] ?? "";
            const bVal = b[sortBy] ?? "";
            if (typeof aVal === "string" && typeof bVal === "string") {
                const compare = aVal.localeCompare(bVal);
                return sortOrder === "asc" ? compare : -compare;
            }
            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });
    }, [
        documents,
        searchQuery,
        availabilityFilter,
        rayonnageFilter,
        categorieFilter,
        typeFilter,
        archivedFilter,
        structureQuery,
        sortBy,
        sortOrder,
    ]);
    return (<div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Documents</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={openCreateModal}>
              <Plus className="w-4 h-4"/>
              Nouveau Document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <Input placeholder="Rechercher un document..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter') {
                const first = filteredDocuments[0];
                if (first)
                    openEditModal(first);
            }
        }} className="pl-10"/>
            </div>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Disponibilité"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="emprunte">Emprunté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={archivedFilter} onValueChange={setArchivedFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Statut"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="with_archived_exemplaires">Actifs avec exemplaire archivé</SelectItem>
                <SelectItem value="archived">Documents archivés</SelectItem>
                <SelectItem value="all">Tous les statuts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Select value={rayonnageFilter} onValueChange={handleRayonnageFilterChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par rayonnage"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rayonnages</SelectItem>
                {rayonnageOptions.map((ray) => (<SelectItem key={ray.id} value={ray.id.toString()}>
                    {ray.nom}
                  </SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={categorieFilter} onValueChange={setCategorieFilter} disabled={visibleCategorieOptions.length === 0 && rayonnageFilter !== "all"}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par catégorie"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {visibleCategorieOptions.length === 0 && rayonnageFilter !== "all" ? (<SelectItem value="none" disabled>
                    Aucune catégorie disponible
                  </SelectItem>) : (visibleCategorieOptions.map((cat) => (<SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nom}
                    </SelectItem>)))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {typeOptions.map((type) => (<SelectItem key={type.id} value={type.id.toString()}>
                    {type.nom}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <Input placeholder="Recherche avancée (rayonnage, catégorie, type...)" value={structureQuery} onChange={(e) => setStructureQuery(e.target.value)} className="w-full"/>

          <div className="rounded-md border overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 py-2"></TableHead>
                  <TableHead className="w-16 py-2">ID</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("titre")} className="gap-1">
                      Titre <ArrowUpDown className="w-3 h-3"/>
                    </Button>
                  </TableHead>
                  <TableHead className="py-2">Description</TableHead>
                  <TableHead className="py-2">Rayonnage</TableHead>
                  <TableHead className="py-2">Catégorie</TableHead>
                  <TableHead className="py-2">Type</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("dateAchat")} className="gap-1">
                      Date d'achat <ArrowUpDown className="w-3 h-3"/>
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort("dateCreation")} className="gap-1">
                      Date création <ArrowUpDown className="w-3 h-3"/>
                    </Button>
                  </TableHead>
                  <TableHead className="py-2 w-28">Disponibilité</TableHead>
                  <TableHead className="py-2 w-[260px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
            const exemplaires = Array.isArray(doc.exemplaires) ? doc.exemplaires : [];
            const hasExemplaires = exemplaires.length > 0;
            const showOnlyArchivedExemplaires = archivedFilter === "with_archived_exemplaires";
            const showAllExemplaires = archivedFilter === "all" || archivedFilter === "archived";
            const visibleExemplaires = showOnlyArchivedExemplaires
                ? exemplaires.filter((ex) => ex.is_archived)
                : showAllExemplaires
                    ? exemplaires
                    : exemplaires.filter((ex) => !ex.is_archived);
            const availableCount = doc.exemplairesDisponibles ?? exemplaires.filter((ex) => ex.disponible && !ex.is_archived).length;
            const totalCount = doc.nombreExemplaires ?? exemplaires.length;
            const nonArchivedCount = exemplaires.filter((ex) => !ex.is_archived).length;
            const expanded = Boolean(expandedRows[doc.id]);
            const detailWrapperClasses = `overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[800px] opacity-100 py-4" : "max-h-0 opacity-0"}`;
            const toggleClasses = `p-1 rounded transition-all duration-200 ${expanded ? "bg-muted" : ""} ${hasExemplaires ? "hover:bg-muted focus-visible:ring" : "opacity-30 cursor-not-allowed"}`;
            return (<Fragment key={doc.id}>
                      <TableRow className="align-top">
                        <TableCell className="py-2">
                          {hasExemplaires ? (<button type="button" onClick={() => toggleRow(doc.id)} className={toggleClasses} aria-label="Afficher les exemplaires" aria-expanded={expanded}>
                              {expanded ? (<ChevronDown className="w-4 h-4"/>) : (<ChevronRight className="w-4 h-4"/>)}
                            </button>) : null}
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.id}</TableCell>
                        <TableCell className="py-2 font-medium">
                          <div className="flex items-center gap-2 max-w-[260px]">
                            <span className="truncate" title={doc.titre}>{doc.titre}</span>
                            {doc.is_archived && <Badge variant="outline">Archivé</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 max-w-[320px]">
                          <span className="line-clamp-2" title={doc.description ?? ""}>{doc.description ?? "—"}</span>
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.rayonnage ?? "—"}</TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.categorie ?? "—"}</TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.type ?? "—"}</TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.dateAchat ?? "—"}</TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{doc.dateCreation ?? "—"}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant={availableCount > 0 ? "default" : "destructive"}>
                            {archivedFilter === "active"
                    ? `${availableCount} / ${nonArchivedCount}`
                    : availableCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex flex-wrap gap-2">
                            {!hasExemplaires && (<Button size="sm" className="gap-1" style={{ backgroundColor: "#147a40" }} onClick={() => openAddExemplairesModal(doc)}>
                                <Plus className="w-3 h-3"/>
                                Ajouter un exemplaire
                              </Button>)}
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditModal(doc)}>
                              <Pencil className="w-3 h-3"/>
                              Modifier
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(doc.id)}>
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {hasExemplaires && (<TableRow className="bg-muted/30">
                          <TableCell colSpan={11} className="p-0">
                            <div className={detailWrapperClasses}>
                              <div className="px-6 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-700">
                                      {showAllExemplaires || showOnlyArchivedExemplaires || visibleExemplaires.length === exemplaires.length
                        ? `Exemplaires (${exemplaires.length})`
                        : `Exemplaires (${visibleExemplaires.length}/${exemplaires.length})`}
                                    </p>
                                    {archivedFilter === "active" && (<Badge variant="secondary">{availableCount} disponibles</Badge>)}
                                  </div>

                                  <Button size="sm" style={{ backgroundColor: "#147a40" }} onClick={() => openAddExemplairesModal(doc)}>
                                    Ajouter un exemplaire
                                  </Button>
                                </div>

                                <div className="rounded-md border bg-white">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-xs uppercase text-muted-foreground">
                                        <th className="py-2 pl-4">Code exemplaire</th>
                                        <th className="py-2">Statut</th>
                                        <th className="py-2">Emprunteur</th>
                                        <th className="py-2">Retour prévu</th>
                                        <th className="py-2">Date de création</th>
                                        <th className="py-2 pr-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {visibleExemplaires.length === 0 ? (<tr>
                                          <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                            {hasExemplaires
                            ? "Aucun exemplaire actif pour ce filtre."
                            : "Aucun exemplaire n'est disponible pour ce document."}
                                          </td>
                                        </tr>) : (visibleExemplaires.map((ex, index) => {
                        const statusLabel = ex.is_archived
                            ? "Archivé"
                            : ex.disponible
                                ? "Disponible"
                                : "Emprunté";
                        const variant = ex.is_archived
                            ? "secondary"
                            : ex.disponible
                                ? "default"
                                : "destructive";
                        const branch = index === visibleExemplaires.length - 1 ? "└──" : "├──";
                        const borrower = ex.current_emprunt?.emprunteur
                            ? `${ex.current_emprunt.emprunteur.nom} ${ex.current_emprunt.emprunteur.prenom}`
                            : null;
                        const dueDate = ex.current_emprunt?.date_retour_prevue ?? null;
                        const borrowerNote = ex.current_emprunt?.emprunteur?.email
                            ? `${borrower} (${ex.current_emprunt.emprunteur.email})`
                            : borrower;
                        return (<tr key={ex.id} className="border-t text-sm">
                                              <td className="py-3 pl-4 font-medium">
                                                <span className="mr-2 text-xs text-muted-foreground">{branch}</span>
                                                {ex.code_exemplaire}
                                              </td>
                                              <td className="py-3">
                                                <Badge variant={variant}>{statusLabel}</Badge>
                                              </td>
                                              <td className="py-3 text-xs">{borrowerNote ?? "—"}</td>
                                              <td className="py-3 text-xs">
                                                {dueDate ? (<span className={ex.current_emprunt?.en_retard ? "text-red-600 font-semibold" : ""}>
                                                    {dueDate}
                                                  </span>) : ("—")}
                                              </td>
                                              <td className="py-3 text-xs text-muted-foreground">{ex.date_creation ?? "—"}</td>
                                              <td className="py-3 pr-4">
                                                <div className="flex justify-end gap-1.5">
                                                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" disabled={!ex.disponible || deletingExemplaireId === ex.id} title={!ex.disponible
                                ? "Impossible de supprimer un exemplaire emprunté"
                                : "Supprimer l'exemplaire"} onClick={() => handleDeleteExemplaire(doc.id, ex)}>
                                                    {deletingExemplaireId === ex.id ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<Trash2 className="h-4 w-4"/>)}
                                                  </Button>

                                                  <Button variant="ghost" size="icon" className={ex.is_archived ? "text-emerald-600 hover:text-emerald-700" : "text-gray-600 hover:text-gray-800"} disabled={archivingExemplaireId === ex.id || (!ex.is_archived && !ex.disponible)} title={!ex.is_archived && !ex.disponible
                                ? "Impossible d'archiver un exemplaire emprunté"
                                : ex.is_archived
                                    ? "Restaurer l'exemplaire"
                                    : "Archiver l'exemplaire"} onClick={() => handleToggleArchive(doc.id, ex, !ex.is_archived)}>
                                                    {archivingExemplaireId === ex.id ? (<Loader2 className="h-4 w-4 animate-spin"/>) : ex.is_archived ? (<ArchiveRestore className="h-4 w-4"/>) : (<Archive className="h-4 w-4"/>)}
                                                  </Button>
                                                </div>
                                              </td>
                                            </tr>);
                    }))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </Fragment>);
        })}
                {filteredDocuments.length === 0 && (<TableRow>
                    <TableCell colSpan={12} className="text-center py-6 text-sm text-muted-foreground">
                      Aucun document ne correspond à votre recherche.
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(nextOpen) => {
            if (!nextOpen)
                closeModal();
        }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Modifier le document" : "Nouveau document"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input id="titre" placeholder="Titre du document" value={form.data.titre} onChange={(e) => form.setData("titre", e.target.value)} required/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Description du document" value={form.data.description} onChange={(e) => form.setData("description", e.target.value)}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_achat">Date d'achat</Label>
              <Input id="date_achat" type="date" value={form.data.date_achat ?? ""} onChange={(e) => form.setData("date_achat", e.target.value)}/>
            </div>

            <ComboInput label="Rayonnage" placeholder="Commencez à taper le rayonnage" options={rayonnageOptions} value={form.data.rayonnage_id} onChange={(value) => form.setData("rayonnage_id", value)}/>

            <ComboInput label="Catégorie" placeholder="Rechercher une catégorie" options={documentCategorieOptions} value={form.data.categorie_id} onChange={(value) => form.setData("categorie_id", value)} helperText={documentCategorieOptions.length === 0 && form.data.rayonnage_id
            ? "Aucune catégorie pour ce rayonnage."
            : undefined}/>

            <ComboInput label="Type" placeholder="Rechercher un type" options={typeOptions} value={form.data.type_id} onChange={(value) => form.setData("type_id", value)} helperText="Tapez pour filtrer immédiatement les types existants."/>

            <div className="flex items-start justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="is_archived">Archiver le document</Label>
                <p className="text-xs text-muted-foreground">
                  Les documents archivés ne seront plus proposés à l'emprunt.
                </p>
              </div>
              <input id="is_archived" type="checkbox" className="h-4 w-4 mt-1" checked={Boolean(form.data.is_archived)} onChange={(e) => form.setData("is_archived", e.target.checked)}/>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.processing} style={{ backgroundColor: "#147a40" }}>
                {form.processing ? "En cours..." : editingDocument ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(exemplaireModalDocument)} onOpenChange={(nextOpen) => {
            if (!nextOpen)
                closeAddExemplairesModal();
        }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="space-y-1">
              Ajouter des exemplaires
              {exemplaireModalDocument && (<span className="block text-sm font-normal text-muted-foreground">
                  {exemplaireModalDocument.titre}
                </span>)}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitExemplaires} className="space-y-5">
            <div className="space-y-2">
              <Label>Vos nouveaux exemplaires</Label>
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3">
                {exemplaireTags.map((tag, index) => (<span key={`${tag}-${index}`} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    {tag}
                    <button type="button" className="text-emerald-700 hover:text-emerald-900" onClick={() => removeTag(index)} aria-label="Supprimer le tag">
                      <X className="h-3.5 w-3.5"/>
                    </button>
                  </span>))}
                <input className="min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none" placeholder="Tapez et appuyez sur Entrée" value={tagInputValue} onChange={(event) => setTagInputValue(event.target.value)} onKeyDown={handleTagInputKeyDown} autoFocus/>
              </div>
              <p className="text-xs text-muted-foreground">
                Chaque tag correspond à un exemplaire qui sera généré automatiquement (maximum 50 à la fois).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
              <span className="text-muted-foreground">Quantité totale</span>
              <span className="font-semibold">{Math.max(1, exemplaireTags.length)}</span>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeAddExemplairesModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={addingExemplaires} style={{ backgroundColor: "#147a40" }}>
                {addingExemplaires ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  </div>);
}
