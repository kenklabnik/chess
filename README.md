*Note: this is a simple browser chess implementation done by Claude using the Beads issue tracker linked below. The rest of this README is Claude-generated, but I figured I'd offer a little extra commentary.*

*Once I had Beads and an agent set up, development proceeded roughly as follows: I told Claude we were implementing a simple browser-based chess game and told it to write issues for the issue tracker. I ran the agent once, which took just under ten minutes. It took two more runs to fix a bug, which was done by me telling Claude to interact with the issue tracker and then run the agent. The second time I told it to implement unit tests to be sure, which took maybe 7-8 minutes. At that point everything seemed in order, so I had it generate this README (which initially misattributed Beads so that had to be fixed). All of the above described steps took maybe 35% of my Claude Pro token limit, using Sonnet 4.5.*

*Overall, it was a pretty solid experience that was remarkably hands-off even by Claude Code standards--the main hiccup was my own insistence on running Claude in a container, which I did to justify using --dangerously-skip-permissions to myself, which was needed because the agent wasn't inheriting Claude's own permissions. I hadn't done that before, so it should go much faster in the future. None of which has much to do with the project itself.*

*Hopefully you find this interesting! -Ken*

# Chess Game

A browser-based chess game implementation with a clean, intuitive interface.

## Overview

This chess game was created by a Claude AI agent with development assistance from [Beads](https://github.com/steveyegge/beads), a lightweight issue tracker with first-class dependency support.

## Features

- Full chess game implementation with piece movement validation
- Click-to-select and click-to-move interface
- Visual highlighting of selected pieces and valid moves
- Turn-based gameplay for White and Black
- New game/reset functionality

## Getting Started

Simply open `index.html` in a web browser to play.

For testing and development:

```bash
npm install
node test-syntax.js  # Verify code structure
```

Or open `test-manual.html` in a browser for interactive testing with debug logging.

## Development

This project was developed using:
- **Claude AI Agent** - Primary implementation
- **Beads Issue Tracker** - Task management and bug tracking
- Issues tracked in `.beads/` directory

## Files

- `index.html` - Main game interface
- `chess.js` - Core game logic
- `styles.css` - Game styling
- `test-*.js` / `test-*.html` - Test files
- `.beads/` - Issue tracker data

## License

Created as a demonstration project.
