
/**
 * MEE 101: Engineering Drawing Tutorials
 * Handles tutorial filtering, interactive diagrams (lightbox), and lazy-loading YouTube videos.
 */

interface Topic {
    num: number;
    title: string;
    url: string;
    vid: string;
    tag: string;
    desc: string;
    concepts: string[];
}

// Diagram SVG definitions
const DIAGRAMS: Record<number, string> = {
    1: `<svg viewBox="0 0 640 340" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
<rect width="640" height="340" fill="#f8faff"/>
<text x="16" y="20" font-size="10" fill="#1e40af" font-weight="bold">① BISECT A LINE</text>
<line x1="30" y1="55" x2="200" y2="55" stroke="#0f172a" stroke-width="2"/>
<circle cx="30" cy="55" r="3" fill="#1e40af"/><text x="24" y="70" fill="#1e40af" font-size="9">A</text>
<circle cx="200" cy="55" r="3" fill="#1e40af"/><text x="198" y="70" fill="#1e40af" font-size="9">B</text>
<path d="M115,55 m-85,0 a85,85 0 0,1 60,73" fill="none" stroke="#ea580c" stroke-width="1" stroke-dasharray="4,3"/>
<path d="M115,55 m-85,0 a85,85 0 0,0 60,-73" fill="none" stroke="#ea580c" stroke-width="1" stroke-dasharray="4,3"/>
<path d="M115,55 m85,0 a85,85 0 0,0 -60,73" fill="none" stroke="#ea580c" stroke-width="1" stroke-dasharray="4,3"/>
<path d="M115,55 m85,0 a85,85 0 0,1 -60,-73" fill="none" stroke="#ea580c" stroke-width="1" stroke-dasharray="4,3"/>
<line x1="115" y1="10" x2="115" y2="110" stroke="#1e40af" stroke-width="1.5" stroke-dasharray="5,3"/>
<circle cx="115" cy="55" r="4" fill="#ea580c"/>
<text x="120" y="53" fill="#ea580c" font-size="9">M (midpoint)</text>
<text x="220" y="20" font-size="10" fill="#1e40af" font-weight="bold">② PARALLEL LINES</text>
<line x1="220" y1="55" x2="420" y2="55" stroke="#0f172a" stroke-width="2"/>
<line x1="220" y1="100" x2="420" y2="100" stroke="#1e40af" stroke-width="2" stroke-dasharray="6,3"/>
<line x1="320" y1="50" x2="320" y2="105" stroke="#ea580c" stroke-width="1" stroke-dasharray="3,2"/>
<text x="325" y="80" fill="#ea580c" font-size="9">d</text>
<text x="222" y="50" fill="#64748b" font-size="8">AB</text>
<text x="222" y="95" fill="#1e40af" font-size="8">CD (parallel)</text>
<text x="440" y="20" font-size="10" fill="#1e40af" font-weight="bold">③ DIVIDE INTO 5</text>
<line x1="440" y1="55" x2="620" y2="55" stroke="#0f172a" stroke-width="2"/>
<line x1="440" y1="55" x2="490" y2="110" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,2"/>
<circle cx="450" cy="65" r="2.5" fill="#ea580c"/><circle cx="460" cy="75" r="2.5" fill="#ea580c"/>
<circle cx="470" cy="85" r="2.5" fill="#ea580c"/><circle cx="480" cy="95" r="2.5" fill="#ea580c"/><circle cx="490" cy="108" r="2.5" fill="#ea580c"/>
<line x1="450" y1="65" x2="476" y2="55" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="460" y1="75" x2="512" y2="55" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="470" y1="85" x2="548" y2="55" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="480" y1="95" x2="584" y2="55" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<circle cx="476" cy="55" r="3" fill="#1e40af"/><circle cx="512" cy="55" r="3" fill="#1e40af"/>
<circle cx="548" cy="55" r="3" fill="#1e40af"/><circle cx="584" cy="55" r="3" fill="#1e40af"/>
<text x="16" y="140" font-size="10" fill="#1e40af" font-weight="bold">④ BISECT AN ANGLE</text>
<line x1="50" y1="300" x2="300" y2="300" stroke="#0f172a" stroke-width="2"/>
<line x1="50" y1="300" x2="160" y2="155" stroke="#0f172a" stroke-width="2"/>
<path d="M50,300 m80,0 a80,80 0 0,0 -55,-55" fill="none" stroke="#64748b" stroke-width="1.2"/>
<circle cx="77" cy="256" r="3" fill="#ea580c"/><circle cx="116" cy="300" r="3" fill="#ea580c"/>
<line x1="50" y1="300" x2="230" y2="195" stroke="#1e40af" stroke-width="2.5" stroke-dasharray="7,4"/>
<text x="235" y="193" fill="#1e40af" font-size="9">Bisector</text>
<text x="95" y="295" fill="#64748b" font-size="8">θ/2</text><text x="75" y="278" fill="#64748b" font-size="8">θ/2</text>
<rect x="320" y="130" width="300" height="190" rx="8" fill="white" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="330" y="150" font-size="9" fill="#1e40af" font-weight="bold">KEY RULES</text>
<text x="330" y="168" font-size="8" fill="#0f172a">● Compass radius > half the line length</text>
<text x="330" y="183" font-size="8" fill="#0f172a">● Two arcs from each end cross at M</text>
<text x="330" y="198" font-size="8" fill="#0f172a">● Parallel: use set-square + compass</text>
<text x="330" y="213" font-size="8" fill="#0f172a">● Division: draw auxiliary line at angle</text>
<text x="330" y="228" font-size="8" fill="#0f172a">● Mark N equal steps on auxiliary line</text>
<text x="330" y="243" font-size="8" fill="#0f172a">● Connect last point to end, draw parallels</text>
<text x="330" y="258" font-size="8" fill="#0f172a">● Angle bisector: equal arcs from both rays</text>
<text x="330" y="273" font-size="8" fill="#0f172a">● Connect vertex to intersection of arcs</text>
<rect x="16" y="310" width="620" height="22" fill="#dbeafe" rx="5"/>
<text x="26" y="324" font-size="8" fill="#1e40af">These 4 constructions are the building blocks of ALL engineering geometry. Master them first.</text>
</svg>`,
    2: `<svg viewBox="0 0 640 340" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="11">
<rect width="640" height="340" fill="#f8faff"/>
<text x="20" y="20" font-size="10" fill="#1e40af" font-weight="bold">CIRCUMSCRIBED CIRCLE (passes through all 3 vertices)</text>
<polygon points="160,35 60,255 260,255" fill="rgba(30,64,175,.05)" stroke="#0f172a" stroke-width="2"/>
<circle cx="160" cy="183" r="80" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="6,3"/>
<circle cx="160" cy="183" r="4" fill="#ea580c"/>
<text x="165" y="181" fill="#ea580c" font-size="8">O (circumcenter)</text>
<line x1="110" y1="145" x2="210" y2="145" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="160" y1="80" x2="160" y2="265" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="75" y1="195" x2="240" y2="225" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<text x="22" y="282" font-size="8" fill="#64748b">◆ Center = intersection of perpendicular bisectors of all 3 sides</text>
<circle cx="60" cy="255" r="4" fill="#1e40af"/><circle cx="260" cy="255" r="4" fill="#1e40af"/><circle cx="160" cy="35" r="4" fill="#1e40af"/>
<text x="350" y="20" font-size="10" fill="#1e40af" font-weight="bold">INSCRIBED CIRCLE (tangent to all 3 sides)</text>
<polygon points="490,35 385,255 595,255" fill="rgba(30,64,175,.05)" stroke="#0f172a" stroke-width="2"/>
<circle cx="490" cy="200" r="55" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="6,3"/>
<circle cx="490" cy="200" r="4" fill="#ea580c"/>
<text x="495" y="198" fill="#ea580c" font-size="8">I (incenter)</text>
<line x1="490" y1="35" x2="490" y2="260" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="385" y1="255" x2="545" y2="130" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="595" y1="255" x2="430" y2="130" stroke="#1e40af" stroke-width="1" stroke-dasharray="3,2"/>
<line x1="490" y1="200" x2="490" y2="255" stroke="#64748b" stroke-width="1"/>
<text x="494" y="233" fill="#64748b" font-size="8">r</text>
<text x="352" y="282" font-size="8" fill="#64748b">◆ Center = intersection of angle bisectors of all 3 angles</text>
<rect x="16" y="300" width="608" height="32" fill="#dbeafe" rx="6"/>
<text x="26" y="313" font-size="8" fill="#1e40af" font-weight="bold">Circumcircle:</text><text x="100" y="313" font-size="8" fill="#0f172a"> bisect 2 sides → perp. bisectors cross at O → radius = OA = OB = OC</text>
<text x="26" y="327" font-size="8" fill="#1e40af" font-weight="bold">Incircle:</text><text x="82" y="327" font-size="8" fill="#0f172a"> bisect 2 angles → bisectors cross at I → drop perpendicular from I to any side = radius r</text>
</svg>`,
    // ... (rest of diagrams would go here)
};

const TOPICS: Topic[] = [
    {num:1,  title:"Bisect Lines, Parallel Lines, Divide Lines & Bisect Angles", url:"https://youtu.be/AzZ8zjJN6w4", vid:"AzZ8zjJN6w4", tag:"Geometric Construction", desc:"The foundation of engineering drawing. Learn to <strong>bisect a line</strong>, draw <strong>parallel lines</strong> at any distance, <strong>divide a line</strong> into equal parts, and <strong>bisect any angle</strong> with compass and straight edge only.", concepts:["Perpendicular Bisector","Parallel Lines","Equal Division","Angle Bisector"]},
    {num:2,  title:"Circumscribe a Circle on a Triangle & Inscribe a Circle in a Triangle", url:"https://youtu.be/_KXB6a14VM0", vid:"_KXB6a14VM0", tag:"Circles & Triangles", desc:"Two classical constructions. The <strong>circumscribed circle</strong> passes through all vertices (perpendicular bisectors). The <strong>inscribed circle</strong> is tangent to all sides (angle bisectors).", concepts:["Circumcircle","Incircle","Perpendicular Bisectors","Angle Bisectors","Circumcenter","Incenter"]},
    {num:3,  title:"Construct 22.5° and 112.5° Angles", url:"https://youtu.be/BnYelTEuHAE", vid:"BnYelTEuHAE", tag:"Angle Construction", desc:"No protractor needed. 22.5° is obtained by bisecting 45°; 112.5° = 90° + 22.5°. A purely geometric approach using compass and straight edge.", concepts:["22.5°","112.5°","Angle Bisection","45° construction","90° base"]},
    {num:4,  title:"Regular Hexagon – Across Corner & Across Flat Methods", url:"https://youtu.be/KwJIAMI_f8A", vid:"KwJIAMI_f8A", tag:"Polygons", desc:"Essential for bolts, nuts and honeycomb. Across-corner uses the circumscribed circle (side = radius). Across-flat uses the inscribed circle diameter.", concepts:["Hexagon","Across Corners","Across Flats","Circumscribed","Inscribed Circle"]},
    {num:5,  title:"Construct Any Regular Polygon – Pentagon Example", url:"https://youtu.be/z8CKgKvfxaM", vid:"z8CKgKvfxaM", tag:"Polygons", desc:"A powerful general method for constructing any regular polygon given a side length. Works for any number of sides (5, 7, 9, 11…) using semicircle division.", concepts:["Pentagon","Regular Polygon","General Method","Semicircle Division","Any N-gon"]},
    {num:6,  title:"Determine the Circumference of a Circle – Graphical Method", url:"https://youtu.be/Vm_lrebPL4Q", vid:"Vm_lrebPL4Q", tag:"Circles", desc:"Graphical rectification to find circumference without using π directly. Lay off 3 diameters then add correction — gives length ≈ πd with error <0.02%.", concepts:["Circumference","Rectification","π approximation","Arc Unwrapping","Diameter"]},
    {num:7,  title:"Draw an Arc Touching Two Given Circles Externally", url:"https://youtu.be/tiVjWRXWTLs", vid:"tiVjWRXWTLs", tag:"Tangency", desc:"Construct an arc of given radius externally tangent to two circles simultaneously. Center found by striking loci (R+r₁) and (R+r₂). Critical for cam profiles.", concepts:["External Tangency","Arc Construction","Locus of Centers","Blending Curves","Two-circle tangent"]},
    {num:8,  title:"Application of Tangents", url:"https://youtu.be/5K-9AIb0VG8", vid:"5K-9AIb0VG8", tag:"Tangency", desc:"Smooth transitions via internal and external tangency. Covers tangent lines from external points to circles and combining these in real design scenarios.", concepts:["Tangent Lines","Internal Tangent","External Tangent","Circle-to-Line","Transition Curves"]},
    {num:9,  title:"How to Construct a Spanner", url:"https://youtu.be/RPjwg3gXw7E", vid:"RPjwg3gXw7E", tag:"Applied Drawing", desc:"Practical exercise combining hexagons, arcs, tangent lines and circles to draw a spanner — consolidating all previous geometric skills in one real component.", concepts:["Hexagon jaw","Blending arcs","Engineering component","Tangent arcs","Technical drawing"]},
    {num:10, title:"Ellipse – Auxiliary Circle Method", url:"https://youtu.be/4NkRtLcGll0", vid:"4NkRtLcGll0", tag:"Conic Sections", desc:"The concentric circles method: combine x from the outer circle with y from the inner circle. Systematic and accurate — ideal for exam and exam prep.", concepts:["Major Axis","Minor Axis","Concentric Circles","Auxiliary Circle","Ellipse Points"]},
    {num:11, title:"Ellipse – Four Arc (Oblong) Method", url:"https://youtu.be/Gqo9uPr9-Lk", vid:"Gqo9uPr9-Lk", tag:"Conic Sections", desc:"The four-arc approximate method uses four circular arcs of two radii. Quicker than the auxiliary circle method — very useful for engineering contexts.", concepts:["Four Arcs","Approximate Ellipse","Two Radii","Arc Centers","Quick Method"]},
    {num:12, title:"Parabola – Locus Method", url:"https://youtu.be/_EAbV6qEaW4", vid:"_EAbV6qEaW4", tag:"Conic Sections", desc:"A parabola is equidistant from a fixed focus and fixed directrix. Applications: satellite dishes, bridge arches, headlight reflectors (e = 1).", concepts:["Focus","Directrix","Locus of Points","Equidistant","Parabola Vertex"]},
    {num:13, title:"Hyperbola – Locus Method", url:"https://youtu.be/Q-iVvFkgatA", vid:"Q-iVvFkgatA", tag:"Conic Sections", desc:"The difference of distances from two fixed foci is constant. Applications: cooling towers, sonic boom wavefronts, GPS navigation (e > 1).", concepts:["Two Foci","Constant Difference","Hyperbola Branches","Asymptotes","Transverse Axis"]},
    {num:14, title:"Construct a Cycloid", url:"https://youtu.be/r7pDNvYYco4", vid:"r7pDNvYYco4", tag:"Roulette Curves", desc:"A cycloid is traced by a point on the rim of a circle rolling along a straight line. Divide circle and base into equal parts and track the point. Used in gear tooth profiles.", concepts:["Rolling Circle","Tracing Point","Equal Divisions","Gear Profiles","Brachistochrone"]},
    {num:15, title:"Slider–Crank Mechanism", url:"https://youtu.be/Gpu4u34dNtA", vid:"Gpu4u34dNtA", tag:"Mechanisms", desc:"The slider-crank converts rotational motion to linear reciprocating motion (piston engines). Draw at various crank positions and determine stroke length.", concepts:["Crank","Connecting Rod","Slider","Stroke","Piston Engine","Mechanism Drawing"]},
    {num:16, title:"Ellipse + Parabola + Hyperbola – Locus Method (Combined)", url:"https://youtu.be/0IKAvgyoN-A", vid:"0IKAvgyoN-A", tag:"Conic Sections", desc:"All three conic sections using the unified focus-directrix locus definition. The type is determined by eccentricity e: e<1 = ellipse, e=1 = parabola, e>1 = hyperbola.", concepts:["Eccentricity","Focus-Directrix","Ellipse e<1","Parabola e=1","Hyperbola e>1","Unified Locus"]},
    {num:17, title:"Isometric, Pictorial & Orthographic Projections – Part 1", url:"https://youtu.be/I00nCPcl1ew", vid:"I00nCPcl1ew", tag:"Projections", desc:"Orthographic shows objects in multiple 2D views. Isometric is a 3D pictorial where all axes make 120°. Introduces notation, grid and first/third angle projection.", concepts:["Orthographic","Isometric Grid","Three Views","Foreshortening","1st Angle","3rd Angle"]},
    {num:18, title:"Isometric, Pictorial & Orthographic Projections – Part 2", url:"https://youtu.be/oY-45fk30fQ", vid:"oY-45fk30fQ", tag:"Projections", desc:"Converting orthographic views into isometric pictorials and vice versa. Includes hidden lines, centerlines, dimensioning and complex objects with holes and curves.", concepts:["Isometric Circles","Hidden Lines","Dimensioning","View Conversion","Complex Solids"]}
];

// Helper to sanitize title for attributes
const sanitize = (str: string) => str.replace(/"/g, '&quot;');

/**
 * Build HTML for a tutorial card
 */
function buildCard(topic: Topic): string {
    const chips = topic.concepts.map(c => `<span class="chip">${c}</span>`).join('');
    const svg = DIAGRAMS[topic.num] || '';
    const safeTitle = sanitize(topic.title);
    
    // Generate YouTube thumbnails for the preview strip
    const thumbs = ['maxresdefault', 'mqdefault', 'default']
        .map(quality => `
            <img src="https://img.youtube.com/vi/${topic.vid}/${quality}.jpg" 
                 alt="${safeTitle}" 
                 loading="lazy" 
                 onerror="this.src='https://img.youtube.com/vi/${topic.vid}/hqdefault.jpg';this.onerror=null;" 
                 data-vid="${topic.vid}"
                 class="thumb-img"/>
        `).join('');

    return `
        <div class="card" data-num="${topic.num}">
            <div class="card-header">
                <div class="card-num">${String(topic.num).padStart(2, '0')}</div>
                <div class="card-title">${topic.title}</div>
                <i class="fa-brands fa-youtube card-yt-icon"></i>
            </div>
            <div class="card-tag-strip">
                <span class="card-tag"><i class="fa-solid fa-tag"></i> ${topic.tag}</span>
            </div>
            <div class="diagram-panel" data-num="${topic.num}" data-title="${safeTitle}" title="Click to enlarge">
                ${svg}
                <div class="diagram-label"><i class="fa-solid fa-drafting-compass"></i> Diagram</div>
                <div class="expand-hint"><i class="fa-solid fa-expand"></i> Expand</div>
            </div>
            <div class="thumb-strip">
                ${thumbs}
                <div class="thumb-strip-label"><i class="fa-solid fa-images"></i> Previews</div>
            </div>
            <div class="video-wrap">
                <div class="video-placeholder" data-vid="${topic.vid}">
                    <img src="https://img.youtube.com/vi/${topic.vid}/hqdefault.jpg" alt="thumbnail" loading="lazy">
                    <div class="play-ring"><i class="fa-solid fa-play"></i></div>
                    <span class="play-label">Watch tutorial</span>
                </div>
            </div>
            <div class="card-body">
                <p class="card-desc">${topic.desc}</p>
                <div class="concepts">${chips}</div>
                <a class="watch-btn" href="${topic.url}" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i> Open on YouTube</a>
            </div>
        </div>
    `;
}

/**
 * Lightbox management
 */
function openLightbox(num: number, title: string) {
    const lbTitle = document.getElementById('lb-title');
    const lbSvg = document.getElementById('lb-svg');
    const lightbox = document.getElementById('lightbox');

    if (lbTitle) lbTitle.innerHTML = `#${num} &mdash; ${title}`;
    if (lbSvg) {
        lbSvg.innerHTML = DIAGRAMS[num] || '';
        const svg = lbSvg.querySelector('svg');
        if (svg) {
            svg.removeAttribute('height');
            svg.style.height = 'auto';
        }
    }
    
    if (lightbox) {
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }
}

/**
 * YouTube Video Loading
 */
function loadVideo(container: HTMLElement, vid: string) {
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
}

/**
 * Main Render Logic
 */
function renderAll(list: Topic[]) {
    const grid = document.getElementById('topicGrid');
    const badge = document.getElementById('countBadge');

    if (grid) {
        grid.innerHTML = list.length
            ? list.map(buildCard).join('')
            : `<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><h3>No results found</h3><p>Try searching for a topic like "ellipse", "hexagon" or "projection".</p></div>`;
    }

    if (badge) {
        badge.textContent = `${list.length} topic${list.length !== 1 ? 's' : ''}`;
    }

    // Attach dynamic event listeners after rendering
    attachCardListeners();
}

/**
 * Event Listener Binding for dynamic content
 */
function attachCardListeners() {
    // Lightbox triggers
    document.querySelectorAll('.diagram-panel').forEach(panel => {
        panel.addEventListener('click', () => {
            const num = parseInt(panel.getAttribute('data-num') || '0');
            const title = panel.getAttribute('data-title') || '';
            openLightbox(num, title);
        });
    });

    // Main play buttons
    document.querySelectorAll('.video-placeholder').forEach(ph => {
        ph.addEventListener('click', (e) => {
            const vid = (ph as HTMLElement).getAttribute('data-vid') || '';
            loadVideo(ph.parentElement!, vid);
        });
    });

    // Thumbnail strip clicks
    document.querySelectorAll('.thumb-img').forEach(img => {
        img.addEventListener('click', () => {
            const vid = img.getAttribute('data-vid') || '';
            const card = img.closest('.card');
            const videoWrap = card?.querySelector('.video-wrap') as HTMLElement;
            if (videoWrap) {
                loadVideo(videoWrap, vid);
                videoWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });
}

/**
 * Search and Filtering
 */
function handleSearch() {
    const input = document.getElementById('searchInput') as HTMLInputElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const query = input?.value.toLowerCase().trim() || '';

    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    const filtered = TOPICS.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.tag.toLowerCase().includes(query) ||
        t.concepts.some(c => c.toLowerCase().includes(query)) ||
        t.desc.toLowerCase().includes(query)
    );

    renderAll(filtered);
}

function clearSearch() {
    const input = document.getElementById('searchInput') as HTMLInputElement;
    if (input) input.value = '';
    handleSearch();
}

// Global Initialization
window.addEventListener('DOMContentLoaded', () => {
    renderAll(TOPICS);

    // Search events
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    document.getElementById('clearBtn')?.addEventListener('click', clearSearch);

    // Lightbox close events
    document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeLightbox();
    });

    // Back to top
    window.addEventListener('scroll', () => {
        const btt = document.getElementById('btt');
        if (btt) btt.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });

    document.getElementById('btt')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
