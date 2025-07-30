"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientFormData>();

  useEffect(() => {
    fetchClients();
  }, []);

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredClients(filtered);
  };

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, filterClients]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Set sample data for demo
      setClients([
        {
          id: '1',
          name: 'Acme Corporation',
          email: 'billing@acme.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business St, City, State 12345',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Tech Solutions Inc',
          email: 'accounts@techsolutions.com',
          phone: '+1 (555) 987-6543',
          address: '456 Tech Ave, City, State 67890',
          createdAt: '2024-01-20'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const clientData = await response.json();
        
        if (editingClient) {
          setClients(clients.map(client => 
            client.id === editingClient.id ? { ...clientData, createdAt: client.createdAt } : client
          ));
        } else {
          setClients([clientData, ...clients]);
        }
        
        setIsDialogOpen(false);
        reset();
        setEditingClient(null);
      }
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('phone', client.phone || '');
    setValue('address', client.address || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setClients(clients.filter(client => client.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    reset();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
            Clients
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Manage your client information and contacts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? 'Update the client information below.'
                  : 'Fill in the client information below.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? 'Update Client' : 'Add Client'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Clients ({filteredClients.length})
          </CardTitle>
          <CardDescription>
            A list of all your clients and their contact information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.address ? (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{client.address}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No address</span>
                    )}
                  </TableCell>
                  <TableCell>{client.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
                No clients found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "Get started by adding your first client."
                }
              </p>
              {!searchTerm && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 