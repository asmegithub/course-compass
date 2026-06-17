import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Trash2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  createPermission,
  createRole,
  createRolePermission,
  deletePermission,
  deleteRole,
  deleteRolePermission,
  getPermissions,
  getRolePermissions,
  getRoles,
  type RbacPermission,
  type RbacRole,
} from "@/lib/admin-api";

const AdminRbac = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newRole, setNewRole] = useState({
    name: "",
    displayName: "",
    description: "",
  });
  const [newPermission, setNewPermission] = useState({
    name: "",
    displayName: "",
    module: "",
    description: "",
  });
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const rolesQuery = useQuery({
    queryKey: ["admin-rbac-roles"],
    queryFn: getRoles,
  });
  const permissionsQuery = useQuery({
    queryKey: ["admin-rbac-permissions"],
    queryFn: getPermissions,
  });
  const rolePermissionsQuery = useQuery({
    queryKey: ["admin-rbac-role-permissions"],
    queryFn: getRolePermissions,
  });

  const roles = rolesQuery.data ?? [];
  const permissions = permissionsQuery.data ?? [];
  const rolePermissions = rolePermissionsQuery.data ?? [];

  const roleById = useMemo(
    () => new Map(roles.map((role) => [role.id, role])),
    [roles],
  );
  const permissionById = useMemo(
    () => new Map(permissions.map((permission) => [permission.id, permission])),
    [permissions],
  );
  const groupedAssignments = useMemo(() => {
    const byRole = new Map<
      string,
      {
        roleId: string;
        roleName: string;
        roleDisplayName: string;
        roleIsSystem: boolean;
        permissions: Array<{
          mappingId: string;
          permissionId: string;
          permissionName: string;
          permissionDisplayName: string;
          module: string;
        }>;
      }
    >();

    for (const mapping of rolePermissions) {
      const roleId = mapping.role?.id ?? "";
      const permissionId = mapping.permission?.id ?? "";
      if (!roleId || !permissionId) continue;

      const role = roleById.get(roleId);
      const permission = permissionById.get(permissionId);
      const existing = byRole.get(roleId) ?? {
        roleId,
        roleName: role?.name || roleId,
        roleDisplayName: role?.displayName || role?.name || roleId,
        roleIsSystem: Boolean(role?.isSystem),
        permissions: [],
      };

      if (!existing.permissions.some((item) => item.permissionId === permissionId)) {
        existing.permissions.push({
          mappingId: mapping.id,
          permissionId,
          permissionName: permission?.name || permissionId,
          permissionDisplayName: permission?.displayName || permission?.name || permissionId,
          module: permission?.module || "GENERAL",
        });
      }

      byRole.set(roleId, existing);
    }

    return Array.from(byRole.values()).sort((left, right) =>
      left.roleDisplayName.localeCompare(right.roleDisplayName),
    );
  }, [permissionById, roleById, rolePermissions]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-rbac-roles"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-rbac-permissions"] }),
      queryClient.invalidateQueries({
        queryKey: ["admin-rbac-role-permissions"],
      }),
    ]);
  };

  const createRoleMutation = useMutation({
    mutationFn: (payload: Partial<RbacRole>) => createRole(payload),
    onSuccess: async () => {
      setNewRole({ name: "", displayName: "", description: "" });
      await refreshAll();
      toast({ title: "Role created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create role",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: async () => {
      await refreshAll();
      toast({ title: "Role deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete role",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPermissionMutation = useMutation({
    mutationFn: (payload: Partial<RbacPermission>) => createPermission(payload),
    onSuccess: async () => {
      setNewPermission({
        name: "",
        displayName: "",
        module: "",
        description: "",
      });
      await refreshAll();
      toast({ title: "Permission created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create permission",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: string) => deletePermission(permissionId),
    onSuccess: async () => {
      await refreshAll();
      toast({ title: "Permission deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete permission",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const assignPermissionMutation = useMutation({
    mutationFn: async (payload: { roleId: string; permissionIds: string[] }) => {
      const uniqueIds = Array.from(new Set(payload.permissionIds)).filter(Boolean);
      await Promise.all(
        uniqueIds.map((permissionId) =>
          createRolePermission({ roleId: payload.roleId, permissionId }),
        ),
      );
    },
    onSuccess: async () => {
      setSelectedPermissionIds([]);
      await refreshAll();
      toast({ title: "Permission assigned to role" });
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRolePermissionMutation = useMutation({
    mutationFn: (rolePermissionId: string) =>
      deleteRolePermission(rolePermissionId),
    onSuccess: async () => {
      await refreshAll();
      toast({ title: "Assignment removed" });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove assignment",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading =
    rolesQuery.isLoading ||
    permissionsQuery.isLoading ||
    rolePermissionsQuery.isLoading;
  const hasError =
    rolesQuery.isError ||
    permissionsQuery.isError ||
    rolePermissionsQuery.isError;

  const selectedRoleAssignments = rolePermissions.filter(
    (mapping) => (mapping.role?.id ?? "") === selectedRoleId,
  );
  const assignedPermissionIds = new Set(
    selectedRoleAssignments.map((mapping) => mapping.permission?.id),
  );
  const availablePermissions = permissions.filter(
    (permission) => !assignedPermissionIds.has(permission.id),
  );
  const selectedPermissionCount = selectedPermissionIds.length;

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({ title: "Role name is required", variant: "destructive" });
      return;
    }
    createRoleMutation.mutate({
      name: newRole.name.trim(),
      displayName: newRole.displayName.trim() || newRole.name.trim(),
      description: newRole.description.trim() || undefined,
      isSystem: false,
    });
  };

  const handleCreatePermission = () => {
    if (!newPermission.name.trim()) {
      toast({ title: "Permission key is required", variant: "destructive" });
      return;
    }
    createPermissionMutation.mutate({
      name: newPermission.name.trim(),
      displayName:
        newPermission.displayName.trim() || newPermission.name.trim(),
      module: newPermission.module.trim() || "GENERAL",
      description: newPermission.description.trim() || undefined,
    });
  };

  const handleAssign = () => {
    if (!selectedRoleId || selectedPermissionIds.length === 0) {
      toast({
        title: "Select a role and at least one permission first",
        variant: "destructive",
      });
      return;
    }
    assignPermissionMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: selectedPermissionIds,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            RBAC Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create roles, define permissions, and assign permissions to roles.
          </p>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading RBAC data...</p>
        )}
        {hasError && (
          <p className="text-sm text-destructive">Failed to load RBAC data.</p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-display font-bold">{roles.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Roles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-display font-bold text-accent">
                {permissions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Permissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-display font-bold text-success">
                {rolePermissions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Role assignments
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="name (e.g. SUPPORT_AGENT)"
                  value={newRole.name}
                  onChange={(event) =>
                    setNewRole((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="display name"
                  value={newRole.displayName}
                  onChange={(event) =>
                    setNewRole((previous) => ({
                      ...previous,
                      displayName: event.target.value,
                    }))
                  }
                />
              </div>
              <Input
                placeholder="description"
                value={newRole.description}
                onChange={(event) =>
                  setNewRole((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
              />
              <Button
                size="sm"
                onClick={handleCreateRole}
                disabled={createRoleMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" /> Create role
              </Button>

              <div className="space-y-2 border-t pt-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {role.displayName || role.name || "Unnamed role"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {role.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">
                          System
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={
                          Boolean(role.isSystem) || deleteRoleMutation.isPending
                        }
                        onClick={() => deleteRoleMutation.mutate(role.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {!roles.length && (
                  <p className="text-xs text-muted-foreground">
                    No roles found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="key (e.g. tickets.manage)"
                  value={newPermission.name}
                  onChange={(event) =>
                    setNewPermission((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="module (e.g. SUPPORT)"
                  value={newPermission.module}
                  onChange={(event) =>
                    setNewPermission((previous) => ({
                      ...previous,
                      module: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="display name"
                  value={newPermission.displayName}
                  onChange={(event) =>
                    setNewPermission((previous) => ({
                      ...previous,
                      displayName: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="description"
                  value={newPermission.description}
                  onChange={(event) =>
                    setNewPermission((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                size="sm"
                onClick={handleCreatePermission}
                disabled={createPermissionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" /> Create permission
              </Button>

              <div className="space-y-2 border-t pt-3 max-h-72 overflow-auto">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {permission.displayName ||
                          permission.name ||
                          "Unnamed permission"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {permission.name}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      disabled={deletePermissionMutation.isPending}
                      onClick={() =>
                        deletePermissionMutation.mutate(permission.id)
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {!permissions.length && (
                  <p className="text-xs text-muted-foreground">
                    No permissions found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Assign Permissions to Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <div className="rounded-md border bg-background px-3 py-2 text-sm">
                  {roles.length > 0 ? (
                    <select
                      className="w-full bg-transparent outline-none"
                      value={selectedRoleId}
                      onChange={(event) => {
                        setSelectedRoleId(event.target.value);
                        setSelectedPermissionIds([]);
                      }}
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.displayName || role.name || role.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted-foreground">No roles found</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Permissions {selectedPermissionCount > 0 ? `(${selectedPermissionCount} selected)` : ""}
                </p>
                <ScrollArea className="h-56 rounded-md border bg-background">
                  <div className="p-3 space-y-2">
                    {selectedRoleId ? (
                      availablePermissions.length > 0 ? (
                        availablePermissions.map((permission) => {
                          const checked = selectedPermissionIds.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/40 cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  setSelectedPermissionIds((previous) =>
                                    value
                                      ? [...previous, permission.id]
                                      : previous.filter((id) => id !== permission.id),
                                  );
                                }}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-sm truncate">
                                    {permission.displayName || permission.name || "Unnamed permission"}
                                  </p>
                                  {permission.module && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      {permission.module}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {permission.name}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">
                          All permissions are already assigned to this role.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground p-2">
                        Select a role to choose permissions.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex lg:items-end">
                <Button
                  onClick={handleAssign}
                  disabled={
                    assignPermissionMutation.isPending ||
                    !selectedRoleId ||
                    selectedPermissionIds.length === 0
                  }
                  className="w-full lg:w-auto"
                >
                  Assign selected
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">Current role assignments</p>
                <p className="text-xs text-muted-foreground">
                  {selectedRoleId ? rolePermissions.filter((item) => (item.role?.id ?? "") === selectedRoleId).length : 0} items
                </p>
              </div>
              {selectedRoleId ? (
                selectedRoleAssignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRoleAssignments.map((mapping) => {
                      const permission = permissionById.get(
                        mapping.permission?.id ?? "",
                      );
                      return (
                        <div
                          key={mapping.id}
                          className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs shadow-sm"
                        >
                          <span className="font-medium">
                            {permission?.displayName || permission?.name || mapping.permission?.id || "Unknown permission"}
                          </span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deleteRolePermissionMutation.isPending}
                            onClick={() => deleteRolePermissionMutation.mutate(mapping.id)}
                            aria-label={`Remove ${permission?.name || mapping.permission?.id || "permission"}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No permissions assigned for this role.
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a role to view current assignments.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {groupedAssignments.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {groupedAssignments.map((group) => (
                  <div
                    key={group.roleId}
                    className="rounded-xl border bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">
                          {group.roleDisplayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.roleName}
                        </p>
                      </div>
                      {group.roleIsSystem && (
                        <Badge variant="secondary" className="text-[10px]">
                          System
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.permissions.map((permission) => (
                        <Badge
                          key={permission.mappingId}
                          variant="outline"
                          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs bg-muted/30"
                        >
                          <span>{permission.permissionDisplayName}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deleteRolePermissionMutation.isPending}
                            onClick={() =>
                              deleteRolePermissionMutation.mutate(
                                permission.mappingId,
                              )
                            }
                            aria-label={`Remove ${permission.permissionName}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No assignments found.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminRbac;
