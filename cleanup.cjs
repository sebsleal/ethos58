const fs = require('fs');

const files = [
  'src/components/Layout.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Calculator.jsx',
  'src/pages/LogAnalyzer.jsx',
  'src/pages/LogViewer.jsx',
  'src/pages/Settings.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix specific known bad duplicates generated from overlapping replacements
  content = content.replace(/dark:text-gray-500 dark:text-gray-400/g, 'dark:text-gray-400');
  content = content.replace(/text-gray-400 dark:text-gray-500 dark:text-gray-400/g, 'text-gray-400 dark:text-gray-400');
  content = content.replace(/dark:shadow-none dark:shadow-none/g, 'dark:shadow-none');
  content = content.replace(/dark:text-gray-500 dark:text-gray-500/g, 'dark:text-gray-500');
  content = content.replace(/text-gray-500 dark:text-gray-400 dark:text-gray-500/g, 'text-gray-500 dark:text-gray-500');
  content = content.replace(/shadow-sm dark:shadow-none dark:shadow-none/g, 'shadow-sm dark:shadow-none');

  // Also remove exact duplicates from className strings robustly
  content = content.replace(/className=(["`])(.*?)\1/g, (match, quote, classStr) => {
    // split string handling expressions like ${...} nicely is hard, so we just clean literal classes separated by spaces
    // Only split on spaces if it's a regular literal className=""
    if (quote === '"') {
      const classes = classStr.split(/\s+/).filter(Boolean);
      const unique = [...new Set(classes)];
      return `className="${unique.join(' ')}"`;
    }
    // for template strings we do a simpler exact replace for typical issues just in case
    return match;
  });
  
  fs.writeFileSync(file, content);
});
console.log('Cleanup complete.');
