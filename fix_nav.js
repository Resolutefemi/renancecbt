const fs = require('fs');
const path = require('path');

const mappings = {
    'ams101.html': 'AMS 101',
    'bio101.html': 'BIO 101',
    'che101.html': 'CHE 101',
    'che103.html': 'CHE 103',
    'csc101.html': 'CSC 101',
    'cve105.html': 'CVE 105',
    'gns103.html': 'GNS 103',
    'gst111.html': 'GST 111',
    'mth101.html': 'MTH 101',
    'phy101.html': 'PHY 101',
    'phy103.html': 'PHY 103',
    'sen101.html': 'SEN 101',
    'sta111.html': 'STA 111'
};

Object.entries(mappings).forEach(([filename, code]) => {
    let html = fs.readFileSync(filename, 'utf8');

    // Standardize Nav Brand
    // Remove the old nav-brand content entirely and replace it
    // We match from <nav> to the first button or end of nav
    const navMatch = html.match(/<nav>([\s\S]*?)<\/nav>/i);
    if (navMatch) {
        let navContent = navMatch[1];
        
        // New Nav Brand HTML
        const newNavBrand = `\n    <div class="nav-brand">\n        <i class="fa-solid fa-graduation-cap"></i> ${code} Practice Portal\n    </div>`;
        
        // Find where the old nav-brand ends. It usually ends before the first button or div with style.
        // Or we can just replace everything before the first <button> or <div style="display:flex">
        const splitPoint = navContent.search(/<(button|div\s+style="display:flex)/i);
        if (splitPoint !== -1) {
            const actions = navContent.substring(splitPoint);
            const newNavContent = newNavBrand + '\n    ' + actions;
            html = html.replace(navMatch[0], `<nav>${newNavContent}</nav>`);
        }
    }

    fs.writeFileSync(filename, html);
    console.log(`Fixed nav in ${filename}`);
});
