import Layout from '../Layouts/Layout';
import { useState } from "react";
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

interface LayoutProps {
  children: ReactNode;
}

interface Document {
  id: number;
  titre: string;
  description: string;
  disponible: boolean;
  dateCreation: string;
  dateModification: string;
  rayonnage_id: number;
  rayonnage: string;
  categorie_id: number;
  categorie: string;
  type_id: number;
  type: string;
}

interface DocumentsListProps {
  allDocuments: Document[];
}

const initialMockDocuments = [
  {
    id: 1,
    titre: "Introduction à l'informatique",
    description: "Un guide complet pour débutants",
    disponible: true,
    dateCreation: "2025-06-15",
    dateModification: "2025-12-20",
    rayonnage_id: 5,
    rayonnage: "Section E - Technologie",
    categorie_id: 5,
    categorie: "Technologie",
    type_id: 1,
    type: "Livre",
  },
  {
    id: 2,
    titre: "Histoire du Maroc",
    description: "L'histoire complète du royaume",
    disponible: true,
    dateCreation: "2025-07-10",
    dateModification: "2025-11-05",
    rayonnage_id: 2,
    rayonnage: "Section B - Histoire",
    categorie_id: 2,
    categorie: "Histoire",
    type_id: 1,
    type: "Livre",
  },
  {
    id: 3,
    titre: "Mathématiques avancées",
    description: "Algèbre et analyse",
    disponible: false,
    dateCreation: "2025-08-20",
    dateModification: "2025-12-30",
    rayonnage_id: 1,
    rayonnage: "Section A - Sciences",
    categorie_id: 1,
    categorie: "Sciences",
    type_id: 1,
    type: "Livre",
  },
  {
    id: 4,
    titre: "Physique quantique",
    description: "Introduction à la physique moderne",
    disponible: true,
    dateCreation: "2025-09-05",
    dateModification: "2026-01-02",
    rayonnage_id: 1,
    rayonnage: "Section A - Sciences",
    categorie_id: 1,
    categorie: "Sciences",
    type_id: 3,
    type: "Thèse",
  },
  {
    id: 5,
    titre: "Littérature française",
    description: "Grands classiques de la littérature",
    disponible: true,
    dateCreation: "2025-05-12",
    dateModification: "2025-10-18",
    rayonnage_id: 3,
    rayonnage: "Section C - Littérature",
    categorie_id: 3,
    categorie: "Littérature",
    type_id: 5,
    type: "E-book",
  },
];

// Mock data for filters
const mockRayonnages = [
  { id: 1, nom: "Section A - Sciences" },
  { id: 2, nom: "Section B - Histoire" },
  { id: 3, nom: "Section C - Littérature" },
  { id: 4, nom: "Section D - Arts" },
  { id: 5, nom: "Section E - Technologie" },
];

const mockCategories = [
  { id: 1, nom: "Sciences" },
  { id: 2, nom: "Histoire" },
  { id: 3, nom: "Littérature" },
  { id: 4, nom: "Arts" },
  { id: 5, nom: "Technologie" },
];

const mockTypes = [
  { id: 1, nom: "Livre" },
  { id: 2, nom: "Magazine" },
  { id: 3, nom: "Thèse" },
  { id: 4, nom: "DVD" },
  { id: 5, nom: "E-book" },
];

export function DocumentsList({allDocuments}:DocumentsListProps) {
  console.log(allDocuments)
  const [documents, setDocuments] = useState(allDocuments);
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
      const newId = Math.max(...documents.map(d => d.id)) + 1;
      const today = new Date().toISOString().split('T')[0];
      const newDocument = {
        id: newId,
        titre: formData.titre,
        description: formData.description,
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
      (doc.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (availabilityFilter === "all" || 
       (availabilityFilter === "disponible" && doc.disponible) ||
       (availabilityFilter === "emprunte" && !doc.disponible)) &&
      (rayonnageFilter === "all" || doc.rayonnage_id.toString() === rayonnageFilter) &&
      (categorieFilter === "all" || doc.categorie_id.toString() === categorieFilter) &&
      (typeFilter === "all" || doc.type_id.toString() === typeFilter)
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

