import Layout from '../Layouts/Layout';
import { useState, useMemo, useEffect } from "react";
// import type { ReactNode } from 'react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {router, useForm } from '@inertiajs/react';

// interface LayoutProps {
//   children: ReactNode;
// }

async function fetchData(url, mathod){
    const headers = { 
    Accept: "application/json",
    };
    const opts = { mathod, headers };
    const res = await fetch(url, opts);
    return await res.json();
};

function TypeDocumentList({mockTypeDocument}) {
  const [types, setTypes] = useState(mockTypeDocument);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const {data,setData, post, put, delete:formDelete} = useForm({
    nom: "",
    description: "",
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingType) {
      put(`/Type Documents/${editingType.id}`);
    } else {
      post('/Type Documents');
    }
    let data = await fetchData('/Type Documents/data','Get');
    setTypes(data);
    setOpen(false);
    setEditingType(null);
    setData({ nom: "", description: "" });
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setData({ nom: type.nom, description: type.description });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce type de document ?")) {
      formDelete(`/Type Documents/${id}`);
      let data = await fetchData('/Type Documents/data','Get');
      setTypes(data);
    }
  };

  const filteredTypes = types.filter(
    (type) =>
      type.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Types de Document</CardTitle>
            <Button className="gap-2" style={{ backgroundColor: "#147a40" }} onClick={() => {
              setEditingType(null);
              setData({ nom: "", description: "" });
              setOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Nouveau Type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un type de document..."
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
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.id}</TableCell>
                    <TableCell className="font-medium">{type.nom}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{type.dateCreation}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
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
            <DialogTitle>{editingType ? "Modifier le Type de Document" : "Nouveau Type de Document"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  placeholder="Nom du type de document"
                  value={data.nom}
                  onChange={(e) => setData({ ...data, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description du type de document"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" style={{ backgroundColor: "#147a40" }}>
              {editingType ? "Modifier" : "Ajouter"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}





// Assign the layout function to the Welcome component
TypeDocumentList.layout = (page) => <Layout children={page} />;

export default TypeDocumentList;

