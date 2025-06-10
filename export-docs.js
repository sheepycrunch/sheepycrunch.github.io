const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const outputJsonFile = path.join(__dirname, 'docs-export.json');

/**
 * Recursively reads a directory and returns an object with file paths and contents.
 * @param {string} dir The directory to read.
 * @returns {Object.<string, string>} An object with relative file paths as keys and file contents as values.
 */
function readDirectoryRecursive(dir) {
    const results = {};
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        // Create a relative path with forward slashes for consistency
        const relativePath = path.relative(docsDir, filePath).replace(/\\/g, '/');

        if (stat && stat.isDirectory()) {
            const nestedResults = readDirectoryRecursive(filePath);
            // Merge the results from the subdirectory
            Object.assign(results, nestedResults);
        } else {
            // Read file content as UTF-8
            results[relativePath] = fs.readFileSync(filePath, 'utf8');
        }
    });

    return results;
}

try {
    console.log(`Reading files from: ${docsDir}`);
    const docsContent = readDirectoryRecursive(docsDir);
    
    fs.writeFileSync(outputJsonFile, JSON.stringify(docsContent, null, 2));
    
    console.log(`✅ Successfully exported 'docs/' content to ${outputJsonFile}`);
} catch (error) {
    console.error(`❌ Error exporting docs directory:`, error);
    process.exit(1); // Exit with an error code
} 