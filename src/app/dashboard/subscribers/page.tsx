"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscriberCard } from "@/components/subscribers/subscriber-card";
import { SubscriberFormDialog } from "@/components/subscribers/subscriber-form-dialog";
import { ImportCsvDialog } from "@/components/subscribers/import-csv-dialog";
import {
  Plus,
  Upload,
  Download,
  Search,
  Users,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { Subscriber } from "@/lib/schema";

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);

  // Load subscribers
  const loadSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter === "active") params.set("isActive", "true");
      if (statusFilter === "inactive") params.set("isActive", "false");

      const response = await fetch(`/api/subscribers?${params}`);
      if (!response.ok) throw new Error("Error loading subscribers");

      const data = await response.json();
      setSubscribers(data.subscribers);
      setTotal(data.total);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar suscriptores");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  // Load on mount and filter change
  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubscribers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadSubscribers]);

  // Export CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter === "active") params.set("isActive", "true");
      if (statusFilter === "inactive") params.set("isActive", "false");

      const response = await fetch(`/api/subscribers/export?${params}`);
      if (!response.ok) throw new Error("Error exporting");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suscriptores_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Archivo exportado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al exportar");
    }
  };

  // Handle subscriber edit
  const handleEdit = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setShowFormDialog(true);
  };

  // Handle subscriber delete
  const handleDelete = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    setTotal((prev) => prev - 1);
  };

  // Handle status change
  const handleStatusChange = (id: string, isActive: boolean) => {
    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive } : s))
    );
  };

  // Handle form success
  const handleFormSuccess = (subscriber: Subscriber) => {
    if (editingSubscriber) {
      // Update existing
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriber.id ? subscriber : s))
      );
    } else {
      // Add new
      setSubscribers((prev) => [subscriber, ...prev]);
      setTotal((prev) => prev + 1);
    }
    setEditingSubscriber(null);
  };

  // Calculate stats
  const activeCount = subscribers.filter((s) => s.isActive).length;
  const inactiveCount = subscribers.filter((s) => !s.isActive).length;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suscriptores</h1>
        <p className="text-gray-600">
          Gestiona los suscriptores del boletín por email
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserX className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveCount}</p>
              <p className="text-sm text-gray-500">Inactivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search and filter */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadSubscribers}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button
            onClick={() => {
              setEditingSubscriber(null);
              setShowFormDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Subscribers list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter !== "all"
                ? "No se encontraron suscriptores"
                : "No hay suscriptores"}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter !== "all"
                ? "Intenta con otros criterios de búsqueda"
                : "Agrega tu primer suscriptor o importa desde CSV"}
            </p>
            {!search && statusFilter === "all" && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </Button>
                <Button
                  onClick={() => {
                    setEditingSubscriber(null);
                    setShowFormDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            )}
          </div>
        ) : (
          subscribers.map((subscriber) => (
            <SubscriberCard
              key={subscriber.id}
              subscriber={subscriber}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>

      {/* Form dialog */}
      <SubscriberFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) setEditingSubscriber(null);
        }}
        subscriber={editingSubscriber}
        onSuccess={handleFormSuccess}
      />

      {/* Import dialog */}
      <ImportCsvDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={loadSubscribers}
      />
    </div>
  );
}
