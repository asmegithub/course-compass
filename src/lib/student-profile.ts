export interface StudentDetailedProfile {
  fullName: string;
  ordination: string; // ክህነት (ምእመን፣ ዲያቆን፣ ቀሲስ፣ መነኩሴ፣ መሪጌታ/ሊቅ፣ ሌላ)
  otherOrdination?: string;
  gender: 'MALE' | 'FEMALE' | ''; // ጾታ
  previousEducation: string; // ካሁን በፊት የደረሱበት ትምህርት
  otherPreviousEducation?: string;
  residenceType: 'ETHIOPIA' | 'ABROAD'; // የመኖሪያ አድራሻ (በኢትዮጵያ ውስጥ / በውጭ ሀገር)
  residenceLocation: string; // ከተማ / ሀገር / ክልል
  currentOccupation: string; // የአሁን የሥራ ሁኔታ
  updatedAt?: string;
}

export const ORDINATION_OPTIONS = [
  { value: 'ምእመን', label: 'ምእመን / Layperson' },
  { value: 'ዲያቆን', label: 'ዲያቆን / Deacon' },
  { value: 'ቀሲስ', label: 'ቀሲስ / Priest' },
  { value: 'መነኩሴ', label: 'መነኩሴ / Monk or Nun' },
  { value: 'መሪጌታ', label: 'መሪጌታ / Scholar' },
  { value: 'ሌላ', label: 'ሌላ / Other' },
];

export const EDUCATION_OPTIONS = [
  { value: 'ፊደል/ንባብ', label: 'ፊደልና ንባብ / Fidel & Basic Reading' },
  { value: 'ዜማ (ጾመ ድጓ/ምዕራፍ/ዝማሬ)', label: 'ዜማ (ጾመ ድጓ፣ ምዕራፍ፣ ዝማሬ) / Zema' },
  { value: 'ቅኔ', label: 'ቅኔ / Qene' },
  { value: 'መጽሐፍት/አንድምታ', label: 'መጽሐፍትና አንድምታ / Scripture & Andimta' },
  { value: 'ዓለማዊ ትምህርት (ሁለተኛ ደረጃ / ዲግሪ)', label: 'ዓለማዊ ትምህርት (ሁለተኛ ደረጃ / ዲግሪ) / Academic Degree' },
  { value: 'ሌላ', label: 'ሌላ / Other' },
];

const STORAGE_PREFIX = 'course_compass_student_profile_';

export const getStudentProfile = (userId?: string): StudentDetailedProfile | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as StudentDetailedProfile;
  } catch {
    return null;
  }
};

export const saveStudentProfile = (userId: string, profile: StudentDetailedProfile): void => {
  if (!userId) return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify({
        ...profile,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error('Failed to save student profile to localStorage', error);
  }
};
