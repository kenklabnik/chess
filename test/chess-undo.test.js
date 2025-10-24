const fs = require('fs');
const path = require('path');

// Load and execute chess.js in a way that exposes classes for testing
const jsContent = fs.readFileSync(path.join(__dirname, '../src/chess.js'), 'utf8');

// Create a minimal DOM mock
const documentMock = {
    getElementById: (id) => {
        const elements = {
            'chessboard': {
                innerHTML: '',
                querySelectorAll: () => [],
                addEventListener: () => {},
                removeEventListener: () => {},
                appendChild: () => {}
            },
            'status': { textContent: '' },
            'reset-button': { addEventListener: () => {}, removeEventListener: () => {} },
            'undo-button': { addEventListener: () => {}, removeEventListener: () => {}, disabled: true },
            'move-list': { innerHTML: '', appendChild: () => {} }
        };
        return elements[id] || null;
    },
    createElement: (tag) => ({
        className: '',
        classList: { add: () => {}, remove: () => {} },
        dataset: {},
        textContent: '',
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
    }),
    addEventListener: () => {}
};

// Set up global document for chess.js
global.document = documentMock;

// Extract classes from chess.js by evaluating in a context
const createContext = () => {
    // Execute chess.js code in the context
    const code = jsContent.replace(/document\.addEventListener\('DOMContentLoaded'.*\}\);/s, '');
    const wrappedCode = `
        (function() {
            ${code}
            return { Piece, ChessGame };
        })()
    `;

    try {
        const exported = eval(wrappedCode);
        return exported;
    } catch (e) {
        console.error('Error loading chess classes:', e);
        throw e;
    }
};

const { Piece, ChessGame } = createContext();

class ChessUndoTestSuite {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.game = null;
    }

    setupGame() {
        // Create a new game instance for each test
        this.game = new ChessGame();
    }

    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    assertTrue(value, message) {
        if (!value) {
            throw new Error(`${message}: expected true, got ${value}`);
        }
    }

    assertFalse(value, message) {
        if (value) {
            throw new Error(`${message}: expected false, got ${value}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(`${message}: value should not be null`);
        }
    }

    assertNull(value, message) {
        if (value !== null && value !== undefined) {
            throw new Error(`${message}: expected null, got ${value}`);
        }
    }

    deepCloneBoard(board) {
        return board.map(row =>
            row.map(piece => piece ? {
                color: piece.color,
                type: piece.type,
                hasMoved: piece.hasMoved
            } : null)
        );
    }

    comparePiece(piece1, piece2) {
        if (piece1 === null && piece2 === null) return true;
        if (piece1 === null || piece2 === null) return false;
        return piece1.color === piece2.color &&
               piece1.type === piece2.type &&
               piece1.hasMoved === piece2.hasMoved;
    }

    compareBoards(board1, board2) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (!this.comparePiece(board1[row][col], board2[row][col])) {
                    return false;
                }
            }
        }
        return true;
    }

    runTest(name, testFn) {
        this.setupGame();
        try {
            testFn.call(this);
            this.passed++;
            console.log(`  PASS: ${name}`);
        } catch (error) {
            this.failed++;
            console.log(`  FAIL: ${name}`);
            console.log(`        ${error.message}`);
        }
    }

    testUndoRegularMove() {
        this.runTest('Should undo a regular pawn move', () => {
            const initialBoard = this.deepCloneBoard(this.game.board);
            const initialTurn = this.game.currentTurn;
            const initialTurnNumber = this.game.turnNumber;

            // Move white pawn e2 to e4
            this.game.movePiece(6, 4, 4, 4);

            // Verify move was made
            this.assertNull(this.game.board[6][4], 'Original square should be empty');
            this.assertNotNull(this.game.board[4][4], 'New square should have piece');
            this.assertEquals(this.game.currentTurn, 'black', 'Turn should switch to black');

            // Undo the move
            this.assertTrue(typeof this.game.undoMove === 'function', 'undoMove should be a function');
            const undoResult = this.game.undoMove();

            // Verify undo worked
            this.assertTrue(undoResult, 'undoMove should return true on success');
            this.assertTrue(this.compareBoards(this.game.board, initialBoard),
                'Board should be restored to initial state');
            this.assertEquals(this.game.currentTurn, initialTurn,
                'Current turn should be restored');
            this.assertEquals(this.game.turnNumber, initialTurnNumber,
                'Turn number should be restored');
        });
    }

    testUndoCapture() {
        this.runTest('Should undo a capture move', () => {
            // Setup: Move white pawn forward, move black pawn forward, then capture
            this.game.movePiece(6, 4, 4, 4); // e2-e4
            this.game.movePiece(1, 3, 3, 3); // d7-d5

            const boardBeforeCapture = this.deepCloneBoard(this.game.board);
            const turnBeforeCapture = this.game.currentTurn;

            // White pawn captures black pawn
            this.game.movePiece(4, 4, 3, 3); // e4xd5

            // Verify capture was made
            this.assertNull(this.game.board[4][4], 'Original square should be empty');
            this.assertNotNull(this.game.board[3][3], 'Capture square should have white pawn');
            this.assertEquals(this.game.board[3][3].color, 'white', 'Should be white pawn');

            // Undo the capture
            this.game.undoMove();

            // Verify board restored including captured piece
            this.assertTrue(this.compareBoards(this.game.board, boardBeforeCapture),
                'Board should be restored including captured piece');
            this.assertEquals(this.game.currentTurn, turnBeforeCapture,
                'Turn should be restored');
        });
    }

    testUndoKingsideCastling() {
        this.runTest('Should undo kingside castling', () => {
            // Setup board for white kingside castling
            this.game.board[7][5] = null; // Clear bishop
            this.game.board[7][6] = null; // Clear knight

            const boardBeforeCastle = this.deepCloneBoard(this.game.board);
            const kingHasMoved = this.game.board[7][4].hasMoved;
            const rookHasMoved = this.game.board[7][7].hasMoved;

            // Perform kingside castling
            this.game.movePiece(7, 4, 7, 6); // O-O

            // Verify castling occurred
            this.assertNotNull(this.game.board[7][6], 'King should be at g1');
            this.assertEquals(this.game.board[7][6].type, 'king', 'Should be king at g1');
            this.assertNotNull(this.game.board[7][5], 'Rook should be at f1');
            this.assertEquals(this.game.board[7][5].type, 'rook', 'Should be rook at f1');
            this.assertNull(this.game.board[7][4], 'e1 should be empty');
            this.assertNull(this.game.board[7][7], 'h1 should be empty');

            // Undo castling
            this.game.undoMove();

            // Verify positions restored
            this.assertTrue(this.compareBoards(this.game.board, boardBeforeCastle),
                'Board should be restored to pre-castle state');
            this.assertEquals(this.game.board[7][4].hasMoved, kingHasMoved,
                'King hasMoved flag should be restored');
            this.assertEquals(this.game.board[7][7].hasMoved, rookHasMoved,
                'Rook hasMoved flag should be restored');
        });
    }

    testUndoQueensideCastling() {
        this.runTest('Should undo queenside castling', () => {
            // Setup board for white queenside castling
            this.game.board[7][1] = null; // Clear knight
            this.game.board[7][2] = null; // Clear bishop
            this.game.board[7][3] = null; // Clear queen

            const boardBeforeCastle = this.deepCloneBoard(this.game.board);
            const kingHasMoved = this.game.board[7][4].hasMoved;
            const rookHasMoved = this.game.board[7][0].hasMoved;

            // Perform queenside castling
            this.game.movePiece(7, 4, 7, 2); // O-O-O

            // Verify castling occurred
            this.assertNotNull(this.game.board[7][2], 'King should be at c1');
            this.assertEquals(this.game.board[7][2].type, 'king', 'Should be king at c1');
            this.assertNotNull(this.game.board[7][3], 'Rook should be at d1');
            this.assertEquals(this.game.board[7][3].type, 'rook', 'Should be rook at d1');
            this.assertNull(this.game.board[7][4], 'e1 should be empty');
            this.assertNull(this.game.board[7][0], 'a1 should be empty');

            // Undo castling
            this.game.undoMove();

            // Verify positions restored
            this.assertTrue(this.compareBoards(this.game.board, boardBeforeCastle),
                'Board should be restored to pre-castle state');
            this.assertEquals(this.game.board[7][4].hasMoved, kingHasMoved,
                'King hasMoved flag should be restored');
            this.assertEquals(this.game.board[7][0].hasMoved, rookHasMoved,
                'Rook hasMoved flag should be restored');
        });
    }

    testUndoEnPassant() {
        this.runTest('Should undo en passant capture', () => {
            // Setup for en passant
            this.game.movePiece(6, 4, 4, 4); // e2-e4
            this.game.movePiece(1, 0, 3, 0); // a7-a5
            this.game.movePiece(4, 4, 3, 4); // e4-e5
            this.game.movePiece(1, 3, 3, 3); // d7-d5 (double move, creates en passant opportunity)

            const boardBeforeEnPassant = this.deepCloneBoard(this.game.board);
            const turnBeforeEnPassant = this.game.currentTurn;
            const enPassantTargetBefore = this.game.enPassantTarget ?
                { row: this.game.enPassantTarget.row, col: this.game.enPassantTarget.col } : null;

            // Perform en passant capture
            this.game.movePiece(3, 4, 2, 3); // e5xd6 (en passant)

            // Verify en passant occurred
            this.assertNotNull(this.game.board[2][3], 'White pawn should be at d6');
            this.assertNull(this.game.board[3][3], 'Captured black pawn should be gone from d5');
            this.assertNull(this.game.board[3][4], 'Original square should be empty');

            // Undo en passant
            this.game.undoMove();

            // Verify board restored including captured pawn
            this.assertTrue(this.compareBoards(this.game.board, boardBeforeEnPassant),
                'Board should be restored including en passant captured piece');
            this.assertEquals(this.game.currentTurn, turnBeforeEnPassant,
                'Turn should be restored');

            // Verify enPassantTarget restored
            if (enPassantTargetBefore) {
                this.assertNotNull(this.game.enPassantTarget, 'enPassantTarget should be restored');
                this.assertEquals(this.game.enPassantTarget.row, enPassantTargetBefore.row,
                    'enPassantTarget row should match');
                this.assertEquals(this.game.enPassantTarget.col, enPassantTargetBefore.col,
                    'enPassantTarget col should match');
            }
        });
    }

    testUndoPawnPromotion() {
        this.runTest('Should undo pawn promotion', () => {
            // Setup: Move white pawn to 7th rank and clear the promotion square
            this.game.board[1][4] = new Piece('white', 'pawn');
            this.game.board[1][4].hasMoved = true;
            this.game.board[0][4] = null; // Clear the black king

            const boardBeforePromotion = this.deepCloneBoard(this.game.board);
            const turnBeforePromotion = this.game.currentTurn;

            // Promote pawn
            this.game.movePiece(1, 4, 0, 4); // e7-e8=Q

            // Verify promotion occurred
            this.assertNotNull(this.game.board[0][4], 'Piece should be at e8');
            this.assertEquals(this.game.board[0][4].type, 'queen', 'Should be promoted to queen');
            this.assertEquals(this.game.board[0][4].color, 'white', 'Should be white queen');

            // Undo promotion
            this.game.undoMove();

            // Verify pawn is restored (not queen)
            this.assertTrue(this.compareBoards(this.game.board, boardBeforePromotion),
                'Board should be restored with pawn, not queen');
            this.assertEquals(this.game.board[1][4].type, 'pawn',
                'Piece should be restored as pawn');
            this.assertEquals(this.game.currentTurn, turnBeforePromotion,
                'Turn should be restored');
        });
    }

    testUndoRestoresHasMovedFlags() {
        this.runTest('Should restore hasMoved flags correctly', () => {
            // Test with a piece that hasn't moved yet
            const piece = this.game.board[7][0]; // White rook
            this.assertFalse(piece.hasMoved, 'Rook should not have moved initially');

            // Move pawn out of the way
            this.game.movePiece(6, 0, 4, 0); // a2-a4
            this.game.movePiece(1, 0, 3, 0); // a7-a5

            // Move rook
            this.game.movePiece(7, 0, 5, 0); // Ra1-Ra3

            this.assertTrue(this.game.board[5][0].hasMoved, 'Rook should have hasMoved=true');

            // Undo rook move
            this.game.undoMove();

            // Verify hasMoved flag is restored to false
            this.assertFalse(this.game.board[7][0].hasMoved,
                'Rook hasMoved flag should be restored to false');
        });
    }

    testUndoUpdatesTurnCorrectly() {
        this.runTest('Should update turn correctly when undoing', () => {
            this.assertEquals(this.game.currentTurn, 'white', 'Should start as white turn');
            this.assertEquals(this.game.turnNumber, 1, 'Should start at turn 1');

            // Make white move
            this.game.movePiece(6, 4, 4, 4); // e2-e4
            this.assertEquals(this.game.currentTurn, 'black', 'Should be black turn');
            this.assertEquals(this.game.turnNumber, 1, 'Should still be turn 1');

            // Make black move
            this.game.movePiece(1, 4, 3, 4); // e7-e5
            this.assertEquals(this.game.currentTurn, 'white', 'Should be white turn');
            this.assertEquals(this.game.turnNumber, 2, 'Should be turn 2');

            // Undo black move
            this.game.undoMove();
            this.assertEquals(this.game.currentTurn, 'black', 'Should be back to black turn');
            this.assertEquals(this.game.turnNumber, 1, 'Should be back to turn 1');

            // Undo white move
            this.game.undoMove();
            this.assertEquals(this.game.currentTurn, 'white', 'Should be back to white turn');
            this.assertEquals(this.game.turnNumber, 1, 'Should still be turn 1');
        });
    }

    testUndoRestoresGameOverState() {
        this.runTest('Should restore game state when undoing from checkmate', () => {
            // Setup fool's mate position
            this.game.movePiece(6, 5, 5, 5); // f2-f3
            this.game.movePiece(1, 4, 3, 4); // e7-e5
            this.game.movePiece(6, 6, 4, 6); // g2-g4

            const boardBeforeMate = this.deepCloneBoard(this.game.board);
            const gameOverBefore = this.game.gameOver;

            // Black delivers checkmate
            this.game.movePiece(0, 3, 4, 7); // Qd8-Qh4# (checkmate)

            // Verify checkmate
            this.assertTrue(this.game.gameOver, 'Game should be over');
            this.assertEquals(this.game.gameOverReason, 'checkmate', 'Should be checkmate');

            // Undo the checkmating move
            this.game.undoMove();

            // Verify game state restored
            this.assertEquals(this.game.gameOver, gameOverBefore,
                'Game over state should be restored');
            this.assertFalse(this.game.gameOver,
                'Game should not be over after undo');
        });
    }

    testUndoWhenNoMovesInHistory() {
        this.runTest('Should handle undo when no moves in history', () => {
            // Verify no moves in history
            this.assertEquals(this.game.moveHistory.length, 0,
                'Move history should be empty initially');

            // Try to undo
            const result = this.game.undoMove();

            // Should return false or handle gracefully
            this.assertFalse(result, 'undoMove should return false when no moves to undo');
        });
    }

    testMultipleUndos() {
        this.runTest('Should handle multiple consecutive undos', () => {
            const initialBoard = this.deepCloneBoard(this.game.board);

            // Make several moves
            this.game.movePiece(6, 4, 4, 4); // e2-e4
            this.game.movePiece(1, 4, 3, 4); // e7-e5
            this.game.movePiece(6, 3, 4, 3); // d2-d4
            this.game.movePiece(1, 3, 3, 3); // d7-d5

            // Undo all moves
            this.game.undoMove();
            this.game.undoMove();
            this.game.undoMove();
            this.game.undoMove();

            // Verify back to initial state
            this.assertTrue(this.compareBoards(this.game.board, initialBoard),
                'Board should be back to initial state after undoing all moves');
            this.assertEquals(this.game.currentTurn, 'white', 'Should be white turn');
            this.assertEquals(this.game.turnNumber, 1, 'Should be turn 1');
            this.assertEquals(this.game.moveHistory.length, 0, 'Move history should be empty');
        });
    }

    testUndoRestoresEnPassantTarget() {
        this.runTest('Should restore enPassantTarget when undoing', () => {
            // Make a double pawn move
            this.game.movePiece(6, 4, 4, 4); // e2-e4 (double move)

            // Verify enPassantTarget is set
            this.assertNotNull(this.game.enPassantTarget, 'enPassantTarget should be set');
            this.assertEquals(this.game.enPassantTarget.row, 5, 'enPassantTarget row should be 5');
            this.assertEquals(this.game.enPassantTarget.col, 4, 'enPassantTarget col should be 4');

            // Make another move (enPassantTarget should clear)
            this.game.movePiece(1, 4, 3, 4); // e7-e5

            // Undo the second move
            this.game.undoMove();

            // Verify enPassantTarget is restored
            this.assertNotNull(this.game.enPassantTarget,
                'enPassantTarget should be restored after undo');
            this.assertEquals(this.game.enPassantTarget.row, 5,
                'Restored enPassantTarget row should be 5');
            this.assertEquals(this.game.enPassantTarget.col, 4,
                'Restored enPassantTarget col should be 4');
        });
    }

    runAllTests() {
        console.log('\nRunning Chess Undo Tests...\n');

        this.testUndoRegularMove();
        this.testUndoCapture();
        this.testUndoKingsideCastling();
        this.testUndoQueensideCastling();
        this.testUndoEnPassant();
        this.testUndoPawnPromotion();
        this.testUndoRestoresHasMovedFlags();
        this.testUndoUpdatesTurnCorrectly();
        this.testUndoRestoresGameOverState();
        this.testUndoWhenNoMovesInHistory();
        this.testMultipleUndos();
        this.testUndoRestoresEnPassantTarget();

        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed\n`);

        if (this.failed > 0) {
            process.exit(1);
        }
    }
}

const testSuite = new ChessUndoTestSuite();
testSuite.runAllTests();
