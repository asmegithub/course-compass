import type { CourseCategory } from '@/types';

export type GeneratedLessonTemplate = {
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'QUIZ';
  duration: number;
  isFree: boolean;
};

export type GeneratedSectionTemplate = {
  title: string;
  lessons: GeneratedLessonTemplate[];
};

export type GeneratedCourseTemplate = {
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  currency: 'ETB' | 'USD';
  price: string;
  discountPrice: string;
  categoryId?: string;
  outcomes: string[];
  requirements: string[];
  sections: GeneratedSectionTemplate[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const detectLevel = (prompt: string): GeneratedCourseTemplate['level'] => {
  const lower = prompt.toLowerCase();
  if (lower.includes('advanced')) return 'ADVANCED';
  if (lower.includes('intermediate')) return 'INTERMEDIATE';
  if (lower.includes('all level')) return 'ALL_LEVELS';
  return 'BEGINNER';
};

const detectPrice = (prompt: string): { price: string; discountPrice: string } => {
  const lower = prompt.toLowerCase();
  const free = lower.includes('free');
  if (free) return { price: '0', discountPrice: '' };
  if (lower.includes('bootcamp')) return { price: '2999', discountPrice: '1999' };
  if (lower.includes('advanced')) return { price: '2499', discountPrice: '1799' };
  return { price: '1499', discountPrice: '999' };
};

const findCategoryId = (prompt: string, categories: CourseCategory[]): string | undefined => {
  const lower = prompt.toLowerCase();
  const matching = categories.find((cat) => {
    const name = (cat.name || '').toLowerCase();
    const nameAm = (cat.nameAm || '').toLowerCase();
    const nameOm = (cat.nameOm || '').toLowerCase();
    const nameGz = (cat.nameGz || '').toLowerCase();
    return [name, nameAm, nameOm, nameGz].some((n) => n && (lower.includes(n) || n.includes(lower)));
  });
  return matching?.id;
};

const inferTitle = (prompt: string) => {
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'New Course';
  if (cleaned.length <= 70) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned.slice(0, 67).trimEnd() + '...';
};

const buildSections = (prompt: string): GeneratedSectionTemplate[] => {
  const lower = prompt.toLowerCase();
  const isTech = ['programming', 'web', 'react', 'java', 'python', 'data', 'software'].some((k) => lower.includes(k));
  const isLanguage = ['english', 'amharic', 'oromo', 'language', 'grammar'].some((k) => lower.includes(k));

  if (isLanguage) {
    return [
      {
        title: 'Foundations',
        lessons: [
          { title: 'Alphabet and Sounds', type: 'VIDEO', duration: 20, isFree: true },
          { title: 'Basic Greetings', type: 'VIDEO', duration: 18, isFree: false },
        ],
      },
      {
        title: 'Sentence Building',
        lessons: [
          { title: 'Daily Expressions', type: 'TEXT', duration: 15, isFree: false },
          { title: 'Practice Quiz', type: 'QUIZ', duration: 10, isFree: false },
        ],
      },
    ];
  }

  if (isTech) {
    return [
      {
        title: 'Getting Started',
        lessons: [
          { title: 'Course Overview', type: 'VIDEO', duration: 12, isFree: true },
          { title: 'Environment Setup', type: 'VIDEO', duration: 25, isFree: false },
        ],
      },
      {
        title: 'Core Concepts',
        lessons: [
          { title: 'Fundamentals', type: 'VIDEO', duration: 35, isFree: false },
          { title: 'Hands-on Exercise', type: 'DOCUMENT', duration: 20, isFree: false },
          { title: 'Knowledge Check', type: 'QUIZ', duration: 10, isFree: false },
        ],
      },
      {
        title: 'Project and Next Steps',
        lessons: [
          { title: 'Mini Project Walkthrough', type: 'VIDEO', duration: 30, isFree: false },
          { title: 'Wrap-up and Roadmap', type: 'TEXT', duration: 15, isFree: false },
        ],
      },
    ];
  }

  return [
    {
      title: 'Introduction',
      lessons: [
        { title: 'Welcome and Overview', type: 'VIDEO', duration: 12, isFree: true },
        { title: 'Learning Objectives', type: 'TEXT', duration: 10, isFree: false },
      ],
    },
    {
      title: 'Main Content',
      lessons: [
        { title: 'Core Lesson 1', type: 'VIDEO', duration: 25, isFree: false },
        { title: 'Core Lesson 2', type: 'VIDEO', duration: 25, isFree: false },
        { title: 'Quick Quiz', type: 'QUIZ', duration: 8, isFree: false },
      ],
    },
  ];
};

export const generateCourseTemplateFromPrompt = (
  prompt: string,
  categories: CourseCategory[],
): GeneratedCourseTemplate => {
  const title = inferTitle(prompt);
  const level = detectLevel(prompt);
  const { price, discountPrice } = detectPrice(prompt);
  const sections = buildSections(prompt);

  return {
    title,
    description: `This course is designed to help learners master: ${prompt.trim() || 'key practical skills'}. It combines clear explanations, examples, and guided practice.`,
    level,
    currency: 'ETB',
    price,
    discountPrice,
    categoryId: findCategoryId(prompt, categories),
    outcomes: [
      'Understand core concepts with practical examples',
      'Apply skills through guided exercises and mini tasks',
      'Build confidence to continue at the next level',
    ],
    requirements: [
      'Basic digital literacy',
      'A device with internet connection',
      'Commitment to practice consistently',
    ],
    sections,
  };
};

export const toSlug = slugify;
