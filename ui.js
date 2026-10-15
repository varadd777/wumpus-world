// ============================================================================
// WUMPUS WORLD - ENCHANTED FOREST UI CONTROLLER & RENDERER
// Handles DOM updates, zero-scroll layout, directional archer, and fireflies
// ============================================================================

class UIController {
    constructor() {
        this.world = new WumpusWorld({ layout: PRESETS.AIMA_CLASSIC });
        this.ai = new AIAgent(this.world);
        this.godMode = false;
        this.showAiOverlay = true;
        this.aiRunning = false;
        this.aiTimer = null;
        this.aiSpeed = 450; // ms per step

        this.initCanvas();
        this.initElements();
        this.initEvents();
        this.render();
    }

    // Floating glowing fireflies & mystical spores
    initCanvas() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.fireflies = [];
        for (let i = 0; i < 45; i++) {
            this.fireflies.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2.0 + 0.8,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.3,
                baseAlpha: Math.random() * 0.4 + 0.25,
                pulseSpeed: Math.random() * 0.04 + 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.4 ? '52, 211, 153' : '251, 191, 36' // emerald & gold
            });
        }

        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.fireflies.forEach(f => {
                f.x += f.vx;
                f.y += f.vy;
                f.pulsePhase += f.pulseSpeed;

                // Wrap around viewport edges
                if (f.x < 0) f.x = this.canvas.width;
                if (f.x > this.canvas.width) f.x = 0;
                if (f.y < 0) f.y = this.canvas.height;
                if (f.y > this.canvas.height) f.y = 0;

                const currentAlpha = f.baseAlpha + Math.sin(f.pulsePhase) * 0.25;
                const alphaClamped = Math.max(0.05, Math.min(0.85, currentAlpha));

                this.ctx.beginPath();
                this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${f.color}, ${alphaClamped})`;
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = `rgba(${f.color}, 0.7)`;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            });
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initElements() {
        // Grid container
        this.gridEl = document.getElementById('dungeon-grid');

        // Stats
        this.scoreEl = document.getElementById('stat-score');
        this.movesEl = document.getElementById('stat-moves');
        this.arrowEl = document.getElementById('stat-arrow');
        this.goldEl = document.getElementById('stat-gold');
        this.facingEl = document.getElementById('stat-facing');
        this.statusDotEl = document.getElementById('hunter-status-dot');
        this.statusTextEl = document.getElementById('hunter-status-text');

        // Radar Badges
        this.stenchBadge = document.getElementById('badge-stench');
        this.breezeBadge = document.getElementById('badge-breeze');
        this.glitterBadge = document.getElementById('badge-glitter');
        this.bumpBadge = document.getElementById('badge-bump');

        // Action Buttons
        this.btnForward = document.getElementById('btn-forward');
        this.btnTurnLeft = document.getElementById('btn-turn-left');
        this.btnTurnRight = document.getElementById('btn-turn-right');
        this.btnGrab = document.getElementById('btn-grab');
        this.btnShoot = document.getElementById('btn-shoot');
        this.btnClimb = document.getElementById('btn-climb');

        // Toolbar & Options
        this.btnGodMode = document.getElementById('btn-god-mode');
        this.btnAiOverlay = document.getElementById('btn-ai-overlay');
        this.btnMute = document.getElementById('btn-mute');
        this.presetSelect = document.getElementById('preset-select');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnReset = document.getElementById('btn-reset');
        this.btnHelp = document.getElementById('btn-help');

        // AI Ribbon
        this.aiMindText = document.getElementById('ai-mind-text');
        this.btnAiStep = document.getElementById('btn-ai-step');
        this.btnAiAuto = document.getElementById('btn-ai-auto');
        this.speedSelect = document.getElementById('speed-select');
        this.btnViewLog = document.getElementById('btn-view-log');

        // Modals
        this.modalGameOver = document.getElementById('modal-gameover');
        this.modalTitle = document.getElementById('modal-title');
        this.modalReason = document.getElementById('modal-reason');
        this.modalScore = document.getElementById('modal-score');
        this.modalMoves = document.getElementById('modal-moves');
        this.modalGold = document.getElementById('modal-gold');
        this.btnModalRestart = document.getElementById('btn-modal-restart');

        this.modalAiLog = document.getElementById('modal-ai-log');
        this.fullLogContent = document.getElementById('full-log-content');
        this.btnLogClose = document.getElementById('btn-log-close');

        this.modalRules = document.getElementById('modal-rules');
        this.btnRulesClose = document.getElementById('btn-rules-close');
    }

    initEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.modalGameOver.classList.contains('open') || 
                this.modalRules.classList.contains('open') || 
                this.modalAiLog.classList.contains('open')) {
                return;
            }

            // Lazy init audio on first key
            window.soundFX.init();

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.handleAction('FORWARD');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.handleAction('TURN_LEFT');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.handleAction('TURN_RIGHT');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.handleAction('TURN_RIGHT');
                    this.handleAction('TURN_RIGHT');
                    break;
                case ' ':
                    e.preventDefault();
                    this.handleAction('GRAB');
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.handleAction('SHOOT');
                    break;
                case 'c':
                case 'C':
                    e.preventDefault();
                    this.handleAction('CLIMB');
                    break;
            }
        });

        // Click Controls
        this.btnForward.addEventListener('click', () => this.handleAction('FORWARD'));
        this.btnTurnLeft.addEventListener('click', () => this.handleAction('TURN_LEFT'));
        this.btnTurnRight.addEventListener('click', () => this.handleAction('TURN_RIGHT'));
        this.btnGrab.addEventListener('click', () => this.handleAction('GRAB'));
        this.btnShoot.addEventListener('click', () => this.handleAction('SHOOT'));
        this.btnClimb.addEventListener('click', () => this.handleAction('CLIMB'));

        // God Mode Toggle
        this.btnGodMode.addEventListener('click', () => {
            window.soundFX.init();
            this.godMode = !this.godMode;
            this.btnGodMode.classList.toggle('active', this.godMode);
            this.btnGodMode.innerHTML = this.godMode ? '👁️ God Mode: ON' : '👁️ God Mode: OFF';
            this.render();
        });

        // AI Overlay Toggle
        this.btnAiOverlay.addEventListener('click', () => {
            window.soundFX.init();
            this.showAiOverlay = !this.showAiOverlay;
            this.btnAiOverlay.classList.toggle('active', this.showAiOverlay);
            this.render();
        });

        // Audio Mute Toggle
        this.btnMute.addEventListener('click', () => {
            window.soundFX.init();
            const unmuted = window.soundFX.toggleMute();
            this.btnMute.innerHTML = unmuted ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            this.btnMute.classList.toggle('active', unmuted);
        });

        // New Game & Preset
        this.btnNewGame.addEventListener('click', () => this.startNewGame());
        this.btnReset.addEventListener('click', () => this.resetCurrentWorld());
        this.presetSelect.addEventListener('change', () => this.startNewGame());

        // AI Controls
        this.btnAiStep.addEventListener('click', () => {
            window.soundFX.init();
            this.stepAiAgent();
        });

        this.btnAiAuto.addEventListener('click', () => {
            window.soundFX.init();
            if (this.aiRunning) {
                this.stopAiAutoPlay();
            } else {
                this.startAiAutoPlay();
            }
        });

        this.speedSelect.addEventListener('change', (e) => {
            const speeds = { '1': 1000, '2': 700, '3': 450, '4': 250 };
            this.aiSpeed = speeds[e.target.value] || 450;
            if (this.aiRunning) {
                this.stopAiAutoPlay();
                this.startAiAutoPlay();
            }
        });

        // AI Log Modal
        this.btnViewLog.addEventListener('click', () => {
            this.populateFullLogModal();
            this.modalAiLog.classList.add('open');
        });
        this.btnLogClose.addEventListener('click', () => {
            this.modalAiLog.classList.remove('open');
        });

        // Rules Modal
        this.btnHelp.addEventListener('click', () => {
            this.modalRules.classList.add('open');
        });
        this.btnRulesClose.addEventListener('click', () => {
            this.modalRules.classList.remove('open');
        });

        // Restart Modal
        this.btnModalRestart.addEventListener('click', () => {
            this.modalGameOver.classList.remove('open');
            this.startNewGame();
        });
    }

    startNewGame() {
        this.stopAiAutoPlay();
        const presetKey = this.presetSelect.value;
        if (presetKey === 'AIMA_CLASSIC') {
            this.world = new WumpusWorld({ layout: PRESETS.AIMA_CLASSIC });
        } else if (presetKey === 'BEGINNER') {
            this.world = new WumpusWorld({ layout: PRESETS.BEGINNER });
        } else if (presetKey === 'RANDOM_4') {
            this.world = new WumpusWorld({ gridSize: 4, pitProb: 0.20 });
        } else if (presetKey === 'RANDOM_5') {
            this.world = new WumpusWorld({ gridSize: 5, pitProb: 0.18 });
        } else if (presetKey === 'RANDOM_6') {
            this.world = new WumpusWorld({ gridSize: 6, pitProb: 0.15 });
        }
        this.ai = new AIAgent(this.world);
        this.render();
    }

    resetCurrentWorld() {
        this.stopAiAutoPlay();
        this.world.reset();
        this.ai = new AIAgent(this.world);
        this.render();
    }

    handleAction(action) {
        if (this.world.isGameOver) return;
        window.soundFX.init();

        const result = this.world.executeAction(action);
        if (result.error) return;

        // Sound triggers
        if (action === 'FORWARD') {
            if (result.percepts.bump) {
                window.soundFX.playBump();
                this.shakeScreen();
            } else {
                window.soundFX.playStep();
            }
        } else if (action === 'TURN_LEFT' || action === 'TURN_RIGHT') {
            window.soundFX.playTurn();
        } else if (action === 'GRAB') {
            if (this.world.hasGold) {
                window.soundFX.playGrab();
            }
        } else if (action === 'SHOOT') {
            window.soundFX.playArrow();
            if (result.percepts.scream) {
                setTimeout(() => window.soundFX.playScream(), 200);
            }
        } else if (action === 'CLIMB') {
            if (this.world.hasEscaped && this.world.hasGold) {
                window.soundFX.playVictory();
            }
        }

        // Percept sounds
        if (result.percepts.breeze) window.soundFX.playBreeze();
        if (result.percepts.stench) window.soundFX.playStench();
        if (result.percepts.glitter) window.soundFX.playGlitter();

        // Game over sounds
        if (this.world.isGameOver) {
            if (!this.world.isAlive) {
                window.soundFX.playDeath();
                this.shakeScreen();
            } else if (this.world.hasEscaped && this.world.hasGold) {
                window.soundFX.playVictory();
            }
            this.showGameOverModal();
        }

        // Update AI reasoning for live inspection
        this.ai.updateKnowledge();

        this.render();
    }

    shakeScreen() {
        const app = document.querySelector('.app-container');
        app.classList.remove('shake');
        void app.offsetWidth;
        app.classList.add('shake');
    }

    stepAiAgent() {
        if (this.world.isGameOver) {
            this.stopAiAutoPlay();
            return;
        }
        const action = this.ai.getNextAction();
        if (action) {
            this.handleAction(action);
        }
    }

    startAiAutoPlay() {
        if (this.world.isGameOver) {
            this.startNewGame();
        }
        this.aiRunning = true;
        this.btnAiAuto.innerHTML = '⏸️ Pause';
        this.btnAiAuto.classList.add('btn-primary');

        this.aiTimer = setInterval(() => {
            if (this.world.isGameOver) {
                this.stopAiAutoPlay();
                return;
            }
            this.stepAiAgent();
        }, this.aiSpeed);
    }

    stopAiAutoPlay() {
        this.aiRunning = false;
        clearInterval(this.aiTimer);
        this.btnAiAuto.innerHTML = '▶️ Auto AI';
        this.btnAiAuto.classList.remove('btn-primary');
    }

    showGameOverModal() {
        setTimeout(() => {
            const won = this.world.hasEscaped && this.world.hasGold;
            this.modalTitle.textContent = won ? '🏆 VICTORY!' : (this.world.isAlive ? '🚪 ESCAPED' : '💀 YOU DIED');
            this.modalTitle.className = `modal-title ${won ? 'victory' : 'defeat'}`;
            this.modalReason.textContent = this.world.gameOverReason;
            this.modalScore.textContent = this.world.score;
            this.modalMoves.textContent = this.world.moves;
            this.modalGold.textContent = this.world.hasGold ? 'Yes (+1000)' : 'No';
            this.modalGameOver.classList.add('open');
        }, 500);
    }

    populateFullLogModal() {
        this.fullLogContent.innerHTML = '';
        if (this.ai.deductions.length === 0) {
            this.fullLogContent.innerHTML = '<div style="color:var(--text-dim);padding:20px;text-align:center;">No deductions recorded yet.</div>';
            return;
        }

        this.ai.deductions.forEach(d => {
            const item = document.createElement('div');
            item.className = 'full-log-item';
            if (d.text.includes('SAFE')) item.classList.add('safe');
            else if (d.text.includes('PIT')) item.classList.add('pit');
            else if (d.text.includes('WUMPUS')) item.classList.add('wumpus');
            else if (d.text.includes('Gold') || d.text.includes('VICTORY')) item.classList.add('gold');

            item.innerHTML = `<strong>Step ${d.step}:</strong> ${d.text}`;
            this.fullLogContent.appendChild(item);
        });
    }

    render() {
        this.renderStats();
        this.renderPerceptRadar();
        this.renderGrid();
        this.renderAiRibbon();
        this.updateButtons();
    }

    renderStats() {
        this.scoreEl.textContent = this.world.score;
        this.movesEl.textContent = this.world.moves;

        // Clean single line: "Ready (1)" or "Empty (0)" without bow emoji
        this.arrowEl.textContent = this.world.hasArrow ? 'Ready (1)' : 'Empty (0)';
        this.arrowEl.style.color = this.world.hasArrow ? 'var(--emerald-light)' : 'var(--text-dim)';

        this.goldEl.textContent = this.world.hasGold ? 'Carried' : 'None';
        this.goldEl.style.color = this.world.hasGold ? 'var(--firefly-gold)' : 'var(--text-dim)';
        this.facingEl.textContent = this.world.agentDir;

        if (!this.world.isAlive) {
            this.statusDotEl.className = 'status-dot dead';
            this.statusTextEl.textContent = 'Slain in Woods';
        } else if (this.world.hasEscaped) {
            this.statusDotEl.className = 'status-dot victory';
            this.statusTextEl.textContent = 'Safely Escaped';
        } else {
            this.statusDotEl.className = 'status-dot';
            this.statusTextEl.textContent = 'Stalking the Woods';
        }
    }

    renderPerceptRadar() {
        const p = this.world.currentPercept;
        this.stenchBadge.classList.toggle('active', !!p.stench);
        this.breezeBadge.classList.toggle('active', !!p.breeze);
        this.glitterBadge.classList.toggle('active', !!p.glitter);
        this.bumpBadge.classList.toggle('active', !!p.bump);
    }

    renderAiRibbon() {
        if (this.ai.deductions.length > 0) {
            const latest = this.ai.deductions[0];
            this.aiMindText.textContent = `AI Mind: ${latest.text}`;
        } else {
            this.aiMindText.textContent = 'AI Mind: Standing at cave entrance (1,1). Ready to explore.';
        }
    }

    updateButtons() {
        const isOver = this.world.isGameOver;
        this.btnForward.disabled = isOver;
        this.btnTurnLeft.disabled = isOver;
        this.btnTurnRight.disabled = isOver;
        this.btnGrab.disabled = isOver || this.world.hasGold || !(this.world.agentPos.x === this.world.goldPos.x && this.world.agentPos.y === this.world.goldPos.y);
        this.btnShoot.disabled = isOver || !this.world.hasArrow;
        this.btnClimb.disabled = isOver || !(this.world.agentPos.x === 1 && this.world.agentPos.y === 1);
        this.btnAiStep.disabled = isOver;
    }

    renderGrid() {
        const size = this.world.gridSize;
        this.gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        this.gridEl.innerHTML = '';

        // AIMA Cartesian grid: Row 'size' at top down to Row 1 at bottom
        for (let y = size; y >= 1; y--) {
            for (let x = 1; x <= size; x++) {
                const key = `${x},${y}`;
                const isVisited = this.world.visited.has(key);
                const isPlayerHere = this.world.agentPos.x === x && this.world.agentPos.y === y;
                const isVisible = this.godMode || isVisited || (!this.world.isAlive && key === `${this.world.agentPos.x},${this.world.agentPos.y}`);

                const cell = document.createElement('div');
                cell.className = `dungeon-cell ${isVisited ? 'visited' : 'unexplored'} ${isPlayerHere ? 'player-here' : ''}`;
                cell.id = `cell-${x}-${y}`;

                // Coordinate label [x, y]
                const coord = document.createElement('span');
                coord.className = 'cell-coord';
                coord.textContent = `${x},${y}`;
                cell.appendChild(coord);

                // Fog of War overlay
                if (!isVisible) {
                    const fog = document.createElement('div');
                    fog.className = 'fog-overlay';
                    fog.innerHTML = '<span class="fog-rune">🌿</span>';
                    cell.appendChild(fog);
                }

                // Entity Slot
                const center = document.createElement('div');
                center.className = 'cell-center';

                // ==========================================================
                // DIRECTIONAL ARCHER HUNTER (AIMS EXACTLY WHERE HE MOVES!)
                // Base SVG aims straight North (0 deg). Rotations:
                // NORTH: 0deg, EAST: 90deg, SOUTH: 180deg, WEST: 270deg
                // ==========================================================
                if (isPlayerHere && this.world.isAlive) {
                    const archerWrapper = document.createElement('div');
                    archerWrapper.className = `archer-token dir-${this.world.agentDir}`;
                    archerWrapper.innerHTML = `
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                        <!-- Ranger Aura / Shield -->
                        <circle cx="50" cy="50" r="44" fill="rgba(6, 95, 70, 0.35)" stroke="#34d399" stroke-width="2.5" />
                        <!-- Ranger Cloak / Shoulders -->
                        <path d="M 30 76 Q 50 62 70 76 L 64 88 Q 50 82 36 88 Z" fill="#064e3b" stroke="#047857" stroke-width="2" />
                        <!-- Ranger Hooded Head -->
                        <circle cx="50" cy="56" r="14" fill="#047857" stroke="#6ee7b7" stroke-width="2" />
                        <!-- Golden Curved Bow aimed straight forward -->
                        <path d="M 22 34 Q 50 16 78 34" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" />
                        <!-- Bowstring pulled back -->
                        <line x1="22" y1="34" x2="50" y2="48" stroke="#ffffff" stroke-width="1.8" />
                        <line x1="78" y1="34" x2="50" y2="48" stroke="#ffffff" stroke-width="1.8" />
                        <!-- Arrow Shaft aimed strictly straight UP (North = 0°) -->
                        <line x1="50" y1="48" x2="50" y2="8" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
                        <!-- Arrowhead Pointing Straight Forward -->
                        <polygon points="50,2 41,16 59,16" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" />
                        <!-- Fletching Feathers -->
                        <path d="M 45 44 L 40 50 M 55 44 L 60 50" stroke="#a7f3d0" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    `;
                    center.appendChild(archerWrapper);

                    // Directional Torch Light Beam
                    const beam = document.createElement('div');
                    beam.className = `torch-beam ${this.world.agentDir}`;
                    cell.appendChild(beam);
                }

                // Render Wumpus
                if (x === this.world.wumpusPos.x && y === this.world.wumpusPos.y) {
                    if (isVisible) {
                        const wumpus = document.createElement('div');
                        wumpus.className = `wumpus-entity ${this.world.wumpusAlive ? '' : 'dead'}`;
                        wumpus.textContent = this.world.wumpusAlive ? '👹' : '💀';
                        wumpus.title = this.world.wumpusAlive ? 'The Wumpus Beast!' : 'Slain Beast';
                        center.appendChild(wumpus);
                    }
                }

                // Render Pit
                if (this.world.pits.has(key)) {
                    if (isVisible) {
                        const pit = document.createElement('div');
                        pit.className = 'pit-entity';
                        pit.title = 'Bottomless Chasm';
                        center.appendChild(pit);
                    }
                }

                // Render Gold / Relic
                if (!this.world.hasGold && x === this.world.goldPos.x && y === this.world.goldPos.y) {
                    if (isVisible) {
                        const gold = document.createElement('div');
                        gold.className = 'gold-entity';
                        gold.textContent = '✨';
                        gold.title = 'Golden Forest Relic!';
                        center.appendChild(gold);
                    }
                }

                cell.appendChild(center);

                // Percepts icons inside cell
                if (isVisited || this.godMode) {
                    const perceptsBox = document.createElement('div');
                    perceptsBox.className = 'cell-percepts';

                    if (this.world.hasStench(x, y)) {
                        const s = document.createElement('span');
                        s.className = 'p-icon';
                        s.textContent = '🤢';
                        s.title = 'Stench';
                        perceptsBox.appendChild(s);
                    }
                    if (this.world.hasBreeze(x, y)) {
                        const b = document.createElement('span');
                        b.className = 'p-icon';
                        b.textContent = '💨';
                        b.title = 'Breeze';
                        perceptsBox.appendChild(b);
                    }
                    if (!this.world.hasGold && x === this.world.goldPos.x && y === this.world.goldPos.y) {
                        const g = document.createElement('span');
                        g.className = 'p-icon';
                        g.textContent = '✨';
                        g.title = 'Glitter';
                        perceptsBox.appendChild(g);
                    }
                    cell.appendChild(perceptsBox);
                }

                // AI Knowledge Base Overlay Marker
                if (this.showAiOverlay && this.ai.kb[key]) {
                    const kbCell = this.ai.kb[key];
                    if (!isVisited) {
                        const aiMarker = document.createElement('div');
                        if (kbCell.knownPit) {
                            aiMarker.className = 'ai-badge pit';
                            aiMarker.textContent = '🕳️ PIT';
                        } else if (kbCell.knownWumpus && !this.ai.wumpusDead) {
                            aiMarker.className = 'ai-badge wumpus';
                            aiMarker.textContent = '👹 WUMPUS';
                        } else if (kbCell.safe) {
                            aiMarker.className = 'ai-badge safe';
                            aiMarker.textContent = '✓ SAFE';
                        } else if (kbCell.possiblePit || kbCell.possibleWumpus) {
                            aiMarker.className = 'ai-badge maybe';
                            aiMarker.textContent = '? DANGER';
                        }
                        cell.appendChild(aiMarker);
                    }
                }

                this.gridEl.appendChild(cell);
            }
        }
    }
}

// Initialize on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();
});
