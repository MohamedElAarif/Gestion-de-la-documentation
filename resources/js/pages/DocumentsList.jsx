import Layout from '../Layouts/Layout';
import { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {router, useForm } from '@inertiajs/react';

const ComboInput = ({
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

function DocumentsList({allDocuments, mockRayonnages,allCategories, mockTypes}) {
  const [documents, setDocuments] = useState(allDocuments);
  const [mockCategories, setMockCategories] = useState(allCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [rayonnageFilter, setRayonnageFilter] = useState("all");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("titre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const {data,  setData, post, processing} = useForm({
    titre: "",
    description: "",
  });
  console.log('cat');
  console.log(mockCategories);
  const openCreateModal = () => {
    setData({ titre: "", description: "" });
    setEditingDocument(null);
    setOpen(true);
  };

  const closeCreateModal = () => {
    setOpen(false);
  };

  const openEditModal = (document) => {
    setEditingDocument(document);
    setData({
      titre: document.titre,
      description: document.description,
    });
    setOpen(true);
  };

  const closeEditModal = () => {
    setOpen(false);
    setEditingDocument(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.titre.trim() === "" || data.description.trim() === "") {
      alert("Veuillez remplir tous les champs avant de soumettre.");
      return;
    }

    if (editingDocument) {
      const updatedDocuments = documents.map((doc) =>
        doc.id === editingDocument.id
          ? {
              ...doc,
              titre: data.titre,
              description: data.description,
              dateModification: new Date().toISOString().split("T")[0],
            }
          : doc
      );
      setDocuments(updatedDocuments);
      console.log("Document modifié:", data);
    } else {
      const newId = documents.length > 0 ? Math.max(...documents.map((d) => d.id)) + 1 : 1;
      const today = new Date().toISOString().split("T")[0];
      const newDocument = {
        id: newId,
        titre: data.titre,
        description: data.description,
        disponible: true,
        dateCreation: today,
        dateModification: today,
        rayonnage_id: 1,
        rayonnage: "Section A - Sciences",
        categorie_id: 1,
        categorie: "Sciences",
        type_id: 1,
        type: "Livre",
      };
      post('/Documents');
      window.location.reload();
      console.log("Nouveau document:", allDocuments);
    }
    closeCreateModal();
  };

  const handleEdit = (document) => {
    setEditingDocument(document);
    setData({
      titre: document.titre,
      description: document.description,
    });
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      setDocuments(documents.filter(d => d.id !== id));
      console.log("Document supprimé:", id);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const refreshDocumentsData = () => {
    router.reload({ only: ['allDocuments'] });
  };

  useEffect(()=>{
    if (rayonnageFilter === 'all') {
      setCategorieFilter('all');
      return setMockCategories(allCategories);
    }else {
      setCategorieFilter('all');
      return setMockCategories(allCategories.filter(cat => cat.rayonnage_id == rayonnageFilter));
    }
  },[rayonnageFilter,data.rayonnage,data.categories]);

  useEffect(() => {
    if (data.rayonnage_id === undefined || data.rayonnage_id === null) {
      setMockCategories(allCategories);
    } else {
      setMockCategories(allCategories.filter((cat) => cat.rayonnage_id === data.rayonnage_id));
    }
  }, [data.rayonnage_id, allCategories]);
  // Filter and sort documents
  let filteredDocuments = documents.filter(
    (doc) =>
      (doc.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (availabilityFilter === "all" || 
       (availabilityFilter === "disponible" && doc.disponible) ||
       (availabilityFilter === "emprunte" && !doc.disponible)) &&
      (rayonnageFilter === "all" || doc.categorie.rayonnage_id.toString() === rayonnageFilter) &&
      (categorieFilter === "all" || doc.categorie.id.toString() === categorieFilter) &&
      (typeFilter === "all" || doc.type_id.toString() === typeFilter)
  );

  // Sort documents
  filteredDocuments.sort((a, b) => {
    let aVal = a;
    let bVal = b;
    
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
console.log(rayonnageFilter)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Documents</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              Nouveau Document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="emprunte">Emprunté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Select value={rayonnageFilter} onValueChange={setRayonnageFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par rayonnage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rayonnages</SelectItem>
                {mockRayonnages.map((ray) => (
                  <SelectItem key={ray.id} value={ray.id.toString()}>
                    {ray.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {mockCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {mockTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("titre")} className="gap-1">
                      Titre <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rayonnage</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => toggleSort("dateCreation")} className="gap-1">
                      Date création <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Disponibilité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell className="font-medium">{doc.titre}</TableCell>
                    <TableCell>{doc.description}</TableCell>
                    <TableCell>{doc.categorie.rayonnage.nom}</TableCell>
                    <TableCell>{doc.categorie.nom}</TableCell>
                    <TableCell>{doc.type_document?.nom}</TableCell>
                    <TableCell>{doc.updated_at.split('T')[0]}</TableCell>
                    <TableCell>
                      <Badge variant={doc.disponible ? "default" : "destructive"}>
                        {doc.disponible ? "Disponible" : "Emprunté"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(doc)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={(open) => {
        setOpen(open);
        if (!open) closeEditModal();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Modifier le Document" : "Nouveau Document"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>

            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                placeholder="Titre du document"
                value={data.titre}
                onChange={(e) => setData({ ...data, titre: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description du document"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                required
              />
            </div>

            <ComboInput
              label="Rayonnage"
              placeholder="Chercher ou saisir un rayonnage"
              options={mockRayonnages.map((ray) => ({ id: ray.id, label: ray.nom }))}
              textValue={data.rayonnage || ""}
              selectedId={data.rayonnage_id?.toString() || ""}
              onTextChange={(value) => setData((prev) => ({ ...prev, rayonnage: value, rayonnage_id: undefined }))}
              onSelectOption={(option) => setData((prev) => ({ ...prev, rayonnage: option.label, rayonnage_id: option.id }))}
            />

            <ComboInput
              label="Catégorie"
              placeholder="Chercher ou saisir une catégorie"
              options={mockCategories.map((cat) => ({ id: cat.id, label: cat.nom }))}
              textValue={data.categorie || ""}
              selectedId={data.categorie_id?.toString() || ""}
              onTextChange={(value) => setData((prev) => ({ ...prev, categorie: value, categorie_id: undefined }))}
              onSelectOption={(option) => setData((prev) => ({ ...prev, categorie: option.label, categorie_id: option.id }))}
            />

            <ComboInput
              label="Type"
              placeholder="Chercher ou saisir un type"
              options={mockTypes.map((type) => ({ id: type.id, label: type.nom }))}
              textValue={data.type || ""}
              selectedId={data.type_id?.toString() || ""}
              onTextChange={(value) => setData((prev) => ({ ...prev, type: value, type_id: undefined }))}
              onSelectOption={(option) => setData((prev) => ({ ...prev, type: option.label, type_id: option.id }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeCreateModal}>Annuler</Button>
              <Button type="submit" disabled={processing}>{editingDocument ? "Modifier" : "Ajouter"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}




// Assign the layout function to the Welcome component
DocumentsList.layout = (page) => <Layout children={page} />;

export default DocumentsList;

