import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useMemo, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import Layout from "../Layouts/Layout";
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
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: label }), _jsxs("div", { className: "relative", children: [_jsx(Input, { placeholder: placeholder, value: textValue, onChange: (event) => {
                            setTextValue(event.target.value);
                            setIsOpen(true);
                        }, onFocus: () => setIsOpen(true), onBlur: () => {
                            window.setTimeout(() => setIsOpen(false), 150);
                        }, onKeyDown: (event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                const first = suggestions[0];
                                if (first)
                                    handleSelect(first);
                            }
                        } }), isOpen && (_jsx("div", { className: "absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow", children: suggestions.length === 0 ? (_jsx("div", { className: "px-3 py-2 text-sm text-muted-foreground", children: "Aucun r\u00E9sultat" })) : (suggestions.map((option) => (_jsxs("button", { type: "button", className: "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted", onMouseDown: (event) => event.preventDefault(), onClick: () => handleSelect(option), children: [_jsx("span", { children: option.nom }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["#", option.id] })] }, option.id)))) }))] }), helperText && _jsx("p", { className: "text-xs text-muted-foreground", children: helperText })] }));
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
        setExpandedRows({});
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Gestion des Documents" }), _jsxs(Button, { className: "gap-2", style: { backgroundColor: "#147a40" }, onClick: openCreateModal, children: [_jsx(Plus, { className: "w-4 h-4" }), "Nouveau Document"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Rechercher un document...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter') {
                                                        const first = filteredDocuments[0];
                                                        if (first)
                                                            openEditModal(first);
                                                    }
                                                }, className: "pl-10" })] }), _jsxs(Select, { value: availabilityFilter, onValueChange: setAvailabilityFilter, children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Disponibilit\u00E9" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous" }), _jsx(SelectItem, { value: "disponible", children: "Disponible" }), _jsx(SelectItem, { value: "emprunte", children: "Emprunt\u00E9" })] })] }), _jsxs(Select, { value: archivedFilter, onValueChange: setArchivedFilter, children: [_jsx(SelectTrigger, { className: "w-[220px]", children: _jsx(SelectValue, { placeholder: "Statut" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Actifs" }), _jsx(SelectItem, { value: "with_archived_exemplaires", children: "Actifs avec exemplaire archiv\u00E9" }), _jsx(SelectItem, { value: "archived", children: "Documents archiv\u00E9s" }), _jsx(SelectItem, { value: "all", children: "Tous les statuts" })] })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs(Select, { value: rayonnageFilter, onValueChange: handleRayonnageFilterChange, children: [_jsx(SelectTrigger, { className: "flex-1", children: _jsx(SelectValue, { placeholder: "Filtrer par rayonnage" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous les rayonnages" }), rayonnageOptions.map((ray) => (_jsx(SelectItem, { value: ray.id.toString(), children: ray.nom }, ray.id)))] })] }), _jsxs(Select, { value: categorieFilter, onValueChange: setCategorieFilter, disabled: visibleCategorieOptions.length === 0 && rayonnageFilter !== "all", children: [_jsx(SelectTrigger, { className: "flex-1", children: _jsx(SelectValue, { placeholder: "Filtrer par cat\u00E9gorie" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Toutes les cat\u00E9gories" }), visibleCategorieOptions.length === 0 && rayonnageFilter !== "all" ? (_jsx(SelectItem, { value: "none", disabled: true, children: "Aucune cat\u00E9gorie disponible" })) : (visibleCategorieOptions.map((cat) => (_jsx(SelectItem, { value: cat.id.toString(), children: cat.nom }, cat.id))))] })] }), _jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [_jsx(SelectTrigger, { className: "flex-1", children: _jsx(SelectValue, { placeholder: "Filtrer par type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "Tous les types" }), typeOptions.map((type) => (_jsx(SelectItem, { value: type.id.toString(), children: type.nom }, type.id)))] })] })] }), _jsx(Input, { placeholder: "Recherche avanc\u00E9e (rayonnage, cat\u00E9gorie, type...)", value: structureQuery, onChange: (e) => setStructureQuery(e.target.value), className: "w-full" }), _jsx("div", { className: "rounded-md border", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-10" }), _jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort("titre"), className: "gap-1", children: ["Titre ", _jsx(ArrowUpDown, { className: "w-3 h-3" })] }) }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Rayonnage" }), _jsx(TableHead, { children: "Cat\u00E9gorie" }), _jsx(TableHead, { children: "Type" }), _jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort("dateAchat"), className: "gap-1", children: ["Date d'achat ", _jsx(ArrowUpDown, { className: "w-3 h-3" })] }) }), _jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort("dateCreation"), className: "gap-1", children: ["Date cr\u00E9ation ", _jsx(ArrowUpDown, { className: "w-3 h-3" })] }) }), _jsx(TableHead, { children: "Disponibilit\u00E9" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsxs(TableBody, { children: [filteredDocuments.map((doc) => {
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
                                                    return (_jsxs(Fragment, { children: [_jsxs(TableRow, { children: [_jsx(TableCell, { children: hasExemplaires ? (_jsx("button", { type: "button", onClick: () => toggleRow(doc.id), className: toggleClasses, "aria-label": "Afficher les exemplaires", "aria-expanded": expanded, children: expanded ? (_jsx(ChevronDown, { className: "w-4 h-4" })) : (_jsx(ChevronRight, { className: "w-4 h-4" })) })) : null }), _jsx(TableCell, { children: doc.id }), _jsx(TableCell, { className: "font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [doc.titre, doc.is_archived && _jsx(Badge, { variant: "outline", children: "Archiv\u00E9" })] }) }), _jsx(TableCell, { children: doc.description ?? "—" }), _jsx(TableCell, { children: doc.rayonnage ?? "—" }), _jsx(TableCell, { children: doc.categorie ?? "—" }), _jsx(TableCell, { children: doc.type ?? "—" }), _jsx(TableCell, { children: doc.dateAchat ?? "—" }), _jsx(TableCell, { children: doc.dateCreation ?? "—" }), _jsx(TableCell, { children: _jsx(Badge, { variant: availableCount > 0 ? "default" : "destructive", children: archivedFilter === "active"
                                                                                ? `${availableCount} / ${nonArchivedCount}`
                                                                                : availableCount }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [!hasExemplaires && (_jsxs(Button, { size: "sm", className: "gap-1", style: { backgroundColor: "#147a40" }, onClick: () => openAddExemplairesModal(doc), children: [_jsx(Plus, { className: "w-3 h-3" }), "Ajouter un exemplaire"] })), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-1", onClick: () => openEditModal(doc), children: [_jsx(Pencil, { className: "w-3 h-3" }), "Modifier"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-red-600 hover:text-red-700", onClick: () => handleDelete(doc.id), children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }), hasExemplaires && (_jsx(TableRow, { className: "bg-muted/30", children: _jsx(TableCell, { colSpan: 11, className: "p-0", children: _jsx("div", { className: detailWrapperClasses, children: _jsxs("div", { className: "px-6 space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-gray-700", children: showAllExemplaires || showOnlyArchivedExemplaires || visibleExemplaires.length === exemplaires.length
                                                                                                        ? `Exemplaires (${exemplaires.length})`
                                                                                                        : `Exemplaires (${visibleExemplaires.length}/${exemplaires.length})` }), archivedFilter === "active" && (_jsxs(Badge, { variant: "secondary", children: [availableCount, " disponibles"] }))] }), _jsx(Button, { size: "sm", style: { backgroundColor: "#147a40" }, onClick: () => openAddExemplairesModal(doc), children: "Ajouter un exemplaire" })] }), _jsx("div", { className: "rounded-md border bg-white", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-xs uppercase text-muted-foreground", children: [_jsx("th", { className: "py-2 pl-4", children: "Code exemplaire" }), _jsx("th", { className: "py-2", children: "Statut" }), _jsx("th", { className: "py-2", children: "Emprunteur" }), _jsx("th", { className: "py-2", children: "Retour pr\u00E9vu" }), _jsx("th", { className: "py-2", children: "Date de cr\u00E9ation" }), _jsx("th", { className: "py-2 pr-4 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: visibleExemplaires.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "py-6 text-center text-sm text-muted-foreground", children: hasExemplaires
                                                                                                            ? "Aucun exemplaire actif pour ce filtre."
                                                                                                            : "Aucun exemplaire n'est disponible pour ce document." }) })) : (visibleExemplaires.map((ex, index) => {
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
                                                                                                    return (_jsxs("tr", { className: "border-t text-sm", children: [_jsxs("td", { className: "py-3 pl-4 font-medium", children: [_jsx("span", { className: "mr-2 text-xs text-muted-foreground", children: branch }), ex.code_exemplaire] }), _jsx("td", { className: "py-3", children: _jsx(Badge, { variant: variant, children: statusLabel }) }), _jsx("td", { className: "py-3 text-xs", children: borrowerNote ?? "—" }), _jsx("td", { className: "py-3 text-xs", children: dueDate ? (_jsx("span", { className: ex.current_emprunt?.en_retard ? "text-red-600 font-semibold" : "", children: dueDate })) : ("—") }), _jsx("td", { className: "py-3 text-xs text-muted-foreground", children: ex.date_creation ?? "—" }), _jsx("td", { className: "py-3 pr-4", children: _jsxs("div", { className: "flex justify-end gap-1.5", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "text-red-600 hover:text-red-700", disabled: !ex.disponible || deletingExemplaireId === ex.id, title: !ex.disponible
                                                                                                                                ? "Impossible de supprimer un exemplaire emprunté"
                                                                                                                                : "Supprimer l'exemplaire", onClick: () => handleDeleteExemplaire(doc.id, ex), children: deletingExemplaireId === ex.id ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Trash2, { className: "h-4 w-4" })) }), _jsx(Button, { variant: "ghost", size: "icon", className: ex.is_archived ? "text-emerald-600 hover:text-emerald-700" : "text-gray-600 hover:text-gray-800", disabled: archivingExemplaireId === ex.id || (!ex.is_archived && !ex.disponible), title: !ex.is_archived && !ex.disponible
                                                                                                                                ? "Impossible d'archiver un exemplaire emprunté"
                                                                                                                                : ex.is_archived
                                                                                                                                    ? "Restaurer l'exemplaire"
                                                                                                                                    : "Archiver l'exemplaire", onClick: () => handleToggleArchive(doc.id, ex, !ex.is_archived), children: archivingExemplaireId === ex.id ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : ex.is_archived ? (_jsx(ArchiveRestore, { className: "h-4 w-4" })) : (_jsx(Archive, { className: "h-4 w-4" })) })] }) })] }, ex.id));
                                                                                                })) })] }) })] }) }) }) }))] }, doc.id));
                                                }), filteredDocuments.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 12, className: "text-center py-6 text-sm text-muted-foreground", children: "Aucun document ne correspond \u00E0 votre recherche." }) }))] })] }) })] })] }), _jsx(Dialog, { open: open, onOpenChange: (nextOpen) => {
                    if (!nextOpen)
                        closeModal();
                }, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingDocument ? "Modifier le document" : "Nouveau document" }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "titre", children: "Titre" }), _jsx(Input, { id: "titre", placeholder: "Titre du document", value: form.data.titre, onChange: (e) => form.setData("titre", e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Input, { id: "description", placeholder: "Description du document", value: form.data.description, onChange: (e) => form.setData("description", e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "date_achat", children: "Date d'achat" }), _jsx(Input, { id: "date_achat", type: "date", value: form.data.date_achat ?? "", onChange: (e) => form.setData("date_achat", e.target.value) })] }), _jsx(ComboInput, { label: "Rayonnage", placeholder: "Commencez \u00E0 taper le rayonnage", options: rayonnageOptions, value: form.data.rayonnage_id, onChange: (value) => form.setData("rayonnage_id", value) }), _jsx(ComboInput, { label: "Cat\u00E9gorie", placeholder: "Rechercher une cat\u00E9gorie", options: documentCategorieOptions, value: form.data.categorie_id, onChange: (value) => form.setData("categorie_id", value), helperText: documentCategorieOptions.length === 0 && form.data.rayonnage_id
                                        ? "Aucune catégorie pour ce rayonnage."
                                        : undefined }), _jsx(ComboInput, { label: "Type", placeholder: "Rechercher un type", options: typeOptions, value: form.data.type_id, onChange: (value) => form.setData("type_id", value), helperText: "Tapez pour filtrer imm\u00E9diatement les types existants." }), _jsxs("div", { className: "flex items-start justify-between rounded-md border p-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "is_archived", children: "Archiver le document" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Les documents archiv\u00E9s ne seront plus propos\u00E9s \u00E0 l'emprunt." })] }), _jsx("input", { id: "is_archived", type: "checkbox", className: "h-4 w-4 mt-1", checked: Boolean(form.data.is_archived), onChange: (e) => form.setData("is_archived", e.target.checked) })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: closeModal, children: "Annuler" }), _jsx(Button, { type: "submit", disabled: form.processing, style: { backgroundColor: "#147a40" }, children: form.processing ? "En cours..." : editingDocument ? "Modifier" : "Ajouter" })] })] })] }) }), _jsx(Dialog, { open: Boolean(exemplaireModalDocument), onOpenChange: (nextOpen) => {
                    if (!nextOpen)
                        closeAddExemplairesModal();
                }, children: _jsxs(DialogContent, { className: "sm:max-w-[520px]", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "space-y-1", children: ["Ajouter des exemplaires", exemplaireModalDocument && (_jsx("span", { className: "block text-sm font-normal text-muted-foreground", children: exemplaireModalDocument.titre }))] }) }), _jsxs("form", { onSubmit: handleSubmitExemplaires, className: "space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Vos nouveaux exemplaires" }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3", children: [exemplaireTags.map((tag, index) => (_jsxs("span", { className: "flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800", children: [tag, _jsx("button", { type: "button", className: "text-emerald-700 hover:text-emerald-900", onClick: () => removeTag(index), "aria-label": "Supprimer le tag", children: _jsx(X, { className: "h-3.5 w-3.5" }) })] }, `${tag}-${index}`))), _jsx("input", { className: "min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none", placeholder: "Tapez et appuyez sur Entr\u00E9e", value: tagInputValue, onChange: (event) => setTagInputValue(event.target.value), onKeyDown: handleTagInputKeyDown, autoFocus: true })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Chaque tag correspond \u00E0 un exemplaire qui sera g\u00E9n\u00E9r\u00E9 automatiquement (maximum 50 \u00E0 la fois)." })] }), _jsxs("div", { className: "flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Quantit\u00E9 totale" }), _jsx("span", { className: "font-semibold", children: Math.max(1, exemplaireTags.length) })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: closeAddExemplairesModal, children: "Annuler" }), _jsx(Button, { type: "submit", disabled: addingExemplaires, style: { backgroundColor: "#147a40" }, children: addingExemplaires ? "Ajout en cours..." : "Ajouter" })] })] })] }) })] }));
}
DocumentsList.layout = (page) => _jsx(Layout, { children: page });
