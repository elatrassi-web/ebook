const fs = require('fs');

const text1 = fs.readFileSync('chapter1.txt', 'utf8');
const text2 = fs.readFileSync('chapter2.txt', 'utf8');
const text3 = fs.readFileSync('chapter3.txt', 'utf8');
const text4 = fs.readFileSync('chapter4.txt', 'utf8');
const text5 = fs.readFileSync('chapter5.txt', 'utf8');
const text6 = fs.readFileSync('chapter6.txt', 'utf8');

let allText = text1 + '\n\n' + text2 + '\n\n' + text3 + '\n\n' + text4 + '\n\n' + text5 + '\n\n' + text6;
// Ensure Chapter headings are separated from the next paragraph by a double newline
allText = allText.replace(/^(Chapter [^\n]+)\n(?![\n])/gm, '$1\n\n');

// Ensure numbered items (1. 2. etc) are separated from the previous paragraph by a double newline if they aren't already
allText = allText.replace(/\n(\d+\.)/g, '\n\n$1');

const paragraphs = allText.split('\n\n').filter(p => p.trim() !== '');

let html = '';
let currentPage = 1;
let currentLength = 0;
const MAX_CHARS_PER_PAGE = 1200;

html += `        <!-- PAGE ${currentPage} -->
        <div class="page page-right relative">
            <div class="page-paper shadow-sm">
                <div class="inner-page-content pt-8">
                    <div class="text-content">\n`;

function startNewPage() {
    html += `                    </div>
                </div>
                <div class="page-number">${currentPage}</div>
            </div>
        </div>\n\n`;

    currentPage++;
    const pageClass = currentPage % 2 === 0 ? 'page-left' : 'page-right';

    html += `        <!-- PAGE ${currentPage} -->
        <div class="page ${pageClass} relative">
            <div class="page-paper shadow-sm">
                <div class="inner-page-content pt-8">
                    <div class="text-content">\n`;
    currentLength = 0;
}

for (let i = 0; i < paragraphs.length; i++) {
    let p = paragraphs[i].trim();

    let isChapter = false;
    let isQuote = false;

    // Check if paragraph is a new chapter heading
    if (p.toLowerCase().startsWith('chapter ')) {
        isChapter = true;
        // Always start a new page for a chapter unless we are at the very beginning of the first page
        if (currentLength > 0 || currentPage > 1) {
            // But if we just started a new page and the currentLength is 0, we don't need to start another one
            if (currentLength > 0) {
                startNewPage();
            }
        }
    } else if (p.startsWith('“') || p.startsWith('"')) {
        isQuote = true;
    }

    // Check if paragraph starts with "Albert C."
    if (p.startsWith('Albert C.') && currentLength > 0) {
        startNewPage();
    }

    // Format footnotes: a number immediately following a letter, period, or quote.
    p = p.replace(/([a-zA-Z\.”])([0-9]+)\b/g, '$1<sup>$2</sup>');

    while (p.length > 0) {
        if (currentLength >= MAX_CHARS_PER_PAGE) {
            startNewPage();
        }

        const spaceLeft = MAX_CHARS_PER_PAGE - currentLength;

        if (p.length <= spaceLeft) {
            if (isChapter) {
                html += `                        <p class="mb-8 font-bold text-sm leading-relaxed">${p}</p>\n`;
            } else if (isQuote) {
                html += `                        <p class="my-4 ml-8">${p}</p>\n`;
            } else {
                html += `                        <p class="mb-2">${p}</p>\n`;
            }
            currentLength += p.length + (isChapter ? 150 : (isQuote ? 100 : 50));
            p = '';
        } else {
            // Find a space to cut the paragraph
            let cutPos = p.lastIndexOf(' ', spaceLeft);
            if (cutPos === -1) {
                cutPos = spaceLeft;
            }

            const chunk = p.substring(0, cutPos);
            if (isChapter) {
                html += `                        <p class="mb-8 font-bold text-sm leading-relaxed">${chunk}</p>\n`;
            } else if (isQuote) {
                html += `                        <p class="my-4 ml-8">${chunk}</p>\n`;
            } else {
                html += `                        <p class="mb-2">${chunk}</p>\n`;
            }
            p = p.substring(cutPos).trim();
            currentLength = MAX_CHARS_PER_PAGE;
        }
    }
}

html += `                    </div>
                </div>
                <div class="page-number">${currentPage}</div>
            </div>
        </div>\n`;

fs.writeFileSync('generated_pages.html', html);
console.log('Done generating pages. Total pages:', currentPage);
