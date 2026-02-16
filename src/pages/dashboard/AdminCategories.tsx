import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryPayload, createCategory, deleteCategory, getCategories, updateCategory } from '@/lib/course-api';
import { CourseCategory } from '@/types';

const emptyForm = { name: '', nameAm: '', nameOm: '', nameGz: '', icon: '', slug: '' };

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['course-categories'],
    queryFn: getCategories,
  });
  const [editDialog, setEditDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const categoryIndex = useMemo(() => new Map(categories.map((cat) => [cat.id, cat])), [categories]);

  const createMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-categories'] });
      toast({ title: 'Category created' });
      setEditDialog(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create category.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) => updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-categories'] });
      toast({ title: 'Category updated' });
      setEditDialog(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update category.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-categories'] });
      toast({ title: 'Category deleted' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete category.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setEditDialog(true); };
  const openEdit = (c: CourseCategory) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      nameAm: c.nameAm || '',
      nameOm: c.nameOm || '',
      nameGz: c.nameGz || '',
      icon: c.icon || '',
      slug: c.slug,
    });
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const normalizedSlug = form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = editId ? categoryIndex.get(editId) : undefined;
    const payload: CategoryPayload = {
      name: form.name.trim(),
      nameAm: form.nameAm.trim() || undefined,
      nameOm: form.nameOm.trim() || undefined,
      nameGz: form.nameGz.trim() || undefined,
      slug: normalizedSlug,
      icon: form.icon.trim() || undefined,
      orderIndex: existing?.orderIndex ?? categories.length + 1,
      isActive: existing?.isActive ?? true,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleActive = (id: string) => {
    const existing = categoryIndex.get(id);
    if (!existing) return;
    updateMutation.mutate({
      id,
      payload: {
        name: existing.name,
        nameAm: existing.nameAm || undefined,
        nameOm: existing.nameOm || undefined,
        nameGz: existing.nameGz || undefined,
        slug: existing.slug,
        icon: existing.icon || undefined,
        orderIndex: existing.orderIndex,
        isActive: !existing.isActive,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage course categories and translations</p>
          </div>
          <Button variant="accent" onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="text-muted-foreground">Loading categories...</div>
          )}
          {isError && (
            <div className="text-destructive">Failed to load categories.</div>
          )}
          {!isLoading && !isError && categories.map(c => (
            <Card key={c.id} className={!c.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon || '📚'}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[c.nameAm, c.nameOm, c.nameGz].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">0 courses</Badge>
                    <Switch checked={c.isActive} onCheckedChange={() => toggleActive(c.id)} />
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)} disabled={updateMutation.isPending}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name (English)</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} /></div>
                <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="💻" /></div>
              </div>
              <div><Label>Name (Amharic)</Label><Input value={form.nameAm} onChange={e => setForm(f => ({ ...f, nameAm: e.target.value }))} /></div>
              <div><Label>Name (Afaan Oromoo)</Label><Input value={form.nameOm} onChange={e => setForm(f => ({ ...f, nameOm: e.target.value }))} /></div>
              <div><Label>Name (Geez)</Label><Input value={form.nameGz} onChange={e => setForm(f => ({ ...f, nameGz: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button
                variant="accent"
                onClick={handleSave}
                disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCategories;
