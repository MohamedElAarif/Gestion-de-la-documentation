import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { router, useForm } from '@inertiajs/react';

async function fetchData(url, mathod) {
  const headers = {
    Accept: "application/json",
  };
  const opts = { mathod, headers };
  const res = await fetch(url, opts);
  return await res.json();
}

export function CategorieList({ mockCategorie, rayonnages }) {
  const [categories, setCategories] = useState(mockCategorie);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState(null);
  const { data, setData, post, put, delete: formDelete } = useForm({
    nom: "",
    description: "",
    rayonnage_id: rayonnages && rayonnages.length > 0 ? rayonnages[0].id.toString() : "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCategorie) {
      put(`/Categories/${editingCategorie.id}`);
    } else {
      post('/Categories');
    }
    let data = await fetchData('/Categories/data', 'Get');
    setCategories(data);
    setOpen(false);
    setEditingCategorie(null);
    setData({ nom: "", description: "", rayonnage_id: rayonnages && rayonnages.length > 0 ? rayonnages[0].id.toString() : "" });
  };

  const handleEdit = (categorie) => {
    setEditingCategorie(categorie);
    setData({ nom: categorie.nom, description: categorie.description, rayonnage_id: categorie.rayonnage_id.toString() });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      formDelete(`/Categories/${id}`);
    }
    let data = await fetchData('/Categories/data', 'Get');
    setCategories(data);
  };

  const filteredCategories = categories.filter((cat) => {
    return cat.nom.toLowerCase().includes(searchQuery.toLowerCase()) || cat.description.toLowerCase().includes(searchQuery.toLowerCase());
  }
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Catégories</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={() => {
              setEditingCategorie(null);
              setData({ nom: "", description: "", rayonnage_id: rayonnages && rayonnages.length > 0 ? rayonnages[0].id.toString() : "" });
              setOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Nouvelle Catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Rayonnage</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.id}</TableCell>
                    <TableCell className="font-medium">{cat.nom}</TableCell>
                    <TableCell>{cat.description}</TableCell>
                    <TableCell>{rayonnages?.find(r => r.id === cat.rayonnage_id)?.nom || '-'}</TableCell>
                    <TableCell>{cat.date_creation}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cat)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat.id)}
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
            <DialogTitle>{editingCategorie ? "Modifier la Catégorie" : "Nouvelle Catégorie"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom de la catégorie"
                  value={data.nom}
                  onChange={(e) => setData({ ...data, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description de la catégorie"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rayonnage_id">Rayonnage</Label>
                <Select value={data.rayonnage_id} onValueChange={(value) => setData({ ...data, rayonnage_id: value })}>
                  <SelectTrigger id="rayonnage_id">
                    <SelectValue placeholder="Sélectionner un rayonnage" />
                  </SelectTrigger>
                  <SelectContent>
                    {rayonnages && rayonnages.map((rayonnage) => (
                      <SelectItem key={rayonnage.id} value={rayonnage.id.toString()}>
                        {rayonnage.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" style={{ backgroundColor: "#147a40" }}>
              {editingCategorie ? "Modifier" : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default CategorieList;

