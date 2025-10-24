// Test that ChessGame can be instantiated without infinite recursion

const fs = require('fs');
const path = require('path');

console.log('\n=== Testing ChessGame Initialization ===\n');

// Create a minimal DOM simulation
global.document = {
    getElementById: function(id) {
        if (id === 'chessboard') {
            return {
                innerHTML: '',
                appendChild: function() {},
                querySelectorAll: function() { return []; },
                addEventListener: function() {},
                removeEventListener: function() {}
            };
        }
        if (id === 'status') {
            return { textContent: '' };
        }
        if (id === 'reset-button') {
            return {
                addEventListener: function() {},
                removeEventListener: function() {}
            };
        }
        return null;
    },
    createElement: function(tag) {
        return {
            className: '',
            dataset: {},
            textContent: '',
            appendChild: function() {},
            classList: { add: function() {} }
        };
    },
    addEventListener: function() {}
};

// Load the chess code
const chessContent = fs.readFileSync(path.join(__dirname, '../src/chess.js'), 'utf8');

try {
    // Evaluate the chess.js code in the current context
    const vm = require('vm');
    const context = { document: global.document, console };
    vm.runInNewContext(chessContent, context);

    console.log('Step 1: Chess code loaded successfully');

    // Try to create a new instance
    console.log('Step 2: Attempting to create ChessGame instance...');

    const game = new context.ChessGame();

    console.log('Step 3: ChessGame instance created successfully!');
    console.log('  - Board initialized:', game.board !== null);
    console.log('  - Current turn:', game.currentTurn);
    console.log('  - Board size:', game.board ? game.board.length : 'N/A');

    // Test that we can get valid moves without infinite recursion
    console.log('\nStep 4: Testing move generation...');

    const whitePawnMoves = game.getValidMoves(6, 4);
    console.log('  - White pawn e2 has', whitePawnMoves.length, 'valid moves');

    const whiteKnightMoves = game.getValidMoves(7, 1);
    console.log('  - White knight b1 has', whiteKnightMoves.length, 'valid moves');

    console.log('\n=== TEST PASSED ===');
    console.log('ChessGame initializes correctly without infinite recursion!');
    console.log('The infinite loop bug has been fixed.\n');

} catch (error) {
    console.log('\n=== TEST FAILED ===');
    console.log('Error:', error.message);
    console.log('\nStack trace:');
    console.log(error.stack);
    process.exit(1);
}
