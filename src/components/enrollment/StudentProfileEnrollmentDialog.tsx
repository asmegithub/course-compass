import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, GraduationCap, MapPin, Briefcase, Award, ArrowRight } from 'lucide-react';
import {
  getStudentProfile,
  saveStudentProfile,
  ORDINATION_OPTIONS,
  EDUCATION_OPTIONS,
  type StudentDetailedProfile,
} from '@/lib/student-profile';
import { useAuth } from '@/contexts/AuthContext';

type StudentProfileEnrollmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile?: StudentDetailedProfile) => void;
};

export const StudentProfileEnrollmentDialog = ({
  open,
  onOpenChange,
  onComplete,
}: StudentProfileEnrollmentDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<StudentDetailedProfile>({
    fullName: '',
    ordination: 'ምእመን',
    otherOrdination: '',
    gender: '',
    previousEducation: 'ፊደል/ንባብ',
    otherPreviousEducation: '',
    residenceType: 'ETHIOPIA',
    residenceLocation: '',
    currentOccupation: '',
  });

  useEffect(() => {
    if (open && user?.id) {
      const saved = getStudentProfile(user.id);
      if (saved) {
        setFormData(saved);
      } else {
        const userFullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        setFormData((prev) => ({
          ...prev,
          fullName: userFullName || '',
        }));
      }
    }
  }, [open, user]);

  const handleSaveAndContinue = () => {
    if (user?.id) {
      saveStudentProfile(user.id, formData);
    }
    onOpenChange(false);
    onComplete(formData);
  };

  const handleSkip = () => {
    onOpenChange(false);
    onComplete(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <User className="h-4 w-4 text-accent" />
            <span>የተማሪ መረጃ ቅጽ / Student Profile</span>
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            የተማሪ ዝርዝር መረጃዎን ያሟሉ
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            ለትምህርቱ ክትትልና ለምስክር ወረቀት ዝግጅት የሚከተለውን መረጃ ያሟሉ (ወይም ለጊዜው መዝለል ይችላሉ)።
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              ሙሉ ስም (የአባትና የአያት ስም ጨምሮ) / Full Name
            </Label>
            <Input
              placeholder="ለምሳሌ፡ ዮሐንስ ተስፋዬ ገብረ ማርያም"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          {/* Ordination & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ordination (ክህነት) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                ክህነት / Ordination Status
              </Label>
              <Select
                value={formData.ordination}
                onValueChange={(val) => setFormData({ ...formData, ordination: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ክህነት ይምረጡ" />
                </SelectTrigger>
                <SelectContent>
                  {ORDINATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.ordination === 'ሌላ' && (
                <Input
                  className="mt-1.5 text-xs"
                  placeholder="ክህነትዎን ይጥቀሱ"
                  value={formData.otherOrdination || ''}
                  onChange={(e) => setFormData({ ...formData, otherOrdination: e.target.value })}
                />
              )}
            </div>

            {/* Gender (ጾታ) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">ጾታ / Gender</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val as 'MALE' | 'FEMALE' })}
                className="flex items-center gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MALE" id="gender-male" />
                  <Label htmlFor="gender-male" className="cursor-pointer text-sm font-normal">
                    ወንድ (Male)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FEMALE" id="gender-female" />
                  <Label htmlFor="gender-female" className="cursor-pointer text-sm font-normal">
                    ሴት (Female)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Previous Education reached (ካሁን በፊት የደረሱበት ትምህርት) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              ካሁን በፊት የደረሱበት ትምህርት / Previous Education Level
            </Label>
            <Select
              value={formData.previousEducation}
              onValueChange={(val) => setFormData({ ...formData, previousEducation: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="የትምህርት ደረጃ ይምረጡ" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.previousEducation === 'ሌላ' && (
              <Input
                className="mt-1.5 text-xs"
                placeholder="የደረሱበትን የትምህርት ደረጃ ይጥቀሱ"
                value={formData.otherPreviousEducation || ''}
                onChange={(e) =>
                  setFormData({ ...formData, otherPreviousEducation: e.target.value })
                }
              />
            )}
          </div>

          {/* Residence Address (የመኖሪያ አድራሻ) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              የመኖሪያ አድራሻ / Residence Address
            </Label>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="residenceType"
                  value="ETHIOPIA"
                  checked={formData.residenceType === 'ETHIOPIA'}
                  onChange={() => setFormData({ ...formData, residenceType: 'ETHIOPIA' })}
                  className="accent-primary"
                />
                በኢትዮጵያ ውስጥ (In Ethiopia)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="residenceType"
                  value="ABROAD"
                  checked={formData.residenceType === 'ABROAD'}
                  onChange={() => setFormData({ ...formData, residenceType: 'ABROAD' })}
                  className="accent-primary"
                />
                በውጭ ሀገር (Abroad)
              </label>
            </div>
            <Input
              placeholder={
                formData.residenceType === 'ETHIOPIA'
                  ? 'ከተማ / ክፍለ ከተማ / ክልል (ለምሳሌ፡ አዲስ አበባ)'
                  : 'ሀገርና ከተማ (ለምሳሌ፡ USA, Washington DC)'
              }
              value={formData.residenceLocation}
              onChange={(e) => setFormData({ ...formData, residenceLocation: e.target.value })}
            />
          </div>

          {/* Current Occupation (የአሁን የሥራ ሁኔታ) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              የአሁን የሥራ ሁኔታ / Current Occupation
            </Label>
            <Input
              placeholder="ለምሳሌ፡ ተማሪ፣ የመንግሥት/የግል ሠራተኛ፣ ነጋዴ፣ የቤተ ክርስቲያን አገልጋይ..."
              value={formData.currentOccupation}
              onChange={(e) => setFormData({ ...formData, currentOccupation: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t mt-2">
          <Button type="button" variant="ghost" onClick={handleSkip} className="sm:w-auto text-muted-foreground">
            ለጊዜው ዝለል (Skip for now)
          </Button>
          <Button type="button" variant="accent" onClick={handleSaveAndContinue} className="sm:w-auto gap-1.5">
            <span>መዝግብና ቀጥል (Save & Continue)</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileEnrollmentDialog;
