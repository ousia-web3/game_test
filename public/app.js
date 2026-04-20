/**
 * 오디오 관리자 - Web Audio API 기반 절차적 사운드 및 리듬 제어
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.bpm = 100;
        this.masterGain = null;
        this.currentSequence = null;
        this.isPlaying = false;
        this.nextNoteTime = 0;
        this.currentNote = 0;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // seconds
        this.timerID = null;
        
        // 8비트 사운드 설정
        this.oscTypes = ['square', 'square', 'triangle', 'noise']; 
        
        // 8비트 사운드트랙 리스트 (단계별 10곡 구성)
        // [음높이(Hz), 타입(0:mel, 1:sub, 2:bass, 3:perc), 길이]
        this.tracks = [
            // Lv 1: Adventure Start (Bright)
            [
                261.63,0,0.1, 261.63,2,0.05, 329.63,0,0.1, 392.00,0,0.1,
                349.23,0,0.05, 329.63,0,0.05, 293.66,0,0.1, 196.00,2,0.1,
                261.63,0,0.1, 392.00,0,0.1, 523.25,0,0.1, 493.88,0,0.05,
                440.00,0,0.05, 392.00,0,0.1, 349.23,0,0.1, 329.63,2,0.1
            ],
            // Lv 2: Forest Path (Steady)
            [
                329.63,0,0.1, 261.63,2,0.1, 329.63,0,0.1, 349.23,0,0.1,
                392.00,0,0.15, 329.63,0,0.05, 261.63,2,0.1, 196.00,2,0.1,
                349.23,0,0.1, 293.66,0,0.1, 261.63,0,0.1, 329.63,0,0.1,
                293.66,0,0.15, 196.00,2,0.05, 220.00,2,0.1, 261.63,2,0.1
            ],
            // Lv 3: City Breeze (Bouncy)
            [
                440.00,0,0.1, 392.00,0,0.05, 440.00,0,0.05, 329.63,2,0.1,
                261.63,0,0.1, 196.00,2,0.1, 220.00,0,0.1, 261.63,0,0.1,
                392.00,0,0.1, 329.63,0,0.1, 392.00,0,0.1, 523.25,0,0.15,
                440.00,0,0.05, 392.00,0,0.1, 329.63,0,0.1, 196.00,2,0.1
            ],
            // Lv 4: Midnight Dash (Tense)
            [
                220.00,2,0.1, 220.00,2,0.05, 220.00,2,0.05, 440.00,0,0.1,
                415.30,0,0.1, 440.00,0,0.05, 466.16,0,0.05, 440.00,0,0.1,
                110.00,3,0.05, 220.00,2,0.1, 329.63,0,0.1, 311.13,0,0.1,
                293.66,0,0.1, 220.00,2,0.05, 261.63,0,0.05, 329.63,0,0.1
            ],
            // Lv 5: Power Up (Arp)
            [
                130.81,2,0.1, 261.63,0,0.05, 329.63,0,0.05, 392.00,0,0.05,
                523.25,0,0.05, 392.00,0,0.05, 329.63,0,0.05, 261.63,2,0.1,
                146.83,2,0.1, 293.66,0,0.05, 349.23,0,0.05, 440.00,0,0.05,
                587.33,0,0.05, 440.00,0,0.05, 349.23,0,0.05, 293.66,2,0.1
            ],
            // Lv 6: Clockwork (Mechanical)
            [
                392.00,0,0.05, 329.63,0,0.05, 261.63,2,0.1, 392.00,0,0.05,
                329.63,0,0.05, 261.63,2,0.1, 440.00,0,0.05, 349.23,0,0.05,
                293.66,2,0.1, 440.00,0,0.05, 349.23,0,0.05, 293.66,2,0.1,
                392.00,0,0.1, 392.00,3,0.05, 392.00,3,0.05, 261.63,2,0.2
            ],
            // Lv 7: Neon Night (Techno)
            [
                220.00,2,0.1, 110.00,3,0.05, 220.00,2,0.1, 110.00,3,0.05,
                440.00,0,0.08, 493.88,0,0.08, 523.25,0,0.08, 587.33,0,0.08,
                220.00,2,0.1, 110.00,3,0.05, 220.00,2,0.1, 110.00,3,0.05,
                659.25,0,0.1, 587.33,0,0.05, 523.25,0,0.05, 440.00,0,0.1
            ],
            // Lv 8: Dragon's Lair (Intense)
            [
                146.83,2,0.1, 146.83,2,0.05, 146.83,2,0.05, 293.66,0,0.1,
                311.13,0,0.1, 293.66,0,0.05, 277.18,0,0.05, 261.63,0,0.1,
                146.83,3,0.1, 196.00,2,0.1, 233.08,0,0.1, 293.66,0,0.1,
                466.16,0,0.1, 440.00,0,0.05, 392.00,0,0.05, 349.23,0,0.1
            ],
            // Lv 9: Space Storm (Glitchy)
            [
                523.25,0,0.05, 783.99,0,0.05, 523.25,0,0.05, 783.99,0,0.05,
                1046.50,0,0.1, 110.00,3,0.05, 110.00,3,0.05, 523.25,2,0.1,
                587.33,0,0.05, 880.00,0,0.05, 587.33,0,0.05, 880.00,0,0.05,
                1174.66,0,0.1, 110.00,3,0.05, 110.00,3,0.05, 587.33,2,0.1
            ],
            // Lv 10: Final Victory (Epic)
            [
                261.63,2,0.1, 392.00,2,0.1, 523.25,0,0.1, 659.25,0,0.1,
                783.99,0,0.2, 659.25,0,0.05, 523.25,0,0.05, 392.00,2,0.1,
                349.23,0,0.1, 440.00,0,0.1, 587.33,0,0.1, 698.46,0,0.1,
                783.99,0,0.3, 1174.66,0,0.1, 523.25,2,0.1, 261.63,2,0.1
            ]
        ];

        this.patterns = {
            'intro': [
                261.63,0,0.1, 329.63,0,0.1, 392.00,0,0.1, 523.25,0,0.1,
                392.00,0,0.1, 329.63,0,0.1, 261.63,0,0.1, 196.00,2,0.1,
                261.63,0,0.1, 329.63,0,0.1, 392.00,0,0.1, 523.25,0,0.1,
                440.00,0,0.1, 392.00,0,0.1, 349.23,0,0.1, 196.00,2,0.1
            ]
        };
        this.currentTrackIdx = 0;

    }

    async init() {
        try {
            if (!this.ctx) {
                console.log("Initializing AudioContext...");
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.3;
                this.masterGain.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') {
                console.log("Resuming AudioContext...");
                await this.ctx.resume();
            }
            console.log("AudioContext State:", this.ctx.state);
        } catch (e) {
            console.error("Audio Init Failed:", e);
        }
    }

    // 시퀀서 핵심
    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.advanceNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }

    advanceNote() {
        const secondsPerBeat = 60.0 / (this.bpm * 2); // 8비트 기준
        this.nextNoteTime += secondsPerBeat;
        this.currentNote = (this.currentNote + 1) % (this.currentSequence.length / 3);
    }

    scheduleNote(beatNumber, time) {
        const idx = beatNumber * 3;
        const freq = this.currentSequence[idx];
        const typeIdx = this.currentSequence[idx + 1];
        const duration = this.currentSequence[idx + 2];

        if (typeIdx === -1 || freq <= 0) return;

        const osc = this.ctx.createOscillator();
        const envelope = this.ctx.createGain();

        osc.type = this.oscTypes[typeIdx] || 'square';
        osc.frequency.setValueAtTime(freq, time);

        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(0.2, time + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(envelope);
        envelope.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    async startBGM(level) {
        await this.init();
        
        // 레벨에 따라 고유 트랙 선정 (Lv 1-10 -> Index 0-9)
        let trackIdx = (level - 1) % this.tracks.length;
        
        console.log(`Starting BGM Level: ${level}, Track: ${trackIdx}`);
        
        if (this.isPlaying) {
            if (this.currentTrackIdx === trackIdx) return; // 이미 같은 트랙 재생 중이면 유지
            this.stopBGM();
        }

        // 볼륨 초기화 및 페이드 인
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
        }

        this.currentTrackIdx = trackIdx;
        this.currentSequence = this.tracks[trackIdx];
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.isPlaying = true;
        this.scheduler();
    }

    async startIntroBGM() {
        await this.init();
        if (this.isPlaying && this.currentLevel === 'intro') return;
        if (this.isPlaying) this.stopBGM();
        
        console.log("Starting Intro BGM");
        // 볼륨 초기화 및 페이드 인
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
        }

        this.currentLevel = 'intro';
        this.currentSequence = this.patterns.intro;
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.isPlaying = true;
        this.scheduler();
    }

    stopBGM() {
        console.log("Stopping BGM");
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        if (this.masterGain && this.ctx) {
            // 부드러운 종료
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        }
    }

    playJumpSound() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHitSound(isGood = true) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isGood ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(isGood ? 880 : 110, this.ctx.currentTime);
        if (isGood) osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playBeat() {
        // 배경음악이 있으므로 비트음은 약하게 생략하거나 노이즈로 처리
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
}

class GameEngine {
    constructor() {
        // UI Elements
        this.introScreen = document.getElementById('intro-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultScreen = document.getElementById('result-screen');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI Components
        this.lifeCountSpan = document.getElementById('life-count');
        this.gameLifeIcons = document.getElementById('game-life-icons');
        this.currentScoreSpan = document.getElementById('current-score');
        this.currentDistSpan = document.getElementById('current-dist');
        this.finalScoreSpan = document.getElementById('final-score');
        this.finalDistSpan = document.getElementById('final-dist');
        this.nicknameInput = document.getElementById('nickname');
        this.leaderboardList = document.getElementById('leaderboard-list');
        
        this.audio = new AudioManager();
        
        // Game State
        this.currentLevel = 1;
        this.seedLife = 3;
        this.currentLife = 3;
        this.score = 0;
        this.distance = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        this.isCountingDown = false;
        this.combo = 0;
        this.maxCombo = 0;
        this.lastBeatTime = 0;
        this.beatDuration = 0.6;
        
        // Notes & Particles
        this.stairs = [];
        this.particles = [];
        this.activeLanes = new Set();
        this.frame = 0;
        this.judgeLineY = 0;
        this.lastFrameTime = 0;
        this.heroLane = 1; // 0, 1, 2
        
        // Name Entry State
        this.nameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
        this.nameEntryState = {
            slot: 0,
            chars: [0, 0, 0] // Indices of characters
        };
        
        // Judgment Config (Loosened for better feel)
        this.judgeWindows = {
            perfect: 25,
            great: 50,
            good: 90
        };
        this.missRange = 120; // Range after which it's an auto-miss
        
        // 이미지 자원
        // 이미지 자원
        this.heroImg = new Image();
        this.heroImg.src = 'images/hero.png';
        this.heroImg.onload = () => {
            this.heroImg = this.createTransparentCanvas(this.heroImg);
        };
        
        this.coinImg = new Image();
        this.coinImg.src = 'images/coin.png';
        this.coinImg.onload = () => {
            this.coinImg = this.createTransparentCanvas(this.coinImg);
        };
        
        this.playBgImg = new Image();
        this.playBgImg.src = 'images/play_background.png';
        
        this.init();
        this.initLevelSelector();
        this.initLifeInjector();
    }

    createTransparentCanvas(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 흰색 배경 제거 (RGB가 모두 245 이상인 경우 투명처리)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            if (r > 245 && g > 245 && b > 245) {
                data[i+3] = 0;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    initLifeInjector() {
        const minusBtn = document.getElementById('life-minus');
        const plusBtn = document.getElementById('life-plus');
        const lifeCount = document.getElementById('life-count');
        const lifeIcons = document.getElementById('life-icons');

        if (!minusBtn || !plusBtn || !lifeCount || !lifeIcons) return;

        // Initial UI update
        this.updateLifeIcons(this.seedLife, lifeIcons);
        lifeCount.innerText = this.seedLife;

        minusBtn.addEventListener('click', () => {
            if (this.seedLife > 1) {
                this.seedLife--;
                lifeCount.innerText = this.seedLife;
                this.updateLifeIcons(this.seedLife, lifeIcons);
            }
        });

        plusBtn.addEventListener('click', () => {
            if (this.seedLife < 10) {
                this.seedLife++;
                lifeCount.innerText = this.seedLife;
                this.updateLifeIcons(this.seedLife, lifeIcons);
            }
        });
    }

    initLevelSelector() {
        const range = document.getElementById('level-range');
        const val = document.getElementById('level-val');
        if (!range || !val) return;
        
        range.addEventListener('input', (e) => {
            this.currentLevel = parseInt(e.target.value);
            val.innerText = `Lv.${this.currentLevel}`;
            this.updateLevelConfig();
        });
        
        this.updateLevelConfig();
    }

    updateLevelConfig() {
        this.audio.bpm = 70 + (this.currentLevel * 10); // Lv1=80, Lv10=170
        this.beatDuration = 60 / this.audio.bpm;
        
        // 현재 속도 UI 업데이트
        const speedEl = document.getElementById('current-speed');
        if (speedEl) speedEl.innerText = (1 + (this.currentLevel - 1) * 0.2).toFixed(1);
    }

    init() {
        this.attachEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loadTopScore();
    }

    attachEventListeners() {
        // First user interaction to enable AudioContext (Browser policy)
        const initAudio = async () => {
            console.log("First interaction detected");
            await this.audio.init();
            if (this.introScreen.classList.contains('active') && !this.isPlaying) {
                this.audio.startIntroBGM();
            }
            window.removeEventListener('click', initAudio, true);
            window.removeEventListener('keydown', initAudio, true);
            window.removeEventListener('touchstart', initAudio, true);
        };
        window.addEventListener('click', initAudio, true);
        window.addEventListener('keydown', initAudio, true);
        window.addEventListener('touchstart', initAudio, true);

        // Navigation
        document.getElementById('start-btn').addEventListener('click', () => {
            this.audio.init();
            this.startGame();
        });
        document.getElementById('retry-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('submit-score').addEventListener('click', () => this.submitScore());

        // Keyboard Control
        window.addEventListener('keydown', (e) => {
            this.audio.init(); 
            const key = e.key;
            const code = e.code;

            // 1. 이름 입력 모드 (결과 화면 활성화 시)
            if (this.isGameOver && this.resultScreen.classList.contains('active')) {
                this.handleNameInput(key, code);
                if (key === 'Enter') this.submitScore();
                return;
            }

            // 2. 게임 플레이 모드
            if (!this.isPlaying) return;
            
            let lane = -1;
            // 화살표 키 및 ASD 키 지원 (한글 입력 상태에서도 동작하도록 code와 key 병행 체크)
            if (code === 'ArrowLeft' || key === 'ArrowLeft' || code === 'KeyA' || key === 'a' || key === 'ㅁ') lane = 0;
            if (code === 'ArrowDown' || key === 'ArrowDown' || code === 'KeyS' || key === 's' || key === 'ㄴ') lane = 1;
            if (code === 'ArrowRight' || key === 'ArrowRight' || code === 'KeyD' || key === 'd' || key === 'ㅇ') lane = 2;

            if (lane !== -1 && !e.repeat) {
                this.heroLane = lane; // Move hero to pressed lane
                this.audio.playJumpSound();
                this.createKeyEffect(lane);
                this.checkHit(lane);
            }
        });
    }

    handleNameInput(key, code) {
        const charLen = this.nameChars.length;
        
        if (key === 'ArrowUp') {
            this.nameEntryState.chars[this.nameEntryState.slot] = (this.nameEntryState.chars[this.nameEntryState.slot] - 1 + charLen) % charLen;
            this.updateNameUI();
            this.audio.playBeat();
        } else if (key === 'ArrowDown') {
            this.nameEntryState.chars[this.nameEntryState.slot] = (this.nameEntryState.chars[this.nameEntryState.slot] + 1) % charLen;
            this.updateNameUI();
            this.audio.playBeat();
        } else if (key === 'ArrowLeft') {
            this.nameEntryState.slot = (this.nameEntryState.slot - 1 + 3) % 3;
            this.updateNameUI();
            this.audio.playJumpSound();
        } else if (key === 'ArrowRight') {
            this.nameEntryState.slot = (this.nameEntryState.slot + 1) % 3;
            this.updateNameUI();
            this.audio.playJumpSound();
        }
    }

    updateNameUI() {
        const slots = document.querySelectorAll('.char-slot');
        slots.forEach((slot, i) => {
            const charIdx = this.nameEntryState.chars[i];
            slot.innerText = this.nameChars[charIdx];
            if (i === this.nameEntryState.slot) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }

    resize() {
        const width = this.canvas.offsetWidth;
        const height = this.canvas.offsetHeight;
        if (width === 0 || height === 0) return;

        this.canvas.width = width;
        this.canvas.height = height;
        // Align with CSS .hit-zone which is at bottom 180px
        this.judgeLineY = this.canvas.height - 180;
    }

    async loadTopScore() {
        try {
            const res = await fetch('/api/scores');
            const data = await res.json();
            if (data.scores && data.scores.length > 0) {
                document.getElementById('top-score-val').innerText = data.scores[0].score.toLocaleString();
            }
        } catch (e) { console.error('Failed to load top score', e); }
    }

    async loadLeaderboard() {
        try {
            this.leaderboardList.innerHTML = '<p class="loading">데이터 로딩 중...</p>';
            const res = await fetch('/api/scores');
            const data = await res.json();
            
            if (data.scores) {
                this.leaderboardList.innerHTML = '';
                if (data.scores.length === 0) {
                    this.leaderboardList.innerHTML = '<p class="loading">아직 기록이 없습니다.</p>';
                } else {
                    data.scores.forEach((item, index) => {
                        const row = document.createElement('div');
                        row.className = 'leaderboard-item';
                        row.innerHTML = `
                            <span class="rank">#${index + 1}</span>
                            <span class="name">${item.nickname}</span>
                            <span class="score">${item.score.toLocaleString()}</span>
                        `;
                        this.leaderboardList.appendChild(row);
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load leaderboard', e);
            this.leaderboardList.innerHTML = '<p class="loading">데이터를 불러오지 못했습니다.</p>';
        }
    }

    async startGame() {
        this.showScreen('game-screen');
        this.resize();
        
        this.currentLife = this.seedLife; 
        this.score = 0;
        this.distance = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        this.isCountingDown = true;
        this.combo = 0;
        this.stairs = [];
        this.particles = [];
        this.lastBeatTime = Date.now() / 1000;
        this.lastFrameTime = performance.now();
        this.heroLane = 1;
        
        this.updateCombo(0);
        this.currentScoreSpan.innerText = '0';
        this.updateLifeIcons(this.currentLife, this.gameLifeIcons);
        
        const countdownEl = document.getElementById('countdown');
        countdownEl.classList.remove('hidden');
        
        for (let i = 3; i > 0; i--) {
            countdownEl.innerText = i;
            await new Promise(r => setTimeout(r, 800));
        }
        
        countdownEl.innerText = 'START!';
        setTimeout(() => countdownEl.classList.add('hidden'), 1000);
        
        this.isCountingDown = false;
        this.isPlaying = true;
        this.audio.stopBGM(); // Stop intro if playing
        setTimeout(() => {
            this.audio.startBGM(this.currentLevel);
        }, 100);
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(currentTime) {
        if (!this.isPlaying && !this.isCountingDown && !this.isGameOver) {
            this.lastFrameTime = currentTime;
            return;
        }
        
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        if (!this.isGameOver) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    update(deltaTime) {
        if (!this.isPlaying) return;
        
        const deltaFactor = deltaTime / 16.66; // Normalize to 60fps
        
        // Spawn Notes
        const now = Date.now() / 1000;
        if (now - this.lastBeatTime > this.beatDuration) {
            this.lastBeatTime = now;
            this.audio.playBeat();
            this.addNote();
        }
        
        // Note speed based on Level
        const noteSpeed = (3 + (this.currentLevel * 0.5)) * deltaFactor;
        
        for (let i = this.stairs.length - 1; i >= 0; i--) {
            const note = this.stairs[i];
            note.y += noteSpeed;
            
            // Auto-miss: If note center passes judgeLineY + missRange
            if (!note.collected && (note.y + note.height/2) > (this.judgeLineY + this.missRange)) {
                note.collected = true;
                note.missed = true; // Use a specific flag for miss
                this.handleMiss();
            }
            
            // Cleanup: remove from array if way past screen
            if (note.y > this.canvas.height + 100) {
                this.stairs.splice(i, 1);
            }
        }
        
        // Distance
        this.distance += noteSpeed * 0.1;
        this.currentDistSpan.innerText = Math.floor(this.distance);
        
        // Progress
        const targetDist = 300 + (this.currentLevel * 200); // Level-based target
        const progress = Math.min(100, (this.distance / targetDist) * 100);
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) progressFill.style.width = progress + '%';
        
        if (progress >= 100) {
            if (this.currentLevel < 10) {
                this.nextLevel();
            } else {
                this.winGame();
            }
        }
        
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        this.frame++;
    }

    addNote() {
        const lane = Math.floor(Math.random() * 3);
        const isCoin = Math.random() < 0.15;
        this.stairs.push({
            lane,
            y: -80, // Start higher up
            type: isCoin ? 'coin' : 'safe',
            width: (this.canvas.width / 3) * 0.85,
            height: isCoin ? 80 : 35, // Adjust height
            collected: false,
            missed: false
        });
    }

    checkHit(lane) {
        let nearestNote = null;
        let minDistance = Infinity;

        // Find the uncollected note in this lane that is closest to the judge line
        for (const note of this.stairs) {
            if (note.collected || note.lane !== lane) continue;
            
            const noteCenter = note.y + note.height / 2;
            const dist = Math.abs(noteCenter - this.judgeLineY);
            
            if (dist < minDistance) {
                minDistance = dist;
                nearestNote = note;
            }
        }

        // If a note is found within a clickable range, process hit
        if (nearestNote && minDistance < this.judgeWindows.good) {
            let judgment = 'good';
            if (minDistance < this.judgeWindows.perfect) judgment = 'perfect';
            else if (minDistance < this.judgeWindows.great) judgment = 'great';
            
            this.handleHit(nearestNote, judgment);
        } else {
            // Empty air click - maybe show a minor effect but no score
            this.shakeScreen(2);
        }
    }

    handleMiss() {
        this.showJudge('miss');
        this.combo = 0;
        this.updateCombo(0);
        this.currentLife--;
        this.updateLifeIcons(this.currentLife, this.gameLifeIcons);
        this.shakeScreen(15); // Stronger shake on miss
        if (this.currentLife <= 0) this.gameOver();
    }

    handleHit(note, judgment) {
        note.collected = true;
        this.audio.playHitSound(true);
        
        this.combo++;
        let scoreAdd = note.type === 'coin' ? 100 : 10;
        if (judgment === 'perfect') scoreAdd *= 3;
        if (judgment === 'great') scoreAdd *= 2;
        
        this.score += scoreAdd * this.currentLevel * (1 + Math.floor(this.combo / 10));
        
        this.updateCombo(this.combo);
        this.currentScoreSpan.innerText = this.score.toLocaleString();
        this.showJudge(judgment);
        
        // Special effect for hit
        const color = judgment === 'perfect' ? '255, 255, 255' : note.type === 'coin' ? '255, 215, 0' : '0, 242, 255';
        this.createEffect(note.lane, this.judgeLineY, color);
        this.shakeScreen(judgment === 'perfect' ? 10 : 5);
        
        if (note.type === 'coin') {
            // Bonus: heal small portion
            this.currentLife = Math.min(this.seedLife, this.currentLife + 0.5); 
            this.updateLifeIcons(Math.ceil(this.currentLife), this.gameLifeIcons);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background
        if (this.playBgImg.complete) {
            this.ctx.drawImage(this.playBgImg, 0, 0, this.canvas.width, this.canvas.height);
            // Add a dark overlay to make notes visible
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#0a0a12';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Lanes
        const lw = this.canvas.width / 3;
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        for (let i = 1; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * lw, 0);
            this.ctx.lineTo(i * lw, this.canvas.height);
            this.ctx.stroke();
        }

        // Judge Line
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.judgeLineY);
        this.ctx.lineTo(this.canvas.width, this.judgeLineY);
        this.ctx.stroke();

        // Hit Effects
        this.activeLanes.forEach(lane => {
            this.ctx.fillStyle = 'rgba(0, 242, 255, 0.15)';
            this.ctx.fillRect(lane * lw, 0, lw, this.canvas.height);
        });

        // Notes
        for (const note of this.stairs) {
            if (note.collected) continue;
            const nx = note.lane * lw + (lw - note.width)/2;
            
            if (note.type === 'coin') {
                this.ctx.drawImage(this.coinImg, nx, note.y, note.width, note.width); 
            } else {
                const color = '#00f2ff';
                this.ctx.fillStyle = color;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = color;
                this.ctx.beginPath();
                this.ctx.roundRect(nx, note.y, note.width, note.height, 5);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }

        // Hero (Follows lane)
        const heroSize = 120;
        const hx = this.heroLane * lw + (lw - heroSize)/2;
        this.ctx.drawImage(this.heroImg, hx, this.judgeLineY - heroSize + 60, heroSize, heroSize);

        // Particles
        for (const p of this.particles) {
            this.ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    updateLifeIcons(count, container) {
        if (!container) return;
        container.innerHTML = '';
        const displayCount = Math.max(count, 5); // Show at least 5 slots
        for (let i = 0; i < displayCount; i++) {
            const h = document.createElement('div');
            h.className = i < count ? 'heart-icon' : 'heart-icon empty';
            container.appendChild(h);
        }
    }

    updateCombo(val) {
        const ctn = document.getElementById('combo-container');
        const count = document.getElementById('combo-count');
        if (val > 0) {
            ctn.classList.remove('hidden');
            count.innerText = val;
            if (val > this.maxCombo) this.maxCombo = val;
        } else {
            ctn.classList.add('hidden');
        }
    }

    createEffect(lane, y, color) {
        const x = lane * (this.canvas.width/3) + (this.canvas.width/6);
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5)*10,
                vy: (Math.random()-0.5)*10,
                life: 1.0,
                color,
                size: 2 + Math.random()*4
            });
        }
    }

    createKeyEffect(lane) {
        this.activeLanes.add(lane);
        setTimeout(() => { this.activeLanes.delete(lane); }, 150);
    }

    showJudge(type) {
        const el = document.getElementById('judge-text');
        if (!el) return;
        el.innerText = type.toUpperCase();
        el.className = `judge-text ${type} judge-animate`;
        el.classList.remove('hidden');
        
        // Restart animation
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    }

    shakeScreen(intensity) {
        this.canvas.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
        setTimeout(() => this.canvas.style.transform = 'translate(0,0)', 50);
    }

    nextLevel() {
        this.currentLevel++;
        this.distance = 0;
        this.updateLevelConfig();
        this.audio.startBGM(this.currentLevel);
        
        // Visual Feedback
        this.showJudge(`LEVEL ${this.currentLevel}`);
        const overlay = document.getElementById('countdown');
        overlay.innerText = `LEVEL ${this.currentLevel}`;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('hidden'), 1500);
        
        // Bonus heal
        this.currentLife = Math.min(this.seedLife, this.currentLife + 1);
        this.updateLifeIcons(Math.ceil(this.currentLife), this.gameLifeIcons);
    }

    winGame() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.audio.stopBGM();
        this.showResult("THE TRUE HERO!");
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.audio.stopBGM();
        this.showResult("MISSION FAILED");
    }

    showResult(title) {
        this.finalScoreSpan.innerText = this.score.toLocaleString();
        this.finalDistSpan.innerText = Math.floor(this.distance) + 'm';
        
        // 최종 속도 표시 (레벨 기반 multiplier)
        const speedMult = (1 + (this.currentLevel - 1) * 0.2).toFixed(1);
        document.getElementById('final-speed').innerText = speedMult + 'x';
        
        this.showScreen('result-screen');
        document.querySelector('.result-title').innerText = title;
        
        document.querySelector('.nickname-entry-container').style.display = 'flex';
        this.nameEntryState = { slot: 0, chars: [0, 0, 0] };
        this.updateNameUI();
        
        // 리더보드 로드
        this.loadLeaderboard();
    }

    async submitScore() {
        if (!this.isGameOver) return; 
        
        const nickname = this.nameEntryState.chars.map(idx => this.nameChars[idx]).join("");
        const speedMult = 1 + (this.currentLevel - 1) * 0.2;
        const payload = { 
            nickname, 
            score: this.score, 
            distance: Math.floor(this.distance),
            topSpeed: speedMult,
            seedLife: this.seedLife
        };
        
        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
                this.loadLeaderboard(); // 리스트 즉시 갱신
                document.querySelector('.nickname-entry-container').style.display = 'none'; // 등록 폼 숨김
            }
        } catch (e) { 
            console.error('Score submission failed', e);
            alert('등록에 실패했습니다.'); 
        }
    }

    resetGame() {
        this.audio.stopBGM();
        setTimeout(() => {
            this.audio.startIntroBGM();
        }, 100);
        this.showScreen('intro-screen');
        this.loadTopScore();
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });
        const target = document.getElementById(id);
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
    }
}

window.onload = () => { window.game = new GameEngine(); };
