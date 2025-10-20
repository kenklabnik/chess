const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const cssContent = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, 'chess.js'), 'utf8');

class ChessTestSuite {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.dom = null;
        this.window = null;
        this.document = null;
        this.game = null;
    }

    setupDOM() {
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>${cssContent}</style>
                </head>
                <body>
                    <div id="chessboard"></div>
                    <div id="status"></div>
                    <button id="reset-button">Reset</button>
                    <script>${jsContent}</script>
                </body>
            </html>
        `;

        this.dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
        this.window = this.dom.window;
        this.document = this.window.document;

        return new Promise((resolve) => {
            this.window.addEventListener('load', () => {
                this.game = new this.window.ChessGame();
                resolve();
            });
        });
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

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(`${message}: value should not be null`);
        }
    }

    async runTest(name, testFn) {
        await this.setupDOM();
        try {
            await testFn.call(this);
            this.passed++;
            console.log(`  PASS: ${name}`);
        } catch (error) {
            this.failed++;
            console.log(`  FAIL: ${name}`);
            console.log(`        ${error.message}`);
        }
    }

    async testPieceClickability() {
        await this.runTest('Piece elements should allow click events to bubble to square', () => {
            const chessboard = this.document.getElementById('chessboard');
            const squares = chessboard.querySelectorAll('.square');

            this.assertTrue(squares.length === 64, 'Should have 64 squares');

            const whiteRookSquare = squares[7 * 8 + 0];
            const pieceElement = whiteRookSquare.querySelector('.piece');

            this.assertNotNull(pieceElement, 'White rook should have a piece element');

            const computedStyle = this.window.getComputedStyle(pieceElement);
            const pointerEvents = computedStyle.getPropertyValue('pointer-events');

            this.assertEquals(pointerEvents, 'none',
                'Piece should have pointer-events: none to allow clicks to bubble');
        });
    }

    async testSquareClickWhenPiecePresent() {
        await this.runTest('Clicking on a piece should select the square', () => {
            const chessboard = this.document.getElementById('chessboard');

            const whiteRookSquare = chessboard.querySelector('[data-row="7"][data-col="0"]');
            this.assertNotNull(whiteRookSquare, 'White rook square should exist');

            const pieceElement = whiteRookSquare.querySelector('.piece');
            this.assertNotNull(pieceElement, 'White rook should have a piece element');

            const clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });

            pieceElement.dispatchEvent(clickEvent);

            const selectedSquare = this.game.selectedSquare;
            this.assertNotNull(selectedSquare, 'A square should be selected after clicking piece');
            this.assertEquals(selectedSquare.row, 7, 'Selected row should be 7');
            this.assertEquals(selectedSquare.col, 0, 'Selected col should be 0');
        });
    }

    async testSelectingPieceHighlightsValidMoves() {
        await this.runTest('Selecting a piece should highlight valid moves', () => {
            const chessboard = this.document.getElementById('chessboard');

            const whitePawnSquare = chessboard.querySelector('[data-row="6"][data-col="4"]');
            const pieceElement = whitePawnSquare.querySelector('.piece');

            const clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });

            pieceElement.dispatchEvent(clickEvent);

            const validMoveSquares = chessboard.querySelectorAll('.valid-move');
            this.assertTrue(validMoveSquares.length > 0,
                'Should have at least one valid move highlighted');
        });
    }

    async testClickingEmptySquareDoesNothing() {
        await this.runTest('Clicking on an empty square without selection does nothing', () => {
            const chessboard = this.document.getElementById('chessboard');

            const emptySquare = chessboard.querySelector('[data-row="4"][data-col="4"]');

            const clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });

            emptySquare.dispatchEvent(clickEvent);

            const selectedSquare = this.game.selectedSquare;
            this.assertEquals(selectedSquare, null, 'No square should be selected');
        });
    }

    async testMovingPieceToValidSquare() {
        await this.runTest('Moving a piece to a valid square should work', () => {
            const chessboard = this.document.getElementById('chessboard');

            const whitePawnSquare = chessboard.querySelector('[data-row="6"][data-col="4"]');
            const pieceElement = whitePawnSquare.querySelector('.piece');

            let clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });
            pieceElement.dispatchEvent(clickEvent);

            const targetSquare = chessboard.querySelector('[data-row="4"][data-col="4"]');
            clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });
            targetSquare.dispatchEvent(clickEvent);

            this.assertEquals(this.game.board[4][4].type, 'pawn',
                'Pawn should be at target square');
            this.assertEquals(this.game.board[4][4].color, 'white',
                'Moved piece should be white');
            this.assertEquals(this.game.board[6][4], null,
                'Original square should be empty');
            this.assertEquals(this.game.currentTurn, 'black',
                'Turn should switch to black');
        });
    }

    async testCannotSelectOpponentPiece() {
        await this.runTest('Cannot select opponent piece on their turn', () => {
            const chessboard = this.document.getElementById('chessboard');

            const blackPawnSquare = chessboard.querySelector('[data-row="1"][data-col="0"]');
            const pieceElement = blackPawnSquare.querySelector('.piece');

            this.assertEquals(this.game.currentTurn, 'white', 'Should be white turn');

            const clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });
            pieceElement.dispatchEvent(clickEvent);

            const selectedSquare = this.game.selectedSquare;
            this.assertEquals(selectedSquare, null,
                'Should not select black piece on white turn');
        });
    }

    async testDeselectPieceByClickingAgain() {
        await this.runTest('Clicking the same piece again should deselect it', () => {
            const chessboard = this.document.getElementById('chessboard');

            const whitePawnSquare = chessboard.querySelector('[data-row="6"][data-col="4"]');
            const pieceElement = whitePawnSquare.querySelector('.piece');

            let clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });
            pieceElement.dispatchEvent(clickEvent);

            this.assertNotNull(this.game.selectedSquare, 'Should be selected');

            clickEvent = new this.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: this.window
            });
            pieceElement.dispatchEvent(clickEvent);

            this.assertEquals(this.game.selectedSquare, null,
                'Should be deselected after clicking again');
        });
    }

    async runAllTests() {
        console.log('\nRunning Chess Game Tests...\n');

        await this.testPieceClickability();
        await this.testSquareClickWhenPiecePresent();
        await this.testSelectingPieceHighlightsValidMoves();
        await this.testClickingEmptySquareDoesNothing();
        await this.testMovingPieceToValidSquare();
        await this.testCannotSelectOpponentPiece();
        await this.testDeselectPieceByClickingAgain();

        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed\n`);

        if (this.failed > 0) {
            process.exit(1);
        }
    }
}

const testSuite = new ChessTestSuite();
testSuite.runAllTests();
