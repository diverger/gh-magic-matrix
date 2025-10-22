const fs = require('fs');
const path = require('path');

// Mock contribution data - similar to what GitHub API would return
function generateMockContributionData() {
    const contributions = [];
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Generate 53 weeks of data
    for (let week = 0; week < 53; week++) {
        for (let day = 0; day < 7; day++) {
            const date = new Date(oneYearAgo.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
            const count = Math.floor(Math.random() * 10); // Random contribution count
            const level = count === 0 ? 0 : Math.min(4, Math.floor(count / 2) + 1);

            contributions.push({
                x: week,
                y: day,
                date: date.toISOString().split('T')[0],
                count: count,
                level: level
            });
        }
    }
    return contributions;
}

// Simple SVG generation test
function generateTestSVG(outputPath, theme) {
    const contributions = generateMockContributionData();

    // Basic color schemes
    const colors = theme === 'light'
        ? ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
        : ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

    let svg = <svg viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
    <style>
        .snake { animation: snake-move 20s linear infinite; }
        @keyframes snake-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(400px, 0); }
        }
    </style>
;

    // Draw contribution grid
    contributions.forEach(cell => {
        const x = cell.x * 12 + 50;
        const y = cell.y * 12 + 50;
        const color = colors[cell.level];
        svg +=     <rect x="${x}" y="${y}" width="10" height="10" fill="${color}" rx="2"/>
;
    });

    // Add animated snake
    svg +=     <g class="snake">
        <circle cx="60" cy="60" r="5" fill="#7c3aed"/>
        <circle cx="50" cy="60" r="4" fill="#7c3aed"/>
        <circle cx="40" cy="60" r="3" fill="#7c3aed"/>
    </g>
</svg>;

    fs.writeFileSync(outputPath, svg);
    console.log('鉁?Mock SVG generated successfully!');
    console.log('馃搧 Saved to:', outputPath);
    console.log('馃搳 Grid cells:', contributions.length);
    console.log('馃帹 Theme:', theme);
}

// Run the test
const outputPath = process.argv[2];
const theme = process.argv[3];

if (!outputPath || !theme) {
    console.error('Usage: bun run mock-test.js <output-path> <theme>');
    process.exit(1);
}

try {
    generateTestSVG(outputPath, theme);
} catch (error) {
    console.error('鉂?Error generating mock SVG:', error.message);
    process.exit(1);
}
