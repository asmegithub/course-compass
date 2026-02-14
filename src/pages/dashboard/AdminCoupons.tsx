import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Copy, Tag } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxUses: number;
  usedCount: number;
  minPurchase: number;
  expiresAt: string;
  isActive: boolean;
}

const initialCoupons: Coupon[] = [
  { id: '1', code: 'WELCOME20', type: 'PERCENTAGE', value: 20, maxUses: 500, usedCount: 234, minPurchase: 100, expiresAt: '2026-06-30', isActive: true },
  { id: '2', code: 'NEWYEAR100', type: 'FIXED', value: 100, maxUses: 200, usedCount: 189, minPurchase: 500, expiresAt: '2026-03-31', isActive: true },
  { id: '3', code: 'INSTRUCTOR10', type: 'PERCENTAGE', value: 10, maxUses: 1000, usedCount: 67, minPurchase: 0, expiresAt: '2026-12-31', isActive: true },
  { id: '4', code: 'SUMMER50', type: 'FIXED', value: 50, maxUses: 300, usedCount: 300, minPurchase: 200, expiresAt: '2025-09-30', isActive: false },
];

const emptyForm: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; maxUses: number; minPurchase: number; expiresAt: string } = { code: '', type: 'PERCENTAGE', value: 0, maxUses: 100, minPurchase: 0, expiresAt: '' };

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialog(true); };
  const openEdit = (c: Coupon) => { setEditId(c.id); setForm({ code: c.code, type: c.type, value: c.value, maxUses: c.maxUses, minPurchase: c.minPurchase, expiresAt: c.expiresAt }); setDialog(true); };

  const handleSave = () => {
    if (!form.code.trim()) return;
    if (editId) {
      setCoupons(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c));
      toast({ title: 'Coupon updated' });
    } else {
      setCoupons(prev => [...prev, { id: Date.now().toString(), ...form, usedCount: 0, isActive: true }]);
      toast({ title: 'Coupon created' });
    }
    setDialog(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: `${code} copied to clipboard` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Coupons</h1>
            <p className="text-muted-foreground mt-1">Manage discount coupons and promotions</p>
          </div>
          <Button variant="accent" onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" /> Create Coupon</Button>
        </div>

        <div className="grid gap-3">
          {coupons.map(c => (
            <Card key={c.id} className={!c.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-sm">{c.code}</code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyCode(c.code)}><Copy className="h-3 w-3" /></Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.type === 'PERCENTAGE' ? `${c.value}% off` : `ETB ${c.value} off`} · Min ETB {c.minPurchase} · Expires {c.expiresAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{c.usedCount}/{c.maxUses}</p>
                      <p className="text-xs text-muted-foreground">used</p>
                    </div>
                    <Badge variant={c.isActive && c.usedCount < c.maxUses ? 'default' : 'secondary'} className="text-xs">
                      {!c.isActive ? 'Expired' : c.usedCount >= c.maxUses ? 'Exhausted' : 'Active'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setCoupons(prev => prev.filter(x => x.id !== c.id)); toast({ title: 'Coupon deleted' }); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Coupon Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={form.type} onValueChange={(v: 'PERCENTAGE' | 'FIXED') => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed (ETB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value</Label><Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Max Uses</Label><Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: Number(e.target.value) }))} /></div>
                <div><Label>Min Purchase (ETB)</Label><Input type="number" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
              <Button variant="accent" onClick={handleSave} disabled={!form.code.trim()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCoupons;
