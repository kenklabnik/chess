# Beads (bd) Workaround for Network-Restricted Environments

## Problem

This environment has network restrictions that prevent installing the official Beads CLI tool:
- DNS resolution fails for `storage.googleapis.com` (Go module proxy)
- Cannot run `go install github.com/steveyegge/beads/cmd/bd@latest`
- Cannot build from source due to missing Go dependencies

## Solution

Created a lightweight Python wrapper (`bd-wrapper.py`) that reads the `.beads/issues.jsonl` file directly, providing basic Beads functionality without requiring the full CLI installation.

## Files Created

1. **bd-wrapper.py** - Python script that parses the JSONL format
2. **bd** - Bash wrapper that makes the Python script work like the real `bd` command

## Usage

### List all issues
```bash
./bd list
```

### List issues by status
```bash
./bd list --status open
./bd list --status closed
```

### Show issue details
```bash
./bd show chess-9
```

### Show statistics
```bash
./bd stats
```

### Show help
```bash
./bd quickstart
```

## Output Example

```
$ ./bd list
● chess-1      [P0] [feature ] Setup project structure with HTML/CSS/JS files
● chess-2      [P0] [feature ] Implement chess board data model
● chess-3      [P1] [feature ] Render chessboard UI in browser
● chess-4      [P1] [feature ] Implement piece movement logic
● chess-5      [P2] [feature ] Add click handlers for piece selection and moves
● chess-6      [P2] [feature ] Implement turn management
● chess-7      [P3] [feature ] Add check and checkmate detection
● chess-8      [P4] [feature ] Add special moves: castling, en passant, promotion
● chess-9      [P2] [bug     ] I am unable to move chess pieces by clicking on them
```

## Limitations

This workaround provides **read-only** functionality:
- ✅ List issues
- ✅ Show issue details
- ✅ View statistics
- ✅ View dependencies
- ❌ Cannot create new issues
- ❌ Cannot update issue status
- ❌ Cannot add dependencies
- ❌ No `ready` command (requires dependency graph analysis)

To create or modify issues, you would need to:
1. Manually edit `.beads/issues.jsonl` (see Beads `TEXT_FORMATS.md` for format)
2. Install the full `bd` CLI in a different environment
3. Use the Beads MCP server if available

## Technical Details

The wrapper:
- Reads `.beads/issues.jsonl` directly (newline-delimited JSON)
- Parses each line as a JSON object
- Formats output similar to the real `bd` CLI
- Supports basic filtering and display operations

Based on the Beads JSONL format documented in the official repository:
https://github.com/steveyegge/beads/blob/main/TEXT_FORMATS.md

## Project Status

All 9 chess project issues are currently **closed**:
- 8 features (chess-1 through chess-8)
- 1 bug fix (chess-9)

The workaround is sufficient for viewing the completed work history.
