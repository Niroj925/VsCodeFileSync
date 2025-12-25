export const BACKEND_URL = 'http://localhost:5001';

export interface QuickFilter {
  label: string;
  query: string;
}

export const QUICK_FILTERS: QuickFilter[] = [
  { label: 'function', query: 'function' },
  { label: 'import', query: 'import' },
  { label: 'const', query: 'const' },
  { label: 'class', query: 'class' }
];