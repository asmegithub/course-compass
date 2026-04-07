import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
  ExternalLink,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getCertificateTemplates,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  type CertificateTemplate,
} from "@/lib/admin-api";
import { apiFetch, getApiBaseUrl } from "@/lib/api";

type AdminCertificate = {
  id: string;
  certificateNumber?: string;
  certificateUrl?: string;
  verificationCode?: string;
  issuedAt?: string;
  student?: { firstName?: string; lastName?: string; email?: string };
  course?: { title?: string };
  enrollment?: { id?: string };
};

const toAbsoluteUrl = (maybeUrl?: string) => {
  if (!maybeUrl) return "";
  if (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://"))
    return maybeUrl;
  if (maybeUrl.startsWith("/")) return `${getApiBaseUrl()}${maybeUrl}`;
  return maybeUrl;
};

const getAllCertificates = async (): Promise<AdminCertificate[]> => {
  const data = await apiFetch<AdminCertificate[]>("/api/certificates/all");
  return Array.isArray(data) ? data : [];
};

const emptyTemplate = (): Partial<CertificateTemplate> => ({
  name: "",
  description: "",
  templateHtml:
    '<div class="certificate"><h1>{{courseTitle}}</h1><p>{{studentName}}</p></div>',
  templateCss: ".certificate { font-family: serif; }",
  backgroundUrl: "",
  isDefault: false,
  isActive: true,
});

const AdminCertificates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<CertificateTemplate | null>(null);
  const [templateDraft, setTemplateDraft] =
    useState<Partial<CertificateTemplate>>(emptyTemplate());

  const certsQuery = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: getAllCertificates,
  });

  const templatesQuery = useQuery({
    queryKey: ["admin-certificate-templates"],
    queryFn: getCertificateTemplates,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (payload: Partial<CertificateTemplate>) => {
      if (editingTemplate?.id) {
        return updateCertificateTemplate(editingTemplate.id, payload);
      }
      return createCertificateTemplate(payload);
    },
    onSuccess: () => {
      toast({
        title: editingTemplate?.id ? "Template updated" : "Template created",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-certificate-templates"],
      });
      setEditingTemplate(null);
      setTemplateDraft(emptyTemplate());
    },
    onError: (error) => {
      toast({
        title: "Failed to save template",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteCertificateTemplate,
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({
        queryKey: ["admin-certificate-templates"],
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete template",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const certificateList = certsQuery.data ?? [];
  const templateList = useMemo(
    () => templatesQuery.data ?? [],
    [templatesQuery.data],
  );

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateDraft(emptyTemplate());
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplate = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setTemplateDraft({
      name: template.name,
      description: template.description,
      templateHtml: template.templateHtml,
      templateCss: template.templateCss,
      backgroundUrl: template.backgroundUrl,
      isDefault: template.isDefault,
      isActive: template.isActive,
    });
    setIsTemplateDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Certificates
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage certificate templates and review issued certificates.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                certsQuery.refetch();
                templatesQuery.refetch();
              }}
              disabled={certsQuery.isLoading || templatesQuery.isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="accent" onClick={openNewTemplate}>
              <Plus className="h-4 w-4 mr-2" /> New template
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display">
                {templateList.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display text-accent">
                {templateList.filter((template) => template.isDefault).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Default templates
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold font-display text-success">
                {certificateList.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Issued certificates
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Template
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      Preview
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templatesQuery.isLoading && (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={4}>
                        Loading templates...
                      </td>
                    </tr>
                  )}
                  {templatesQuery.isError && (
                    <tr>
                      <td className="p-4 text-destructive" colSpan={4}>
                        Failed to load templates.
                      </td>
                    </tr>
                  )}
                  {!templatesQuery.isLoading &&
                    !templatesQuery.isError &&
                    templateList.length === 0 && (
                      <tr>
                        <td className="p-4 text-muted-foreground" colSpan={4}>
                          No templates yet.
                        </td>
                      </tr>
                    )}
                  {!templatesQuery.isLoading &&
                    !templatesQuery.isError &&
                    templateList.map((template) => (
                      <tr
                        key={template.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                              <LayoutTemplate className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {template.name || "Untitled template"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {template.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 space-x-2">
                          {template.isDefault && (
                            <Badge className="text-xs">Default</Badge>
                          )}
                          <Badge
                            variant={
                              template.isActive ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground max-w-[260px] truncate">
                          {template.backgroundUrl ? (
                            <a
                              href={toAbsoluteUrl(template.backgroundUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent underline"
                            >
                              Background
                            </a>
                          ) : (
                            "No background"
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditTemplate(template)}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteTemplateMutation.mutate(template.id)
                              }
                              disabled={deleteTemplateMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              <div>
                <h2 className="font-semibold">Issued certificates</h2>
                <p className="text-xs text-muted-foreground">
                  Current live certificates on the platform.
                </p>
              </div>
            </div>
            {certsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">
                Loading certificates...
              </p>
            )}
            {certsQuery.isError && (
              <p className="text-sm text-destructive">
                Failed to load certificates.
              </p>
            )}
            {!certsQuery.isLoading &&
              !certsQuery.isError &&
              certificateList.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No certificates found.
                </p>
              )}
            {!certsQuery.isLoading &&
              !certsQuery.isError &&
              certificateList.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {certificateList.slice(0, 6).map((certificate) => (
                    <Card key={certificate.id}>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium text-sm truncate">
                          {certificate.certificateNumber ??
                            `Certificate #${certificate.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {certificate.course?.title ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {certificate.student
                            ? `${certificate.student.firstName ?? ""} ${certificate.student.lastName ?? ""}`.trim() ||
                              certificate.student.email ||
                              "—"
                            : "—"}
                        </p>
                        {certificate.certificateUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            asChild
                          >
                            <a
                              href={toAbsoluteUrl(certificate.certificateUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View / Download{" "}
                              <ExternalLink className="h-3 w-3 ml-0.5 inline" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        <Dialog
          open={isTemplateDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTemplate(null);
              setTemplateDraft(emptyTemplate());
            }
            setIsTemplateDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate?.id ? "Edit template" : "New template"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={templateDraft.name || ""}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={3}
                    value={templateDraft.description || ""}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Background URL</label>
                  <Input
                    value={templateDraft.backgroundUrl || ""}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        backgroundUrl: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">HTML</label>
                  <Textarea
                    rows={8}
                    value={templateDraft.templateHtml || ""}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        templateHtml: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CSS</label>
                  <Textarea
                    rows={6}
                    value={templateDraft.templateCss || ""}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        templateCss: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(templateDraft.isDefault)}
                      onChange={(e) =>
                        setTemplateDraft((prev) => ({
                          ...prev,
                          isDefault: e.target.checked,
                        }))
                      }
                    />{" "}
                    Default
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(templateDraft.isActive)}
                      onChange={(e) =>
                        setTemplateDraft((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                    />{" "}
                    Active
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="rounded-lg border bg-background p-4 text-sm prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          templateDraft.templateHtml || "<p>No HTML yet.</p>",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateDraft(emptyTemplate());
                }}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={() => saveTemplateMutation.mutate(templateDraft)}
                disabled={
                  saveTemplateMutation.isPending ||
                  !(templateDraft.name || "").trim()
                }
              >
                Save template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificates;
