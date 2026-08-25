const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../apps/admin/public/images/load.svg');
const outDir = path.join(__dirname, '../apps/admin/public/images/parallax');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

console.log('Reading load.svg...');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Parse rects
const rectRegex = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="url\(#([^)]+)\)"\/>/g;
const rects = [];
let match;
while ((match = rectRegex.exec(svgContent)) !== null) {
    rects.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: parseFloat(match[3]),
        height: parseFloat(match[4]),
        patternId: match[5]
    });
}

console.log(`Found ${rects.length} rects.`);

// Build mapping of pattern to image ID
const patternMap = {};
const patternRegex = /<pattern id="([^"]+)"[\s\S]*?<use xlink:href="#([^"]+)"/g;
while ((match = patternRegex.exec(svgContent)) !== null) {
    patternMap[match[1]] = match[2];
}

console.log(`Found ${Object.keys(patternMap).length} patterns.`);

// Build mapping of image ID to base64
// We need to use a regex that handles large strings without catastrophic backtracking.
const images = [];
let imgRegex = /<image id="([^"]+)" width="([^"]+)" height="([^"]+)"[\s\S]*?xlink:href="data:image\/([^;]+);base64,([^"]+)"\/>/g;
let m;
let imgCount = 0;

while ((m = imgRegex.exec(svgContent)) !== null) {
    const imgId = m[1];
    const type = m[4]; // e.g. png, jpeg
    const base64Data = m[5];
    
    // Save the file
    const ext = type === 'jpeg' ? 'jpg' : type;
    const filename = `layer_${imgCount}.${ext}`;
    const filePath = path.join(outDir, filename);
    
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${filename} (${(base64Data.length / 1024 / 1024).toFixed(2)} MB base64)`);
    
    images.push({
        id: imgId,
        filename: filename,
        originalWidth: m[2],
        originalHeight: m[3]
    });
    
    imgCount++;
}

// Map rects to their saved files
const finalLayers = rects.map((rect, idx) => {
    const imageId = patternMap[rect.patternId];
    const image = images.find(img => img.id === imageId);
    if (!image) {
        console.error(`Could not find image for rect ${idx} (pattern: ${rect.patternId}, imageId: ${imageId})`);
    }
    return {
        ...rect,
        index: idx,
        filename: image ? image.filename : null
    };
});

fs.writeFileSync(path.join(outDir, 'layers.json'), JSON.stringify(finalLayers, null, 2));
console.log('Extraction complete! layers.json created.');
