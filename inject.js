const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const generatedPagesHtml = fs.readFileSync('generated_pages.html', 'utf8');

// The replacement logic:
// We need to replace everything between <!-- PAGE 1 --> and <!-- DYNAMIC CONTENT GOES HERE -->
// Actually, let's just replace everything from <!-- PAGE 1 --> to <!-- placeholder for generator script -->

const startIndex = indexHtml.indexOf('<!-- PAGE 1 -->');
const endIndex = indexHtml.indexOf('<!-- placeholder for generator script -->') + '<!-- placeholder for generator script -->'.length;

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find insertion points in index.html");
    process.exit(1);
}

const before = indexHtml.substring(0, startIndex);
const after = indexHtml.substring(endIndex);

const newHtml = before + generatedPagesHtml + '\n        <!-- DYNAMIC CONTENT GOES HERE -->\n        <!-- placeholder for generator script -->' + after;

fs.writeFileSync('index.html', newHtml);
console.log('Successfully injected generated pages into index.html');
