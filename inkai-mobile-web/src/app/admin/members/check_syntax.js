const fs = require('fs');
const content = fs.readFileSync('d:\\website\\inkai\\inkai-mobile-web\\src\\app\\admin\\members\\page.tsx', 'utf8');
try {
    let stack = [];
    let quotes = { "'": false, '"': false, '`': false };
    let comment = { single: false, multi: false };
    for (let i = 0; i < content.length; i++) {
        let char = content[i];
        let next = content[i+1];
        
        if (char === '\\') { i++; continue; }
        
        if (comment.single) {
            if (char === '\n') comment.single = false;
            continue;
        }
        if (comment.multi) {
            if (char === '*' && next === '/') { comment.multi = false; i++; }
            continue;
        }
        
        if (quotes["'"] || quotes['"'] || quotes['`']) {
            if (char === "'" && quotes["'"]) quotes["'"] = false;
            else if (char === '"' && quotes['"']) quotes['"'] = false;
            else if (char === '`' && quotes['`']) quotes['`'] = false;
            continue;
        }
        
        if (char === '/' && next === '/') { comment.single = true; i++; continue; }
        if (char === '/' && next === '*') { comment.multi = true; i++; continue; }
        
        if (char === "'" || char === '"' || char === '`') {
            quotes[char] = true;
            continue;
        }
        
        if (char === '{' || char === '(' || char === '[') stack.push({char, i});
        if (char === '}' || char === ')' || char === ']') {
            let last = stack.pop();
            if (!last) { console.log(`Extra ${char} at index ${i}`); continue; }
            if ((char === '}' && last.char !== '{') ||
                (char === ')' && last.char !== '(') ||
                (char === ']' && last.char !== '[')) {
                console.log(`Mismatch ${last.char} and ${char} at ${last.i} and ${i}`);
            }
        }
    }
    if (stack.length > 0) {
        console.log("Unclosed brackets:");
        stack.forEach(b => console.log(`${b.char} at index ${b.i}`));
    } else {
        console.log("All brackets balanced!");
    }
} catch (e) {
    console.log(e);
}
