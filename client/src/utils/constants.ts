export const BACKEND_URL = 'http://localhost:5001';

export const FILE_ICONS: Record<string, string> = {
  js: '🟨', ts: '🔷', jsx: '⚛️', tsx: '⚛️',
  html: '🌐', css: '🎨', scss: '🎨', json: '📋',
  md: '📝', txt: '📄', py: '🐍', java: '☕',
  cpp: '⚙️', c: '⚙️', go: '🐹', rs: '🦀',
  php: '🐘', rb: '💎', swift: '🐦', kt: '🔧'
};

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