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
  
  // Fix specific known bad duplicates
  content = content.replace(/dark:text-gray-500 dark:text-gray-400/g, 'dark:text-gray-400');
  content = content.replace(/dark:shadow-none dark:shadow-none/g, 'dark:shadow-none');
  
  // Fix general duplicate classes in className strings
  content = content.replace(/className=(["`])(.*?)\1/g, (match, quote, classStr) => {
    const classes = classStr.split(/\s+/).filter(Boolean);
    const unique = [...new Set(classes)];
    return `className=${quote}${unique.join(' ')}${quote}`;
  });
  
  fs.writeFileSync(file, content);
});
console.log('Cleanup complete.');
