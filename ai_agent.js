// ============================================================================
// WUMPUS WORLD - KNOWLEDGE-BASED LOGIC AGENT
// Classical Propositional Deduction & Pathfinding (Russell & Norvig AIMA)
// ============================================================================

class AIAgent {
    constructor(world) {
        this.world = world;
        this.reset();
    }

    reset() {
        this.gridSize = this.world.gridSize;
        // Knowledge Base for all grid cells
        this.kb = {};
        for (let x = 1; x <= this.gridSize; x++) {
            for (let y = 1; y <= this.gridSize; y++) {
                this.kb[`${x},${y}`] = {
                    x, y,
                    visited: false,
                    safe: false,
                    possiblePit: true,
                    possibleWumpus: true,
                    knownPit: false,
                    knownWumpus: false,
                    stench: null,
                    breeze: null,
                    glitter: null
                };
            }
        }

        // Start square (1, 1) is guaranteed safe
        const start = this.kb['1,1'];
        start.safe = true;
        start.possiblePit = false;
        start.possibleWumpus = false;

        this.plannedActions = [];
        this.deductions = [];
        this.wumpusDead = false;
        this.knownWumpusPos = null;

        // Perform initial deduction
        this.updateKnowledge();
    }

    getNeighbors(x, y) {
        return this.world.getNeighbors(x, y);
    }

    logDeduction(text) {
        this.deductions.unshift({
            step: this.world.moves,
            text,
            time: new Date().toLocaleTimeString()
        });
        if (this.deductions.length > 30) this.deductions.pop();
    }

    // Update Knowledge Base with percepts from current square
    updateKnowledge() {
        const pos = this.world.agentPos;
        const key = `${pos.x},${pos.y}`;
        const cell = this.kb[key];
        const percepts = this.world.currentPercept;

        if (percepts.scream) {
            this.wumpusDead = true;
            this.logDeduction(`🎯 HEARD SCREAM! Wumpus is DEAD. Wumpus room is now cleared of monster.`);
            // Update all cells: Wumpus is no longer an active threat
            for (const k in this.kb) {
                this.kb[k].possibleWumpus = false;
                if (!this.kb[k].knownPit && !this.kb[k].possiblePit) {
                    this.kb[k].safe = true;
                }
            }
        }

        if (!cell.visited) {
            cell.visited = true;
            cell.safe = true;
            cell.possiblePit = false;
            cell.possibleWumpus = false;
            cell.stench = percepts.stench;
            cell.breeze = percepts.breeze;
            cell.glitter = percepts.glitter;

            this.logDeduction(`📍 Explored (${pos.x}, ${pos.y}). Percepts: [${[
                percepts.stench ? 'Stench' : 'No-Stench',
                percepts.breeze ? 'Breeze' : 'No-Breeze',
                percepts.glitter ? 'Glitter ✨' : 'No-Glitter'
            ].join(', ')}]`);

            const neighbors = this.getNeighbors(pos.x, pos.y);

            // Rule 1: No Breeze => None of the neighbors can have a pit
            if (!percepts.breeze) {
                neighbors.forEach(n => {
                    const nCell = this.kb[`${n.x},${n.y}`];
                    if (nCell.possiblePit) {
                        nCell.possiblePit = false;
                        this.logDeduction(`✓ Deduce: No breeze at (${pos.x}, ${pos.y}) → (${n.x}, ${n.y}) has NO PIT.`);
                    }
                });
            }

            // Rule 2: No Stench => None of the neighbors can have the Wumpus
            if (!percepts.stench) {
                neighbors.forEach(n => {
                    const nCell = this.kb[`${n.x},${n.y}`];
                    if (nCell.possibleWumpus) {
                        nCell.possibleWumpus = false;
                        this.logDeduction(`✓ Deduce: No stench at (${pos.x}, ${pos.y}) → (${n.x}, ${n.y}) has NO WUMPUS.`);
                    }
                });
            }

            // Rule 3: Re-evaluate safety
            for (const k in this.kb) {
                const c = this.kb[k];
                if (!c.possiblePit && (!c.possibleWumpus || this.wumpusDead)) {
                    if (!c.safe) {
                        c.safe = true;
                        this.logDeduction(`🛡️ PROVEN SAFE: Room (${c.x}, ${c.y}) confirmed hazard-free!`);
                    }
                }
            }

            // Rule 4: Advanced Horn Clause / Elimination Inference
            this.inferPitsAndWumpus();
        }
    }

    inferPitsAndWumpus() {
        // Find single remaining candidate for Pits
        for (const k in this.kb) {
            const cell = this.kb[k];
            if (cell.visited && cell.breeze) {
                const neighbors = this.getNeighbors(cell.x, cell.y);
                const candidates = neighbors.map(n => this.kb[`${n.x},${n.y}`]).filter(nc => nc.possiblePit);
                if (candidates.length === 1 && !candidates[0].knownPit) {
                    candidates[0].knownPit = true;
                    candidates[0].safe = false;
                    this.logDeduction(`⚠️ DEDUCE PIT: Cell (${cell.x}, ${cell.y}) has breeze and only (${candidates[0].x}, ${candidates[0].y}) can contain it!`);
                }
            }
        }

        // Find Wumpus candidate by intersection of stench rooms
        if (!this.wumpusDead && !this.knownWumpusPos) {
            const stenchCells = Object.values(this.kb).filter(c => c.visited && c.stench);
            if (stenchCells.length > 0) {
                // If single stench room has only 1 possible candidate
                stenchCells.forEach(sc => {
                    const neighbors = this.getNeighbors(sc.x, sc.y);
                    const candidates = neighbors.map(n => this.kb[`${n.x},${n.y}`]).filter(nc => nc.possibleWumpus);
                    if (candidates.length === 1 && !candidates[0].knownWumpus) {
                        candidates[0].knownWumpus = true;
                        this.knownWumpusPos = { x: candidates[0].x, y: candidates[0].y };
                        this.logDeduction(`☠️ DEDUCE WUMPUS: Confirmed Wumpus location at (${candidates[0].x}, ${candidates[0].y})!`);
                    }
                });

                // Intersection of multiple stenches
                if (!this.knownWumpusPos && stenchCells.length >= 2) {
                    const allNeighbors = stenchCells.map(sc => this.getNeighbors(sc.x, sc.y).map(n => `${n.x},${n.y}`));
                    const common = allNeighbors.reduce((acc, curr) => acc.filter(k => curr.includes(k)));
                    if (common.length === 1) {
                        const target = this.kb[common[0]];
                        target.knownWumpus = true;
                        this.knownWumpusPos = { x: target.x, y: target.y };
                        this.logDeduction(`☠️ DEDUCE WUMPUS: Stench intersection pinpoints Wumpus at (${target.x}, ${target.y})!`);
                    }
                }
            }
        }
    }

    // Breadth-First-Search (BFS) pathfinding restricted exclusively to known-safe cells
    findPathTo(targetX, targetY) {
        const startPos = this.world.agentPos;
        const startKey = `${startPos.x},${startPos.y}`;
        const targetKey = `${targetX},${targetY}`;

        if (startKey === targetKey) return [];

        const queue = [{ pos: startPos, path: [] }];
        const visitedInSearch = new Set([startKey]);

        while (queue.length > 0) {
            const { pos, path } = queue.shift();
            const neighbors = this.getNeighbors(pos.x, pos.y);

            for (const n of neighbors) {
                const nKey = `${n.x},${n.y}`;
                if (visitedInSearch.has(nKey)) continue;

                const nCell = this.kb[nKey];
                // Can only traverse if it is verified safe OR it's the target room
                if (nCell.safe || nKey === targetKey) {
                    visitedInSearch.add(nKey);
                    const newPath = [...path, n];
                    if (n.x === targetX && n.y === targetY) {
                        return newPath;
                    }
                    queue.push({ pos: n, path: newPath });
                }
            }
        }
        return null; // No safe path found
    }

    // Convert coordinate step path into concrete sequence of actions (turns & forwards)
    coordsPathToActions(path) {
        const actions = [];
        let currPos = { ...this.world.agentPos };
        let currDir = this.world.agentDir;

        for (const nextPos of path) {
            // Determine required direction
            let targetDir = null;
            if (nextPos.x > currPos.x) targetDir = 'EAST';
            else if (nextPos.x < currPos.x) targetDir = 'WEST';
            else if (nextPos.y > currPos.y) targetDir = 'NORTH';
            else if (nextPos.y < currPos.y) targetDir = 'SOUTH';

            // Determine turn sequence
            const turnActions = this.getTurnSequence(currDir, targetDir);
            actions.push(...turnActions);
            actions.push('FORWARD');

            currDir = targetDir;
            currPos = { ...nextPos };
        }
        return actions;
    }

    getTurnSequence(fromDir, toDir) {
        if (fromDir === toDir) return [];
        const order = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        const fromIdx = order.indexOf(fromDir);
        const toIdx = order.indexOf(toDir);
        const diff = (toIdx - fromIdx + 4) % 4;

        if (diff === 1) return ['TURN_RIGHT'];
        if (diff === 2) return ['TURN_RIGHT', 'TURN_RIGHT'];
        if (diff === 3) return ['TURN_LEFT'];
        return [];
    }

    // Next best action decision based on rational agent hierarchy
    getNextAction() {
        this.updateKnowledge();

        // 1. If we already have queued planned actions, pop the next one
        if (this.plannedActions.length > 0) {
            return this.plannedActions.shift();
        }

        const currPos = this.world.agentPos;
        const currentPercept = this.world.currentPercept;

        // 2. Goal Priority 1: Standing on Gold -> GRAB it!
        if (currentPercept.glitter && !this.world.hasGold) {
            this.logDeduction(`✨ Found the Gold! Grabbing it now.`);
            return 'GRAB';
        }

        // 3. Goal Priority 2: In possession of Gold -> Navigate back to (1, 1) and CLIMB
        if (this.world.hasGold) {
            if (currPos.x === 1 && currPos.y === 1) {
                this.logDeduction(`🏆 At cave entrance with gold! Climbing out to victory!`);
                return 'CLIMB';
            }
            const pathToExit = this.findPathTo(1, 1);
            if (pathToExit) {
                this.plannedActions = this.coordsPathToActions(pathToExit);
                this.logDeduction(`🏃 Retreating safely to (1, 1) with Gold.`);
                return this.plannedActions.shift();
            }
        }

        // 4. Goal Priority 3: Find closest unvisited SAFE square and explore
        const safeUnvisited = Object.values(this.kb).filter(c => c.safe && !c.visited);
        if (safeUnvisited.length > 0) {
            // Find path with shortest Manhattan distance / steps
            let bestPath = null;
            let bestTarget = null;

            for (const target of safeUnvisited) {
                const path = this.findPathTo(target.x, target.y);
                if (path && (!bestPath || path.length < bestPath.length)) {
                    bestPath = path;
                    bestTarget = target;
                }
            }

            if (bestPath) {
                this.plannedActions = this.coordsPathToActions(bestPath);
                this.logDeduction(`🧭 Navigating towards safe unexplored room (${bestTarget.x}, ${bestTarget.y}).`);
                return this.plannedActions.shift();
            }
        }

        // 5. Goal Priority 4: If Wumpus location is known, Wumpus is alive, and we have an arrow -> Shoot it!
        if (this.knownWumpusPos && !this.wumpusDead && this.world.hasArrow) {
            const wPos = this.knownWumpusPos;
            // Find a safe square in same row or column with clear line of fire
            const firingSquares = [];
            for (let x = 1; x <= this.gridSize; x++) {
                if (this.kb[`${x},${wPos.y}`].safe) firingSquares.push({ x, y: wPos.y, targetDir: x < wPos.x ? 'EAST' : 'WEST' });
            }
            for (let y = 1; y <= this.gridSize; y++) {
                if (this.kb[`${wPos.x},${y}`].safe) firingSquares.push({ x: wPos.x, y, targetDir: y < wPos.y ? 'NORTH' : 'SOUTH' });
            }

            for (const fSq of firingSquares) {
                const path = this.findPathTo(fSq.x, fSq.y);
                if (path !== null) {
                    const navActions = this.coordsPathToActions(path);
                    const turnActions = this.getTurnSequence(this.world.agentDir, fSq.targetDir);
                    this.plannedActions = [...navActions, ...turnActions, 'SHOOT'];
                    this.logDeduction(`🎯 Lining up shot against Wumpus at (${wPos.x}, ${wPos.y}) from (${fSq.x}, ${fSq.y})!`);
                    return this.plannedActions.shift();
                }
            }
        }

        // 6. Goal Priority 5: No 100% safe unvisited square exists.
        // A rational agent cuts its losses: returns to (1, 1) and exits alive!
        if (currPos.x === 1 && currPos.y === 1) {
            this.logDeduction(`🚪 No more guaranteed safe unexplored cells. Safely exiting cave to preserve score.`);
            return 'CLIMB';
        }

        const escapePath = this.findPathTo(1, 1);
        if (escapePath) {
            this.plannedActions = this.coordsPathToActions(escapePath);
            this.plannedActions.push('CLIMB');
            this.logDeduction(`🛡️ Risk aversion: Returning to (1, 1) to climb out alive.`);
            return this.plannedActions.shift();
        }

        // Last resort: turn to look around or take lowest risk step
        return 'TURN_LEFT';
    }
}

window.AIAgent = AIAgent;