# Feature Plan: Move History Display

## Overview

Add a visual move history panel to the chess game that displays all moves in standard algebraic notation. The game already tracks moves internally in the `moveHistory` array - this feature will make that data visible to players.

## Current State Analysis

✅ **Already implemented:**
- Move tracking in `moveHistory` array (chess.js:41)
- Rich move data stored including:
  - From/to positions
  - Piece type and color
  - Captured pieces
  - Turn number
  - Special moves (castling, en passant, etc.)

❌ **Not yet implemented:**
- UI panel to display moves
- Conversion to algebraic notation
- Visual formatting and styling

## Feature Breakdown

### Issues Created in Beads Tracker

**chess-10** [P1] Create move notation converter function
- Convert internal move data to algebraic notation
- Handle standard moves (e4, Nf3, etc.)
- Handle special notation (O-O for castling, x for capture, + for check)
- No blockers - can start immediately

**chess-11** [P1] Add move history panel to HTML
- Add new `<div id="move-history">` container to index.html
- Position next to the chessboard
- Include header and scrollable content area
- No blockers - can start immediately

**chess-12** [P2] Style the move history panel
- Depends on: chess-11
- CSS styling for layout and appearance
- Scrollable container for long games
- Typography matching the chess theme
- Responsive design for mobile

**chess-13** [P2] Update move history display after each move
- Depends on: chess-10, chess-11
- Create `renderMoveHistory()` function
- Call after each move is made
- Clear and rebuild on new game

**chess-14** [P3] Add move numbering and formatting
- Depends on: chess-13
- Format as: "1. e4 e5  2. Nf3 Nc6"
- Pair white/black moves together
- Proper chess scoresheet format

## Implementation Approach

### Phase 1: Core Infrastructure (chess-10, chess-11)
These can be developed in parallel:
- Function to convert moves to notation
- HTML structure for display panel

### Phase 2: Integration (chess-12, chess-13)
- Style the panel
- Wire up the display logic
- Test with actual gameplay

### Phase 3: Polish (chess-14)
- Enhanced formatting
- Professional scoresheet appearance

## Example Output

After implementing, players will see:
```
Move History
────────────
1. e4   e5
2. Nf3  Nc6
3. Bb5  a6
4. Ba4  Nf6
...
```

## Technical Notes

### Algebraic Notation Rules
- Pieces: K (King), Q (Queen), R (Rook), B (Bishop), N (Knight)
- Pawns: just the square (e4, not pe4)
- Captures: piece + 'x' + square (Nxe5)
- Castling: O-O (kingside), O-O-O (queenside)
- Check: + suffix
- Checkmate: # suffix
- Disambiguation: add file/rank when needed (Nbd7, R1e2)

### UI Considerations
- Fixed height with scrolling for long games
- Auto-scroll to latest move
- Clear on new game
- Mobile-friendly layout

## Dependencies Graph

```
chess-10 (notation) ──┐
                      ├──> chess-13 (display) ──> chess-14 (formatting)
chess-11 (HTML) ──────┘         ↑
                                │
chess-12 (CSS) ─────────────────┘
```

## Ready to Start

Two issues are **ready to work on now** (no blockers):
- ✅ chess-10: Create move notation converter
- ✅ chess-11: Add move history panel to HTML

## Next Steps

1. Implement chess-10 and chess-11 in parallel
2. Test notation converter with various move types
3. Add styling (chess-12)
4. Integrate display updates (chess-13)
5. Polish formatting (chess-14)

Estimated total implementation time: 2-3 hours
