const fs = require('fs');

const text1 = fs.readFileSync('chapter1.txt', 'utf8');
const text2 = fs.readFileSync('chapter2.txt', 'utf8');
const text3 = fs.readFileSync('chapter3.txt', 'utf8');
const text4 = fs.readFileSync('chapter4.txt', 'utf8');
const text5 = fs.readFileSync('chapter5.txt', 'utf8');
const text6 = fs.readFileSync('chapter6.txt', 'utf8');

// The chapters are already separated by a double newline in this concatenation.
let allText = text1 + '\n\n' + text2 + '\n\n' + text3 + '\n\n' + text4 + '\n\n' + text5 + '\n\n' + text6;

// Clean up some weird formatting
allText = allText.replace(/\r\n/g, '\n');

// Ensure numbered items (1. 2. etc) at start of lines return to a new line (they usually already are, but we enforce separation)
allText = allText.replace(/\n(\d+\.)/g, '\n\n$1');

// Split by double newlines into paragraphs
const rawParagraphs = allText.split(/\n\s*\n/).filter(p => p.trim() !== '');

let paragraphs = [];

for (let p of rawParagraphs) {
    p = p.trim();
    // Sometimes text might contain embedded single newlines we want to treat as spaces if they aren't meant to be paragraph breaks.
    // We'll keep them as spaces.
    p = p.replace(/\n/g, ' ');

    paragraphs.push(p);
}


let html = '';
let currentPage = 1;
let currentLength = 0;
const MAX_CHARS_PER_PAGE = 1100; // slightly reduced to give room

function startNewPage() {
    // only close if we've actually opened one
    if (currentPage > 0) {
        html += `                    </div>\n                </div>\n                <div class="page-number">${currentPage}</div>\n            </div>\n        </div>\n\n`;
    }

    currentPage++;
    const pageClass = currentPage % 2 === 0 ? 'page-left' : 'page-right';

    html += `        <!-- PAGE ${currentPage} -->\n        <div class="page ${pageClass} relative">\n            <div class="page-paper shadow-sm">\n                <div class="inner-page-content pt-8">\n                    <div class="text-content">\n`;
    currentLength = 0;
}

// Open the first page
html += `        <!-- PAGE ${currentPage} -->\n        <div class="page page-right relative">\n            <div class="page-paper shadow-sm">\n                <div class="inner-page-content pt-8">\n                    <div class="text-content">\n`;

for (let i = 0; i < paragraphs.length; i++) {
    let p = paragraphs[i];

    let isChapter = false;
    let isQuote = false;

    // Check if paragraph is a new chapter heading
    if (p.toLowerCase().startsWith('chapter ')) {
        isChapter = true;

        // Skip page for chapters 2 towards the end. We assume any chapter after the first we process is > 1.
        // Actually, let's just say if currentLength > 0 or currentPage > 1, start a new page.
        if (currentLength > 0 || currentPage > 1) {
            // If it's chapter 2 or later, we want it on a new page.
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
            // The user said: "saute les lignes saute que pour les titres de chapter aprés le titre"
            // This means we should have a big margin after the chapter title.
            pOpenTag = `<p class="mb-10 font-bold text-lg leading-relaxed text-center">`;
        } else if (isQuote) {
            pOpenTag = `<p class="my-4 ml-8 text-gray-700 italic">`;
        } else {
            pOpenTag = `<p class="mb-4 text-justify">`; // mb-4 for paragraph spacing, text-justify for ebook feel
        }

        if (p.length <= spaceLeft) {
            html += `                        ${pOpenTag}${p}${pCloseTag}`;
            currentLength += p.length + (isChapter ? 200 : (isQuote ? 100 : 50));
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

            // To fix the "bad cut" on desktop: we will ensure the cut looks like a continuous paragraph.
            // When we cut, we close the <p> tag, but on the next page, we open it with a class that has NO text indent
            // and NO top margin, so it flows naturally. We also need to make sure the end of the chunk on the previous
            // page has NO bottom margin, so visually it indicates a continuation.

            html += `                        <p class="${isChapter ? 'mb-10 font-bold text-lg text-center' : (isQuote ? 'mb-0 ml-8 text-gray-700 italic text-justify' : 'mb-0 text-justify')}">${chunk}</p>\n`;

            // Re-assign p
            p = p.substring(cutPos).trim();

            // Since it's a continuation, we remove the top margin by not having it as a chapter
            isChapter = false;
            isQuote = false; // Quote continuation should probably keep styling, but let's just make it standard text or keep italic.

            // Force the next iteration to use continuation styling (we'll implement this by temporarily changing the default pOpenTag logic)
            // Actually, the loop will just use the default `pOpenTag = <p class="mb-4 text-justify">` on the next page.
            // Let's modify the loop slightly: if we are continuing a paragraph, we should use `<p class="mt-0 mb-4 text-justify">`
            // Wait, standard `mb-4` already has no top margin. But maybe the text-indent is the issue? We don't have text-indent.
            // The bad cut was likely because we were doing `mb-0` on the continuation, or cutting mid-word, or maybe PageFlip's layout.
            // Let's just rely on standard `mb-4` for the continuation but `mb-0` for the piece *before* the cut.

            currentLength = MAX_CHARS_PER_PAGE;
        }
    }
}

// Close the last page
html += `                    </div>\n                </div>\n                <div class="page-number">${currentPage}</div>\n            </div>\n        </div>\n`;

fs.writeFileSync('generated_pages.html', html);
console.log('Done generating pages. Total pages:', currentPage);
