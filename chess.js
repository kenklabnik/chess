// Chess Game - Main JavaScript File

// Piece class representing a chess piece
class Piece {
    constructor(color, type) {
        this.color = color; // 'white' or 'black'
        this.type = type;   // 'pawn', 'rook', 'knight', 'bishop', 'queen', 'king'
        this.hasMoved = false; // Track if piece has moved (for castling, pawn double-move)
    }

    get symbol() {
        const symbols = {
            white: {
                king: '\u2654',
                queen: '\u2655',
                rook: '\u2656',
                bishop: '\u2657',
                knight: '\u2658',
                pawn: '\u2659'
            },
            black: {
                king: '\u265A',
                queen: '\u265B',
                rook: '\u265C',
                bishop: '\u265D',
                knight: '\u265E',
                pawn: '\u265F'
            }
        };
        return symbols[this.color][this.type];
    }
}

class ChessGame {
    constructor() {
        this.board = null;
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.gameOver = false;
        this.gameOverReason = null;
        this.moveHistory = [];
        this.turnNumber = 1;
        this.enPassantTarget = null;
        this.boundHandleSquareClick = (e) => this.handleSquareClick(e);
        this.boundResetGame = () => this.resetGame();
        this.initializeGame();
    }

    initializeGame() {
        this.setupBoard();
        this.renderBoard();
        this.attachEventListeners();
    }

    setupBoard() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));

        this.board[0][0] = new Piece('black', 'rook');
        this.board[0][1] = new Piece('black', 'knight');
        this.board[0][2] = new Piece('black', 'bishop');
        this.board[0][3] = new Piece('black', 'queen');
        this.board[0][4] = new Piece('black', 'king');
        this.board[0][5] = new Piece('black', 'bishop');
        this.board[0][6] = new Piece('black', 'knight');
        this.board[0][7] = new Piece('black', 'rook');

        for (let col = 0; col < 8; col++) {
            this.board[1][col] = new Piece('black', 'pawn');
        }

        for (let col = 0; col < 8; col++) {
            this.board[6][col] = new Piece('white', 'pawn');
        }

        this.board[7][0] = new Piece('white', 'rook');
        this.board[7][1] = new Piece('white', 'knight');
        this.board[7][2] = new Piece('white', 'bishop');
        this.board[7][3] = new Piece('white', 'queen');
        this.board[7][4] = new Piece('white', 'king');
        this.board[7][5] = new Piece('white', 'bishop');
        this.board[7][6] = new Piece('white', 'knight');
        this.board[7][7] = new Piece('white', 'rook');
    }

    renderBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'piece';
                    pieceElement.textContent = piece.symbol;
                    square.appendChild(pieceElement);
                }

                chessboard.appendChild(square);
            }
        }

        this.updateStatus();
    }

    attachEventListeners() {
        const chessboard = document.getElementById('chessboard');
        if (!chessboard) {
            console.error('Chessboard element not found!');
            return;
        }
        chessboard.removeEventListener('click', this.boundHandleSquareClick);
        chessboard.addEventListener('click', this.boundHandleSquareClick);

        const resetButton = document.getElementById('reset-button');
        if (!resetButton) {
            console.error('Reset button element not found!');
            return;
        }
        resetButton.removeEventListener('click', this.boundResetGame);
        resetButton.addEventListener('click', this.boundResetGame);
    }

    handleSquareClick(event) {
        if (this.gameOver) return;

        const square = event.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (this.selectedSquare) {
            const fromRow = this.selectedSquare.row;
            const fromCol = this.selectedSquare.col;

            if (fromRow === row && fromCol === col) {
                this.clearSelection();
                return;
            }

            const moved = this.movePiece(fromRow, fromCol, row, col);
            if (moved) {
                this.clearSelection();
                this.renderBoard();
            } else {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentTurn) {
                    this.selectSquare(row, col);
                } else {
                    this.clearSelection();
                }
            }
        } else {
            const piece = this.board[row][col];
            if (piece && piece.color === this.currentTurn) {
                this.selectSquare(row, col);
            }
        }
    }

    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.highlightValidMoves(row, col);
    }

    clearSelection() {
        this.selectedSquare = null;
        this.renderBoard();
    }

    highlightValidMoves(row, col) {
        this.renderBoard();

        const chessboard = document.getElementById('chessboard');
        const squares = chessboard.querySelectorAll('.square');

        const selectedIndex = row * 8 + col;
        squares[selectedIndex].classList.add('selected');

        const validMoves = this.getValidMoves(row, col);
        for (const move of validMoves) {
            const index = move.row * 8 + move.col;
            const square = squares[index];
            square.classList.add('valid-move');

            if (this.board[move.row][move.col]) {
                square.classList.add('has-piece');
            }
        }
    }

    resetGame() {
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.gameOver = false;
        this.gameOverReason = null;
        this.moveHistory = [];
        this.turnNumber = 1;
        this.enPassantTarget = null;
        this.setupBoard();
        this.renderBoard();
        this.updateStatus();
    }

    updateStatus() {
        const statusElement = document.getElementById('status');
        if (this.gameOver) {
            if (this.gameOverReason === 'checkmate') {
                const winner = this.currentTurn === 'white' ? 'Black' : 'White';
                statusElement.textContent = `Checkmate! ${winner} wins!`;
            } else if (this.gameOverReason === 'stalemate') {
                statusElement.textContent = 'Stalemate! Game is a draw.';
            } else {
                statusElement.textContent = 'Game Over';
            }
        } else {
            const turn = this.currentTurn.charAt(0).toUpperCase() + this.currentTurn.slice(1);
            let status = `Turn ${this.turnNumber} - ${turn} to move`;

            if (this.isInCheck(this.currentTurn)) {
                status += ' - Check!';
            }

            statusElement.textContent = status;
        }
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    isSquareUnderAttack(row, col, byColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === byColor) {
                    const tempTurn = this.currentTurn;
                    this.currentTurn = byColor;
                    const moves = this.getRawValidMoves(r, c, false);
                    this.currentTurn = tempTurn;

                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isInCheck(color) {
        const king = this.findKing(color);
        if (!king) return false;

        const opposingColor = color === 'white' ? 'black' : 'white';
        return this.isSquareUnderAttack(king.row, king.col, opposingColor);
    }

    getRawValidMoves(fromRow, fromCol, includeCastling = true) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return [];

        const moves = [];

        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(fromRow, fromCol, piece));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(fromRow, fromCol, piece));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(fromRow, fromCol, piece));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(fromRow, fromCol, piece));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(fromRow, fromCol, piece));
                break;
            case 'king':
                moves.push(...this.getKingMoves(fromRow, fromCol, piece, includeCastling));
                break;
        }

        return moves;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        const inCheck = this.isInCheck(piece.color);

        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;

        return inCheck;
    }

    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const tempTurn = this.currentTurn;
                    this.currentTurn = color;
                    const moves = this.getValidMoves(row, col);
                    this.currentTurn = tempTurn;

                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheckmate(color) {
        return this.isInCheck(color) && !this.hasLegalMoves(color);
    }

    isStalemate(color) {
        return !this.isInCheck(color) && !this.hasLegalMoves(color);
    }

    getValidMoves(fromRow, fromCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece || piece.color !== this.currentTurn) {
            return [];
        }

        const rawMoves = this.getRawValidMoves(fromRow, fromCol);

        const legalMoves = rawMoves.filter(move => {
            return !this.wouldBeInCheck(fromRow, fromCol, move.row, move.col);
        });

        return legalMoves;
    }

    getPawnMoves(row, col, piece) {
        const moves = [];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;

        const newRow = row + direction;
        if (this.isValidPosition(newRow, col) && !this.board[newRow][col]) {
            moves.push({ row: newRow, col, type: 'normal' });

            const doubleRow = row + (2 * direction);
            if (row === startRow && !this.board[doubleRow][col]) {
                moves.push({ row: doubleRow, col, type: 'double' });
            }
        }

        const captureLeft = col - 1;
        if (this.isValidPosition(newRow, captureLeft)) {
            const target = this.board[newRow][captureLeft];
            if (target && target.color !== piece.color) {
                moves.push({ row: newRow, col: captureLeft, type: 'normal' });
            } else if (this.enPassantTarget &&
                       this.enPassantTarget.row === newRow &&
                       this.enPassantTarget.col === captureLeft) {
                moves.push({ row: newRow, col: captureLeft, type: 'enpassant' });
            }
        }

        const captureRight = col + 1;
        if (this.isValidPosition(newRow, captureRight)) {
            const target = this.board[newRow][captureRight];
            if (target && target.color !== piece.color) {
                moves.push({ row: newRow, col: captureRight, type: 'normal' });
            } else if (this.enPassantTarget &&
                       this.enPassantTarget.row === newRow &&
                       this.enPassantTarget.col === captureRight) {
                moves.push({ row: newRow, col: captureRight, type: 'enpassant' });
            }
        }

        return moves;
    }

    getRookMoves(row, col, piece) {
        const moves = [];
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
        ];

        for (const { dr, dc } of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }

        return moves;
    }

    getKnightMoves(row, col, piece) {
        const moves = [];
        const knightMoves = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];

        for (const { dr, dc } of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getBishopMoves(row, col, piece) {
        const moves = [];
        const directions = [
            { dr: -1, dc: -1 },
            { dr: -1, dc: 1 },
            { dr: 1, dc: -1 },
            { dr: 1, dc: 1 }
        ];

        for (const { dr, dc } of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }

        return moves;
    }

    getQueenMoves(row, col, piece) {
        return [
            ...this.getRookMoves(row, col, piece),
            ...this.getBishopMoves(row, col, piece)
        ];
    }

    getKingMoves(row, col, piece, includeCastling = true) {
        const moves = [];
        const directions = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];

        for (const { dr, dc } of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (this.isValidPosition(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol, type: 'normal' });
                }
            }
        }

        if (includeCastling && !piece.hasMoved && !this.isInCheck(piece.color)) {
            const baseRow = piece.color === 'white' ? 7 : 0;

            const kingsideRook = this.board[baseRow][7];
            if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
                if (!this.board[baseRow][5] && !this.board[baseRow][6]) {
                    const opposingColor = piece.color === 'white' ? 'black' : 'white';
                    if (!this.isSquareUnderAttack(baseRow, 5, opposingColor) &&
                        !this.isSquareUnderAttack(baseRow, 6, opposingColor)) {
                        moves.push({ row: baseRow, col: 6, type: 'castle-kingside' });
                    }
                }
            }

            const queensideRook = this.board[baseRow][0];
            if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
                if (!this.board[baseRow][1] && !this.board[baseRow][2] && !this.board[baseRow][3]) {
                    const opposingColor = piece.color === 'white' ? 'black' : 'white';
                    if (!this.isSquareUnderAttack(baseRow, 2, opposingColor) &&
                        !this.isSquareUnderAttack(baseRow, 3, opposingColor)) {
                        moves.push({ row: baseRow, col: 2, type: 'castle-queenside' });
                    }
                }
            }
        }

        return moves;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const move = validMoves.find(m => m.row === toRow && m.col === toCol);

        if (!move) return false;

        const capturedPiece = this.board[toRow][toCol];

        this.enPassantTarget = null;

        if (piece.type === 'pawn' && move.type === 'double') {
            const direction = piece.color === 'white' ? -1 : 1;
            this.enPassantTarget = { row: fromRow + direction, col: fromCol };
        }

        if (move.type === 'enpassant') {
            const captureRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.board[captureRow][toCol] = null;
        }

        if (move.type === 'castle-kingside') {
            const baseRow = piece.color === 'white' ? 7 : 0;
            const rook = this.board[baseRow][7];
            this.board[baseRow][5] = rook;
            this.board[baseRow][7] = null;
            rook.hasMoved = true;
        }

        if (move.type === 'castle-queenside') {
            const baseRow = piece.color === 'white' ? 7 : 0;
            const rook = this.board[baseRow][0];
            this.board[baseRow][3] = rook;
            this.board[baseRow][0] = null;
            rook.hasMoved = true;
        }

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { type: piece.type, color: piece.color },
            captured: capturedPiece ? { type: capturedPiece.type, color: capturedPiece.color } : null,
            turn: this.turnNumber,
            player: this.currentTurn,
            moveType: move.type
        });

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.hasMoved = true;

        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.promotePawn(toRow, toCol);
        }

        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

        if (this.currentTurn === 'white') {
            this.turnNumber++;
        }

        if (this.isCheckmate(this.currentTurn)) {
            this.gameOver = true;
            this.gameOverReason = 'checkmate';
        } else if (this.isStalemate(this.currentTurn)) {
            this.gameOver = true;
            this.gameOverReason = 'stalemate';
        }

        return true;
    }

    promotePawn(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.type !== 'pawn') return;

        piece.type = 'queen';
    }
}

let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new ChessGame();
});
