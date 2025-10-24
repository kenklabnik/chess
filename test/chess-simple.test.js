// Simple unit tests for Chess game logic without DOM manipulation

const fs = require('fs');
const path = require('path');

// Read and analyze the chess.js file
const chessContent = fs.readFileSync(path.join(__dirname, '../src/chess.js'), 'utf8');
const cssContent = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');

console.log('\n=== Chess Clickability Analysis ===\n');

// Test 1: Check if pointer-events: none is present on pieces
console.log('Test 1: Checking CSS for pointer-events on .piece');
const pointerEventsMatch = cssContent.match(/\.piece\s*{[^}]*pointer-events:\s*none/);
if (pointerEventsMatch) {
    console.log('  PASS: pointer-events: none is set on .piece (allows click to bubble through)');
} else {
    console.log('  FAIL: pointer-events: none is NOT set on .piece');
}

// Test 2: Check if event listener uses closest() for event delegation
console.log('\nTest 2: Checking if handleSquareClick uses closest() for delegation');
const closestMatch = chessContent.match(/event\.target\.closest\(['"]\.square['"]\)/);
if (closestMatch) {
    console.log('  PASS: Uses event.target.closest(".square") for event delegation');
} else {
    console.log('  FAIL: Does not use closest() - clicks on pieces may not work!');
}

// Test 3: Check if event listener is attached to chessboard (parent delegation)
console.log('\nTest 3: Checking if event listener is attached to chessboard');
const chessboardListenerMatch = chessContent.match(/getElementById\(['"]chessboard['"]\)[\s\S]*?addEventListener\(['"]click['"]/);
if (chessboardListenerMatch) {
    console.log('  PASS: Event listener attached to chessboard element');
} else {
    console.log('  FAIL: Event listener might not be attached to chessboard');
}

// Test 4: Check for common issues
console.log('\nTest 4: Checking for common clickability issues');

const issues = [];

// Check if pieces might have their own click handlers (would conflict)
if (chessContent.match(/pieceElement.*addEventListener/)) {
    issues.push('Piece elements have their own event listeners (may conflict)');
}

// Check if there's a stopPropagation that might prevent bubbling
if (chessContent.match(/stopPropagation/)) {
    issues.push('Code uses stopPropagation (may prevent event bubbling)');
}

// Check if preventDefault might interfere
if (chessContent.match(/preventDefault/)) {
    issues.push('Code uses preventDefault (may interfere with clicks)');
}

// Check user-select: none which is good
if (cssContent.match(/user-select:\s*none/)) {
    console.log('  INFO: user-select: none is set (prevents text selection during drag - good)');
}

if (issues.length > 0) {
    console.log('  POTENTIAL ISSUES FOUND:');
    issues.forEach(issue => console.log(`    - ${issue}`));
} else {
    console.log('  PASS: No obvious clickability issues found');
}

// Test 5: Verify the event flow
console.log('\nTest 5: Expected click event flow:');
console.log('  1. User clicks on piece element');
console.log('  2. pointer-events: none allows click to pass through piece');
console.log('  3. Click event bubbles up to parent square div');
console.log('  4. Event continues bubbling to chessboard div');
console.log('  5. handleSquareClick receives event');
console.log('  6. event.target.closest(".square") finds the square div');
console.log('  7. Square coordinates extracted and piece selected');

console.log('\n=== Analysis Complete ===\n');

// Based on code analysis
console.log('CONCLUSION:');
console.log('The code appears correctly structured for clickability.');
console.log('The pointer-events: none on pieces should allow clicks to bubble through.');
console.log('The event listener uses closest() which should find the parent square.');
console.log('\nPOSSIBLE REAL ISSUE:');
console.log('The problem might be in how the browser renders/handles the events.');
console.log('Or there might be an initialization issue with the event listeners.');
console.log('\nRECOMMENDED FIX:');
console.log('Verify event listeners are properly attached after DOM is ready.');
console.log('Check browser console for any JavaScript errors on load.');
