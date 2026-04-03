const fs = require('fs');

const text1 = fs.readFileSync('chapter1.txt', 'utf8');
const text2 = fs.readFileSync('chapter2.txt', 'utf8');
const text3 = fs.readFileSync('chapter3.txt', 'utf8');
const text4 = fs.readFileSync('chapter4.txt', 'utf8');
const text5 = fs.readFileSync('chapter5.txt', 'utf8');
const text6 = fs.readFileSync('chapter6.txt', 'utf8');

const allText = text1 + '\n\n' + text2 + '\n\n' + text3 + '\n\n' + text4 + '\n\n' + text5 + '\n\n' + text6;
const paragraphs = allText.split('\n\n').filter(p => p.trim() !== '');

let html = '';
let currentPage = 1;
let currentLength = 0;
const MAX_CHARS_PER_PAGE = 1200;

html += `        <!-- PAGE ${currentPage} -->
        <div class="page page-right relative">
            <div class="inner-page-content pt-8">
                <div class="text-content">\n`;

function startNewPage() {
    html += `                </div>
            </div>
            <div class="page-number">${currentPage}</div>
        </div>\n\n`;

    currentPage++;
    const pageClass = currentPage % 2 === 0 ? 'page-left' : 'page-right';

    html += `        <!-- PAGE ${currentPage} -->
        <div class="page ${pageClass} relative">
            <div class="inner-page-content pt-8">
                <div class="text-content">\n`;
    currentLength = 0;
}

for (let i = 0; i < paragraphs.length; i++) {
    let p = paragraphs[i].trim();

    while (p.length > 0) {
        if (currentLength >= MAX_CHARS_PER_PAGE) {
            startNewPage();
        }

        const spaceLeft = MAX_CHARS_PER_PAGE - currentLength;

        if (p.length <= spaceLeft) {
            html += `                    <p class="mb-2">${p}</p>\n`;
            currentLength += p.length + 50; // Add some arbitrary buffer for margin
            p = '';
        } else {
            // Find a space to cut the paragraph
            let cutPos = p.lastIndexOf(' ', spaceLeft);
            if (cutPos === -1) {
                // If no space found, just force a cut
                cutPos = spaceLeft;
            }

            const chunk = p.substring(0, cutPos);
            html += `                    <p class="mb-2">${chunk}</p>\n`;
            p = p.substring(cutPos).trim();
            currentLength = MAX_CHARS_PER_PAGE; // Force new page on next loop
        }
    }
}

html += `                </div>
            </div>
            <div class="page-number">${currentPage}</div>
        </div>\n`;

fs.writeFileSync('generated_pages.html', html);
console.log('Done generating pages. Total pages:', currentPage);
