// ============================================================================
// WUMPUS WORLD - CORE GAME ENGINE
// Implements Russell & Norvig (AIMA) Specification
// Coordinates: 1-indexed (x, y) where (1, 1) is bottom-left cave entrance
// ============================================================================

const DIRS = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
const DIR_DELTAS = {
    NORTH: { x: 0, y: 1 },
    EAST:  { x: 1, y: 0 },
    SOUTH: { x: 0, y: -1 },
    WEST:  { x: -1, y: 0 }
};

class WumpusWorld {
    constructor(options = {}) {
        this.gridSize = options.gridSize || 4;
        this.pitProb = options.pitProb !== undefined ? options.pitProb : 0.20;
        this.customLayout = options.layout || null;
        this.reset();
    }

    reset() {
        this.agentPos = { x: 1, y: 1 };
        this.agentDir = 'EAST';
        this.hasArrow = true;
        this.hasGold = false;
        this.isAlive = true;
        this.hasEscaped = false;
        this.score = 0;
        this.moves = 0;
        this.isGameOver = false;
        this.gameOverReason = '';

        this.visited = new Set(['1,1']);

        // Last action percepts
        this.lastBump = false;
        this.lastScream = false;

        this.actionLog = [];

        if (this.customLayout) {
            this.loadCustomLayout(this.customLayout);
        } else {
            this.generateRandomWorld();
        }

        // Initial percept at (1, 1)
        this.currentPercept = this.getPercepts();
        this.actionLog.push({
            action: 'START',
            percept: { ...this.currentPercept },
            pos: { ...this.agentPos },
            score: this.score,
            message: 'Entered Wumpus Cave at (1, 1) facing East.'
        });
    }

    loadCustomLayout(layout) {
        this.gridSize = layout.gridSize || 4;
        this.wumpusPos = { ...layout.wumpusPos };
        this.wumpusAlive = true;
        this.goldPos = { ...layout.goldPos };
        this.pits = new Set(layout.pits.map(p => `${p.x},${p.y}`));
    }

    generateRandomWorld() {
        this.pits = new Set();
        this.wumpusAlive = true;

        const allSquares = [];
        for (let x = 1; x <= this.gridSize; x++) {
            for (let y = 1; y <= this.gridSize; y++) {
                if (x === 1 && y === 1) continue; // Start square is always empty
                allSquares.push({ x, y });
            }
        }

        // Shuffle squares
        const shuffled = [...allSquares].sort(() => Math.random() - 0.5);

        // Place Wumpus
        this.wumpusPos = { ...shuffled[0] };

        // Place Gold
        this.goldPos = { ...shuffled[1] };

        // Place Pits with pitProb on remaining squares
        for (let i = 0; i < allSquares.length; i++) {
            const sq = allSquares[i];
            // Start square never has a pit
            if (sq.x === 1 && sq.y === 1) continue;
            // Wumpus square can have a pit or not, usually independent
            if (Math.random() < this.pitProb) {
                this.pits.add(`${sq.x},${sq.y}`);
            }
        }
    }

    // Helper: is position inside grid bounds
    inBounds(x, y) {
        return x >= 1 && x <= this.gridSize && y >= 1 && y <= this.gridSize;
    }

    // Manhattan distance neighbors
    getNeighbors(x, y) {
        const neighbors = [];
        const deltas = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 }
        ];
        for (const d of deltas) {
            const nx = x + d.x;
            const ny = y + d.y;
            if (this.inBounds(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }

    // Check if stench exists at (x, y)
    hasStench(x, y) {
        // In AIMA, Wumpus stinks whether alive or dead
        const neighbors = this.getNeighbors(x, y);
        return neighbors.some(n => n.x === this.wumpusPos.x && n.y === this.wumpusPos.y);
    }

    // Check if breeze exists at (x, y)
    hasBreeze(x, y) {
        const neighbors = this.getNeighbors(x, y);
        return neighbors.some(n => this.pits.has(`${n.x},${n.y}`));
    }

    // Check if glitter exists at (x, y)
    hasGlitter(x, y) {
        return !this.hasGold && this.agentPos.x === this.goldPos.x && this.agentPos.y === this.goldPos.y;
    }

    getPercepts() {
        return {
            stench: this.hasStench(this.agentPos.x, this.agentPos.y),
            breeze: this.hasBreeze(this.agentPos.x, this.agentPos.y),
            glitter: this.hasGlitter(this.agentPos.x, this.agentPos.y),
            bump: this.lastBump,
            scream: this.lastScream
        };
    }

    // Main action dispatcher
    executeAction(action) {
        if (this.isGameOver) return { error: 'Game is over' };

        // Reset step-specific percepts
        this.lastBump = false;
        this.lastScream = false;
        this.moves++;

        let msg = '';

        switch (action) {
            case 'FORWARD':
                msg = this._handleForward();
                break;
            case 'TURN_LEFT':
                msg = this._handleTurnLeft();
                break;
            case 'TURN_RIGHT':
                msg = this._handleTurnRight();
                break;
            case 'GRAB':
                msg = this._handleGrab();
                break;
            case 'SHOOT':
                msg = this._handleShoot();
                break;
            case 'CLIMB':
                msg = this._handleClimb();
                break;
            default:
                return { error: `Unknown action: ${action}` };
        }

        this.currentPercept = this.getPercepts();

        const logEntry = {
            action,
            percept: { ...this.currentPercept },
            pos: { ...this.agentPos },
            dir: this.agentDir,
            score: this.score,
            message: msg
        };
        this.actionLog.push(logEntry);

        return {
            action,
            agentPos: { ...this.agentPos },
            agentDir: this.agentDir,
            percepts: this.currentPercept,
            score: this.score,
            moves: this.moves,
            isAlive: this.isAlive,
            hasGold: this.hasGold,
            hasArrow: this.hasArrow,
            wumpusAlive: this.wumpusAlive,
            isGameOver: this.isGameOver,
            gameOverReason: this.gameOverReason,
            message: msg
        };
    }

    _handleForward() {
        this.score -= 1;
        const delta = DIR_DELTAS[this.agentDir];
        const newX = this.agentPos.x + delta.x;
        const newY = this.agentPos.y + delta.y;

        if (!this.inBounds(newX, newY)) {
            this.lastBump = true;
            return `Bumped into cave wall at (${this.agentPos.x}, ${this.agentPos.y})!`;
        }

        this.agentPos = { x: newX, y: newY };
        this.visited.add(`${newX},${newY}`);

        // Check if stepped on live Wumpus
        if (this.wumpusAlive && newX === this.wumpusPos.x && newY === this.wumpusPos.y) {
            this.isAlive = false;
            this.isGameOver = true;
            this.score -= 1000;
            this.gameOverReason = 'Devoured by the Wumpus! 💀';
            return `Entered (${newX}, ${newY}) and was devoured by the Wumpus!`;
        }

        // Check if stepped into Pit
        if (this.pits.has(`${newX},${newY}`)) {
            this.isAlive = false;
            this.isGameOver = true;
            this.score -= 1000;
            this.gameOverReason = 'Fell into a bottomless Pit! 🕳️';
            return `Stepped into (${newX}, ${newY}) and fell into a bottomless Pit!`;
        }

        return `Moved forward into (${newX}, ${newY}).`;
    }

    _handleTurnLeft() {
        this.score -= 1;
        const idx = DIRS.indexOf(this.agentDir);
        this.agentDir = DIRS[(idx + 3) % 4];
        return `Turned Left. Now facing ${this.agentDir}.`;
    }

    _handleTurnRight() {
        this.score -= 1;
        const idx = DIRS.indexOf(this.agentDir);
        this.agentDir = DIRS[(idx + 1) % 4];
        return `Turned Right. Now facing ${this.agentDir}.`;
    }

    _handleGrab() {
        this.score -= 1;
        if (!this.hasGold && this.agentPos.x === this.goldPos.x && this.agentPos.y === this.goldPos.y) {
            this.hasGold = true;
            return `✨ Grabbed the Glittering Gold at (${this.agentPos.x}, ${this.agentPos.y})!`;
        }
        return `Attempted to grab, but there is no gold here!`;
    }

    _handleShoot() {
        if (!this.hasArrow) {
            this.score -= 1;
            return `No arrows remaining in quiver!`;
        }

        this.hasArrow = false;
        this.score -= 10; // Russell & Norvig -10 arrow penalty

        const delta = DIR_DELTAS[this.agentDir];
        let currX = this.agentPos.x + delta.x;
        let currY = this.agentPos.y + delta.y;
        let hit = false;

        while (this.inBounds(currX, currY)) {
            if (this.wumpusAlive && currX === this.wumpusPos.x && currY === this.wumpusPos.y) {
                this.wumpusAlive = false;
                this.lastScream = true;
                hit = true;
                break;
            }
            currX += delta.x;
            currY += delta.y;
        }

        if (hit) {
            return `🏹 Fired arrow ${this.agentDir}! A bloodcurdling SCREAM echoes—the Wumpus is slain! 🎯`;
        } else {
            return `🏹 Fired arrow ${this.agentDir}. It shattered against a distant stone wall with no hit.`;
        }
    }

    _handleClimb() {
        this.score -= 1;
        if (this.agentPos.x === 1 && this.agentPos.y === 1) {
            this.hasEscaped = true;
            this.isGameOver = true;
            if (this.hasGold) {
                this.score += 1000;
                this.gameOverReason = 'VICTORY! Escaped with the Legendary Gold! 🏆';
                return `🏆 Climbed out of the cave with the Gold! Score: ${this.score}`;
            } else {
                this.gameOverReason = 'Escaped alive, but empty-handed. 🚪';
                return `Climbed out of the cave without gold. Score: ${this.score}`;
            }
        }
        return `Cannot climb out here! Exit ladder is at (1, 1).`;
    }
}

// Preset Worlds
const PRESETS = {
    // Classic AIMA Figure 7.2 example
    AIMA_CLASSIC: {
        gridSize: 4,
        wumpusPos: { x: 1, y: 3 },
        goldPos: { x: 2, y: 3 },
        pits: [
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 4, y: 4 }
        ]
    },
    // Beginner friendly single pit
    BEGINNER: {
        gridSize: 4,
        wumpusPos: { x: 3, y: 3 },
        goldPos: { x: 2, y: 2 },
        pits: [
            { x: 4, y: 1 }
        ]
    }
};

window.WumpusWorld = WumpusWorld;
window.PRESETS = PRESETS;
