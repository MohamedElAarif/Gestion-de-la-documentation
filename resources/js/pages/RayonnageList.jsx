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
import { router, useForm } from '@inertiajs/react';


async function fetchData(url, mathod) {
  const headers = {
    Accept: "application/json",
  };
  const opts = { mathod, headers };
  const res = await fetch(url, opts);
  return await res.json();
}

function RayonnageList({ mockRayonnage }) {
  const [rayonnages, setRayonnages] = useState(mockRayonnage);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRayonnage, setEditingRayonnage] = useState(null);
  const { data, setData, post, put, delete: formDelete } = useForm({
    nom: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRayonnage) {
      put(`/Rayonnages/${editingRayonnage.id}`);
    } else {
      post('/Rayonnages')
    }
    let data = await fetchData('/Rayonnages/data', 'Get');
    setRayonnages(data);
    setOpen(false);
    setEditingRayonnage(null);
    setData({ nom: "" });
  };

  const handleEdit = (rayonnage) => {
    setEditingRayonnage(rayonnage);
    setData({ nom: rayonnage.nom });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rayonnage ?")) {
      formDelete(`/Rayonnages/${id}`);
      let data = await fetchData(`/Rayonnages/data`, 'Get');
      setRayonnages(data);
    }
  };

  const filteredRayonnage = rayonnages.filter((ray) =>
    ray.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Rayonnages</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={() => {
              setEditingRayonnage(null);
              setData({ nom: "" });
              setOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Nouveau Rayonnage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un rayonnage..."
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
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRayonnage.map((ray) => (
                  <TableRow key={ray.id}>
                    <TableCell>{ray.id}</TableCell>
                    <TableCell className="font-medium">{ray.nom}</TableCell>
                    <TableCell>{ray.dateCreation}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ray)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ray.id)}
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
            <DialogTitle>{editingRayonnage ? "Modifier le Rayonnage" : "Nouveau Rayonnage"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom du rayonnage"
                  value={data.nom}
                  onChange={(e) => setData({ ...data, nom: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" style={{ backgroundColor: "#147a40" }}>
              {editingRayonnage ? "Modifier" : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



export default RayonnageList;

