export const CATEGORIES = ['OC', 'BC', 'BCM', 'MBC', 'SC', 'ST', 'SCA'] as const;
export type Category = typeof CATEGORIES[number];

export const COURSES = [
  { label: 'All Courses', value: '' },
  { label: 'Computer Science', value: 'computer science' },
  { label: 'Information Technology', value: 'information technology' },
  { label: 'AI & Data Science', value: 'artificial intelligence' },
  { label: 'Electronics & Communication', value: 'electronics' },
  { label: 'Electrical Engineering', value: 'electrical' },
  { label: 'Mechanical Engineering', value: 'mechanical' },
  { label: 'Civil Engineering', value: 'civil' },
  { label: 'Chemical Engineering', value: 'chemical' },
  { label: 'Biotechnology', value: 'biotechnology' },
  { label: 'Aerospace Engineering', value: 'aerospace' },
] as const;

export const YEARS = [
  { label: '2026 Predicted', value: '2026' },
  { label: '2025 Expected', value: '2025' },
  { label: '2024 Actual', value: '2024' },
] as const;

export const DEFAULT_CATEGORY: Category = 'OC';
export const DEFAULT_YEAR = '2026';
