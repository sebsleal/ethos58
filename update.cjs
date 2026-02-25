const fs = require('fs');

const files = [
  'src/components/Layout.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Calculator.jsx',
  'src/pages/LogAnalyzer.jsx',
  'src/pages/LogViewer.jsx',
  'src/pages/Settings.jsx'
];

const classMap = {
  'bg-surface-300': 'bg-gray-50 dark:bg-surface-300',
  'bg-surface-200': 'bg-white dark:bg-surface-200',
  'bg-surface-100': 'bg-gray-100 dark:bg-surface-100',
  'text-gray-100': 'text-gray-900 dark:text-gray-100',
  'text-gray-200': 'text-gray-800 dark:text-gray-200',
  'text-gray-300': 'text-gray-700 dark:text-gray-300',
  'text-gray-400': 'text-gray-500 dark:text-gray-400',
  'text-gray-500': 'text-gray-400 dark:text-gray-500',
  'border-white/5': 'border-gray-200 dark:border-white/5',
  'border-white/10': 'border-gray-300 dark:border-white/10',
  'border-white/20': 'border-gray-300 dark:border-white/20',
  'hover:border-white/10': 'hover:border-gray-300 dark:hover:border-white/10',
  'hover:border-white/20': 'hover:border-gray-400 dark:hover:border-white/20',
  'bg-white/5': 'bg-gray-100 dark:bg-white/5',
  'hover:bg-white/5': 'hover:bg-gray-100 dark:hover:bg-white/5',
  'hover:bg-white/10': 'hover:bg-gray-200 dark:hover:bg-white/10',
  'bg-white/10': 'bg-gray-200 dark:bg-white/10',
  'bg-surface-300/30': 'bg-gray-50/50 dark:bg-surface-300/30',
  'bg-surface-300/50': 'bg-gray-50/80 dark:bg-surface-300/50',
  'bg-surface-300/80': 'bg-white/80 dark:bg-surface-300/80',
  'bg-surface-200/40': 'bg-white/60 dark:bg-surface-200/40',
  'bg-surface-200/50': 'bg-white/80 dark:bg-surface-200/50',
  'shadow-sm': 'shadow-sm dark:shadow-none'
};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const keys = Object.keys(classMap).sort((a, b) => b.length - a.length);
  
  keys.forEach(key => {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp("(?<=[\\s\"'\\`])(?<!dark:)" + escapedKey + "(?=[\\s\"'\\`])", 'g');
    content = content.replace(regex, classMap[key]);
  });
  
  fs.writeFileSync(file, content);
});
console.log('Update complete.');
