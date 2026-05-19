"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react"; 

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  type: "superuser" | "employee";
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirm: "", 
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [employeeToDismiss, setEmployeeToDismiss] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await apiFetch("/admin/employees/list");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Insufficient permissions to view this page");
        }
        throw new Error("Failed to load employee data");
      }
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    if (formData.password !== formData.password_confirm) {
      setFormError("The passwords don't match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch("/admin/employees/create/", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          password_confirm: formData.password_confirm, 
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          phone: formData.phone || null,
        }),
      });

      const text = await response.text();
      let result;
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.ok) {
        if (result && typeof result === "object") {
          const firstKey = Object.keys(result)[0];
          if (firstKey) {
            const errorMsg = Array.isArray(result[firstKey]) ? result[firstKey][0] : JSON.stringify(result[firstKey]);
            throw new Error(`${firstKey}: ${errorMsg}`);
          }
        }
        throw new Error(result.detail || "Failed to create employee");
      }

      await fetchEmployees();
      setIsDialogOpen(false);
      setFormData({ email: "", password: "", password_confirm: "", first_name: "", last_name: "", phone: "" });
      toast.success("The employee has been successfully added");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDismissConfirm = (emp: Employee) => {
    setEmployeeToDismiss(emp);
    setIsConfirmOpen(true);
  };

  const handleExecuteDismiss = async () => {
    if (!employeeToDismiss) return;
    const targetId = employeeToDismiss.id;
    const targetEmail = employeeToDismiss.email;

    try {
      const response = await apiFetch(`/admin/employees/${targetId}/dismiss/`, {
        method: "POST",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || "Failed to dismiss employee");
      }

      setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== targetId));
      toast.success(`Employee ${targetEmail} has been successfully dismissed`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsConfirmOpen(false);
      setEmployeeToDismiss(null);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Loading staff records...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-medium">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Organizational structure and personnel management</p>
        </div>

        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              New Employee
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-card text-card-foreground rounded-lg border border-border shadow-lg z-50 focus:outline-none">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold tracking-tight">Add New Employee</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-muted-foreground hover:text-foreground rounded-sm p-1 cursor-pointer transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
              
              <Dialog.Description className="text-sm text-muted-foreground mb-4">
                Create a new staff account. Password and email are strictly required.
              </Dialog.Description>

              {formError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                    placeholder="john.doe@company.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Confirm Password *</label>
                    <input
                      type="password"
                      name="password_confirm"
                      required
                      value={formData.password_confirm}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none"
                    placeholder="+7 (707) 123-4567"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium border border-input bg-background rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Save Employee"}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="rounded-md border border-border bg-card text-card-foreground overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
              <th className="p-4">Employee Type</th>
              <th className="p-4">First Name</th>
              <th className="p-4">Last Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No records found in the employees table.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-4 font-medium uppercase tracking-wider text-xs">
                    <span className={emp.type === "superuser" ? "text-destructive" : "text-primary"}>
                      {emp.type}
                    </span>
                  </td>
                  <td className="p-4">{emp.first_name || "—"}</td>
                  <td className="p-4">{emp.last_name || "—"}</td>
                  <td className="p-4 text-muted-foreground">{emp.email}</td>
                  <td className="p-4 text-muted-foreground">{emp.phone || "—"}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => triggerDismissConfirm(emp)}
                      className="px-3 py-1.5 text-xs font-medium bg-transparent text-destructive border border-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss employee <strong>{employeeToDismiss?.email}</strong>? 
              Corporate service access and active sessions will be revoked immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDismiss}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Dismiss Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}