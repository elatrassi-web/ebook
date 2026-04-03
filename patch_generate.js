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

        // If we are at the beginning of a paragraph but space left is less than a minimum threshold
        // (e.g., 200 chars), it's not intelligent to cut it. We just start a new page instead,
        // unless the paragraph itself is tiny.
        if (spaceLeft < 200 && p.length > spaceLeft) {
            startNewPage();
            continue; // Go back to top of the while loop to check conditions again
        }

        // We will output a <p> tag first if this is the start of the paragraph
        let pOpenTag = "";
        let pCloseTag = "</p>\n";

        if (isChapter) {
            pOpenTag = `<p class="mb-8 font-bold text-sm leading-relaxed">`;
        } else if (isQuote) {
            pOpenTag = `<p class="my-4 ml-8">`;
        } else {
            pOpenTag = `<p class="mb-2">`;
        }

        if (p.length <= spaceLeft) {
            html += `                        ${pOpenTag}${p}${pCloseTag}`;
            currentLength += p.length + (isChapter ? 150 : (isQuote ? 100 : 50));
            p = '';
        } else {
            // Find a space to cut the paragraph. We should try to cut on a sentence boundary
            // if possible, to make the cut "intelligent".
            let cutPos = -1;

            // Try to find a sentence boundary (. ? ! followed by a space)
            const sentenceRegex = /[.?!]\s/g;
            let match;
            while ((match = sentenceRegex.exec(p.substring(0, spaceLeft))) !== null) {
                cutPos = match.index + 1; // Include the punctuation
            }

            // If no sentence boundary found in the available space, try finding a comma
            if (cutPos === -1) {
                const commaRegex = /[,;:]\s/g;
                while ((match = commaRegex.exec(p.substring(0, spaceLeft))) !== null) {
                    cutPos = match.index + 1;
                }
            }

            // Fallback to finding a space
            if (cutPos === -1) {
                cutPos = p.lastIndexOf(' ', spaceLeft);
            }

            // Absolute fallback
            if (cutPos === -1) {
                cutPos = spaceLeft;
            }

            const chunk = p.substring(0, cutPos);

            html += `                        ${pOpenTag}${chunk}${pCloseTag}`;

            // Re-assign p, but next iteration should use a continuation style
            // so there is no paragraph margin at the top of the new page.
            p = p.substring(cutPos).trim();
            // Since it's a continuation, we remove the top margin by not having it as a chapter
            isChapter = false;
            // Also append a space if it starts with a letter, but trim() already took care of removing leading space.
            // But we should use mb-0 for the chunk we just closed so it feels like a single paragraph
            html = html.replace(/<p class="(mb-[^"]*)">([^<]*)$/, '<p class="mb-0">$2');

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
