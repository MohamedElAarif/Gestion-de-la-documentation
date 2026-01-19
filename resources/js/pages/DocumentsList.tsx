import Layout from '../Layouts/Layout';
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Document {
  id: number;
  titre: string;
  description?: string | null;
  disponible: boolean;
  dateCreation?: string | null;
  dateModification?: string | null;
  rayonnage_id?: number | null;
  rayonnage?: string | null;
  categorie_id?: number | null;
  categorie?: string | null;
  type_id?: number | null;
  type?: string | null;
}

interface FilterOption {
  id: number;
  nom: string;
}

interface DocumentsListProps {
  allDocuments?: Document[];
  rayonnages?: FilterOption[];
  categories?: FilterOption[];
  types?: FilterOption[];
}

function deriveOptions(
  docs: Document[],
  idKey: keyof Document,
  nameKey: keyof Document
): FilterOption[] {
  const seen = new Map<number, string>();
  docs.forEach((doc) => {
    const identifier = doc[idKey];
    if (typeof identifier === "number" && !seen.has(identifier)) {
      const label = (doc[nameKey] as string | undefined)?.trim();
      if (label) {
        seen.set(identifier, label);
      }
    }
  });
  return Array.from(seen.entries()).map(([id, nom]) => ({ id, nom }));
}

export function DocumentsList({ allDocuments, rayonnages, categories, types }: DocumentsListProps) {
  const initialDocuments = useMemo(() => (Array.isArray(allDocuments) ? allDocuments : []), [allDocuments]);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [rayonnageFilter, setRayonnageFilter] = useState("all");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("titre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
  });

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const rayonnageOptions = useMemo(() => {
    if (Array.isArray(rayonnages) && rayonnages.length > 0) {
      return rayonnages;
    }
    return deriveOptions(initialDocuments, "rayonnage_id", "rayonnage");
  }, [rayonnages, initialDocuments]);

  const categorieOptions = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      return categories;
    }
    return deriveOptions(initialDocuments, "categorie_id", "categorie");
  }, [categories, initialDocuments]);

  const typeOptions = useMemo(() => {
    if (Array.isArray(types) && types.length > 0) {
      return types;
    }
    return deriveOptions(initialDocuments, "type_id", "type");
  }, [types, initialDocuments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDocument) {
      // Update existing document
      const updatedDocuments = documents.map(doc => 
        doc.id === editingDocument.id 
          ? { 
              ...doc, 
              titre: formData.titre,
              description: formData.description,
              dateModification: new Date().toISOString().split('T')[0]
            }
          : doc
      );
      setDocuments(updatedDocuments);
      console.log("Document modifié:", formData);
    } else {
      // Add new document
      const maxId = documents.reduce((max, doc) => (doc.id > max ? doc.id : max), 0);
      const newId = maxId + 1;
      const today = new Date().toISOString().split('T')[0];
      const defaultRayonnage = rayonnageOptions[0];
      const defaultCategorie = categorieOptions[0];
      const defaultType = typeOptions[0];
      const newDocument = {
        id: newId,
        titre: formData.titre,
        description: formData.description,
        disponible: true,
        dateCreation: today,
        dateModification: today,
        rayonnage_id: defaultRayonnage?.id ?? null,
        rayonnage: defaultRayonnage?.nom ?? '',
        categorie_id: defaultCategorie?.id ?? null,
        categorie: defaultCategorie?.nom ?? '',
        type_id: defaultType?.id ?? null,
        type: defaultType?.nom ?? '',
      };
      setDocuments([...documents, newDocument]);
      console.log("Nouveau document:", newDocument);
    }
    setOpen(false);
    setEditingDocument(null);
    setFormData({ titre: "", description: "" });
  };

  const handleEdit = (document: any) => {
    setEditingDocument(document);
    setFormData({
      titre: document.titre,
      description: document.description,
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      setDocuments(documents.filter(d => d.id !== id));
      console.log("Document supprimé:", id);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter and sort documents
  let filteredDocuments = documents.filter(
    (doc) =>
    ((doc.titre ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())) &&
      (availabilityFilter === "all" || 
       (availabilityFilter === "disponible" && doc.disponible) ||
       (availabilityFilter === "emprunte" && !doc.disponible)) &&
    (rayonnageFilter === "all" || (doc.rayonnage_id ?? '').toString() === rayonnageFilter) &&
    (categorieFilter === "all" || (doc.categorie_id ?? '').toString() === categorieFilter) &&
    (typeFilter === "all" || (doc.type_id ?? '').toString() === typeFilter)
  );

  // Sort documents
  filteredDocuments.sort((a, b) => {
    let aVal: any = a[sortBy as keyof typeof a];
    let bVal: any = b[sortBy as keyof typeof b];
    
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Documents</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={() => {
              setEditingDocument(null);
              setFormData({ titre: "", description: "" });
              setOpen(true);
            }}>
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
                {rayonnageOptions.map((ray) => (
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
                {categorieOptions.map((cat) => (
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
                {typeOptions.map((type) => (
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
                    <TableCell>{doc.description ?? '—'}</TableCell>
                    <TableCell>{doc.rayonnage ?? '—'}</TableCell>
                    <TableCell>{doc.categorie ?? '—'}</TableCell>
                    <TableCell>{doc.type ?? '—'}</TableCell>
                    <TableCell>{doc.dateCreation ?? '—'}</TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Modifier le Document" : "Nouveau Document"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre</Label>
                <Input
                  id="titre"
                  placeholder="Titre du document"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description du document"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" style={{ backgroundColor: "#147a40" }}>
              {editingDocument ? "Modifier" : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}




// Assign the layout function to the Welcome component
DocumentsList.layout = (page: ReactNode) => <Layout children={page} />;

export default DocumentsList;

