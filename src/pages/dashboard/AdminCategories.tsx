import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameAm: string;
  nameOm: string;
  nameGz: string;
  slug: string;
  icon: string;
  courseCount: number;
  isActive: boolean;
}

const initialCategories: Category[] = [
  { id: '1', name: 'Programming', nameAm: 'ፕሮግራሚንግ', nameOm: 'Pirogramingii', nameGz: 'ፕሮግራሚንግ', slug: 'programming', icon: '💻', courseCount: 45, isActive: true },
  { id: '2', name: 'Business', nameAm: 'ንግድ', nameOm: 'Daldala', nameGz: 'ንግድ', slug: 'business', icon: '📊', courseCount: 28, isActive: true },
  { id: '3', name: 'Design', nameAm: 'ዲዛይን', nameOm: 'Dizaayinii', nameGz: 'ዲዛይን', slug: 'design', icon: '🎨', courseCount: 19, isActive: true },
  { id: '4', name: 'Marketing', nameAm: 'ማርኬቲንግ', nameOm: 'Gabaa baasuu', nameGz: 'ማርኬቲንግ', slug: 'marketing', icon: '📈', courseCount: 15, isActive: true },
  { id: '5', name: 'Languages', nameAm: 'ቋንቋዎች', nameOm: 'Afaanota', nameGz: 'ቋንቋዎች', slug: 'languages', icon: '🌍', courseCount: 12, isActive: true },
  { id: '6', name: 'Personal Development', nameAm: 'የግል እድገት', nameOm: 'Guddina dhuunfaa', nameGz: 'ናይ ግሊ ዕብየት', slug: 'personal-development', icon: '🧠', courseCount: 22, isActive: true },
  { id: '7', name: 'Health & Fitness', nameAm: 'ጤና እና ስፖርት', nameOm: 'Fayyaa fi Ispoortii', nameGz: 'ጥዕና', slug: 'health-fitness', icon: '🏃', courseCount: 8, isActive: false },
];

const emptyForm = { name: '', nameAm: '', nameOm: '', nameGz: '', icon: '', slug: '' };

const AdminCategories = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [editDialog, setEditDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const openCreate = () => { setEditId(null); setForm(emptyForm); setEditDialog(true); };
  const openEdit = (c: Category) => { setEditId(c.id); setForm({ name: c.name, nameAm: c.nameAm, nameOm: c.nameOm, nameGz: c.nameGz, icon: c.icon, slug: c.slug }); setEditDialog(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setCategories(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast({ title: 'Category updated' });
    } else {
      setCategories(prev => [...prev, { id: Date.now().toString(), ...form, courseCount: 0, isActive: true }]);
      toast({ title: 'Category created' });
    }
    setEditDialog(false);
  };

  const toggleActive = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat && cat.courseCount > 0) {
      toast({ title: 'Cannot delete', description: 'Category has courses assigned.', variant: 'destructive' });
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Category deleted' });
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
          {categories.map(c => (
            <Card key={c.id} className={!c.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.nameAm} · {c.nameOm} · {c.nameGz}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{c.courseCount} courses</Badge>
                    <Switch checked={c.isActive} onCheckedChange={() => toggleActive(c.id)} />
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
              <Button variant="accent" onClick={handleSave} disabled={!form.name.trim()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCategories;
