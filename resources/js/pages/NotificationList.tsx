import { useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Search, Trash2, Check } from "lucide-react";

const initialMockNotifications = [
  {
    id: 1,
    emprunt_id: 3,
    message: "Retard de retour pour le document 'Mathématiques avancées'",
    dateCreation: "2026-01-01",
    lu: true,
  },
  {
    id: 2,
    emprunt_id: 1,
    message: "Rappel: Retour prévu dans 5 jours pour 'Introduction à l'informatique'",
    dateCreation: "2026-01-05",
    lu: false,
  },
  {
    id: 3,
    emprunt_id: 2,
    message: "Rappel: Retour prévu dans 2 jours pour 'Histoire du Maroc'",
    dateCreation: "2026-01-08",
    lu: false,
  },
  {
    id: 4,
    emprunt_id: 4,
    message: "Nouveau membre inscrit: Sara Amrani",
    dateCreation: "2026-01-09",
    lu: false,
  },
];

export function NotificationList() {
  const [notifications, setNotifications] = useState(initialMockNotifications);
  const [searchQuery, setSearchQuery] = useState("");

  const handleMarkAsRead = (id: number) => {
    const updatedNotifications = notifications.map(notif => 
      notif.id === id ? { ...notif, lu: true } : notif
    );
    setNotifications(updatedNotifications);
    console.log("Notification marquée comme lue:", id);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      setNotifications(notifications.filter(n => n.id !== id));
      console.log("Notification supprimée:", id);
    }
  };

  const filteredNotifications = notifications.filter((notif) =>
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <Badge variant="destructive" className="ml-auto">
              {notifications.filter(n => !n.lu).length} Non lues
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une notification..."
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
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notif) => (
                  <TableRow key={notif.id} className={!notif.lu ? "bg-blue-50" : ""}>
                    <TableCell>{notif.id}</TableCell>
                    <TableCell className="font-medium">{notif.message}</TableCell>
                    <TableCell>{notif.dateCreation}</TableCell>
                    <TableCell>
                      <Badge variant={notif.lu ? "secondary" : "default"}>
                        {notif.lu ? "Lue" : "Non lue"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!notif.lu && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notif.id)}
                            title="Marquer comme lue"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notif.id)}
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
    </div>
  );
}
