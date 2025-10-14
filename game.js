// Game State
const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    player: {
        position: new THREE.Vector3(0, 2, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        canShoot: true,
        speed: 0.2,
        isFlying: false,
        flySpeed: 0.35,
        verticalVelocity: 0,
        gravity: 0.01,
        acceleration: 0.05,
        friction: 0.85,
        mouseSensitivity: 0.002,
        maxShield: 100,
        shield: 100
    },
    slowMotion: {
        active: false,
        duration: 3,
        timeLeft: 0,
        cooldown: 10,
        cooldownLeft: 0
    },
    missiles: {
        cooldown: 10,
        cooldownLeft: 0
    },
    enemies: [],
    projectiles: [],
    particles: [],
    dataFragments: 0,
    totalFragments: 12,
    score: 0,
    gameStarted: false,
    gamePaused: false,
    bossActive: false,
    boss: null,
    keys: {},
    mouse: { x: 0, y: 0 },
    gauntlet: null,
    stars: null,
    ground: null,
    grid: null,
    // New features
    killCount: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    currentWave: 1,
    totalShots: 0,
    shotsHit: 0,
    startTime: null,
    audioMuted: false,
    pickups: [],
    powerups: {
        damageBoost: { active: false, timeLeft: 0, duration: 10, multiplier: 2 },
        rapidFire: { active: false, timeLeft: 0, duration: 8 },
        shield: { active: false, timeLeft: 0, duration: 12 }
    },
    critChance: 0.15,
    critMultiplier: 2.5
};

// Portfolio Data
const portfolioData = [
  "🎯 Aditya Kurani — Software Engineer | Innovator | AI Developer",
  "🎓 B.Tech CSE @ IIIT Nagpur (2023–2027) • CGPA: 8.10",
  "💻 MERN Stack • AI Integration • System Design • DSA (350+ LeetCode)",
  "🧠 Creator of Outfit-AI (AI outfit recommender) & NOVA (Virtual AI Assistant)",
  "⚙️ Skilled in React, Node.js, Express, MongoDB, Python, FastAPI, Docker",
  "☁️ Passionate about decentralized cloud & real-time systems",
  "📱 Built scalable, AI-driven, and user-centric applications",
  "🚀 Vision-driven developer focused on building smarter, human-centric tech",
  "💬 Built cutsom cache for a real time chatting application",
  "🏆 Hackathon Achievements: Top 5 @ IIITM Gwalior | Top 50 @ Medecro.ai",
  "💼 Full Stack Developer — QuickIntell | Backend Intern — eSubhalekha",
  "🌐 Portfolio: aditya_kurani_portfolio.com | GitHub: AdityaKurani | LinkedIn: AdityaKurani"
];


// Custom Cursor
const customCursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});

// Audio Context
let audioContext = null;
let audioFiles = {};

// Load audio files
function loadAudioFiles() {
    // Load repulsor sound
    const repulsorSound = new Audio('iron-man-repulsor-157371 (3).mp3');
    repulsorSound.volume = 0.3;
    audioFiles.repulsor = repulsorSound;
    
    // Load missile sound
    const missileSound = new Audio('missile.mp3');
    missileSound.volume = 0.4;
    audioFiles.missile = missileSound;
    
    console.log('✅ Audio files loaded!');
}

// Play audio file
function playAudioFile(soundName) {
    if (gameState.audioMuted) return;
    if (audioFiles[soundName]) {
        const sound = audioFiles[soundName].cloneNode();
        sound.volume = audioFiles[soundName].volume;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// 3D Model Loader
let gltfLoader = null;
let modelCache = {};

function loadIronManModel() {
    if (!gltfLoader) {
        console.log('GLTF Loader not available');
        return;
    }
    
    console.log('Starting to load Iron Man model from iron_man.glb...');
    
    gltfLoader.load(
        'iron_man.glb',
        function (gltf) {
            console.log('✅ Iron Man model loaded successfully!');
            console.log('Model scene:', gltf.scene);
            console.log('Model children:', gltf.scene.children.length);
            
            modelCache.ironman = gltf.scene;
            
            // Replace gauntlet with Iron Man model if game started
            if (gameState.gameStarted && gameState.gauntlet) {
                setTimeout(() => {
                    replaceGauntletWithModel();
                }, 500);
            }
        },
        function (xhr) {
            const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
            console.log('Iron Man model: ' + percent + '% loaded');
        },
        function (error) {
            console.error('❌ Error loading Iron Man model:', error);
            console.log('Make sure iron_man.glb is in the same folder as index.html');
        }
    );
}

function replaceGauntletWithModel() {
    if (!modelCache.ironman) {
        console.log('Iron Man model not loaded yet');
        return;
    }
    
    if (!gameState.gauntlet) {
        console.log('No gauntlet to replace');
        return;
    }
    
    console.log('Replacing gauntlet with Iron Man model...');
    
    // Remove old gauntlet
    gameState.camera.remove(gameState.gauntlet);
    
    // Clone the Iron Man model
    const ironManModel = modelCache.ironman.clone();
    
    console.log('Iron Man model cloned, children:', ironManModel.children.length);
    
    // Model is HUGE (thousands of units), scale it WAY down
    ironManModel.scale.set(0.0003, 0.0003, 0.0003);
    
    // Position in front of camera
    ironManModel.position.set(0.4, -0.3, -0.6);
    
    // Rotate to face camera
    ironManModel.rotation.y = -0.3;
    ironManModel.rotation.x = 0.1;
    
    // Make sure all materials are visible and lit
    let meshCount = 0;
    let hasVisibleMesh = false;
    
    ironManModel.traverse((child) => {
        console.log('Child:', child.type, child.name);
        
        if (child.isMesh) {
            meshCount++;
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            
            console.log('  - Mesh found:', child.name, 'has material:', !!child.material);
            
            if (child.material) {
                hasVisibleMesh = true;
                
                // Handle array of materials
                if (Array.isArray(child.material)) {
                    console.log('  - Array of', child.material.length, 'materials');
                    child.material = child.material.map((mat, idx) => {
                        console.log('    - Material', idx, ':', mat.type);
                        // Create a bright basic material as fallback
                        const newMat = new THREE.MeshStandardMaterial({
                            color: mat.color || 0xff0000,
                            metalness: 0.8,
                            roughness: 0.2,
                            emissive: 0xff0000,
                            emissiveIntensity: 0.5,
                            side: THREE.DoubleSide
                        });
                        
                        // Copy texture if exists
                        if (mat.map) newMat.map = mat.map;
                        
                        return newMat;
                    });
                } else {
                    console.log('  - Single material:', child.material.type);
                    // Create a bright basic material as fallback
                    const originalColor = child.material.color || new THREE.Color(0xff0000);
                    child.material = new THREE.MeshStandardMaterial({
                        color: originalColor,
                        metalness: 0.8,
                        roughness: 0.2,
                        emissive: originalColor,
                        emissiveIntensity: 0.5,
                        side: THREE.DoubleSide
                    });
                    
                    // Copy texture if exists
                    if (child.material.map) {
                        child.material.map = child.material.map;
                    }
                }
            }
        }
    });
    
    console.log('Found', meshCount, 'meshes in Iron Man model');
    console.log('Has visible meshes:', hasVisibleMesh);
    
    // If no meshes found, the GLB model structure is unusual
    if (meshCount === 0) {
        console.warn('⚠️ No meshes found in GLB model! Using fallback only.');
    }
    
    // Add multiple lights to illuminate the model
    const frontLight = new THREE.PointLight(0xffffff, 2, 10);
    frontLight.position.set(0, 0, 2);
    ironManModel.add(frontLight);
    
    const sideLight = new THREE.PointLight(0x00ffff, 1.5, 8);
    sideLight.position.set(1, 0, 0);
    ironManModel.add(sideLight);
    
    const glowLight = new THREE.PointLight(0xff0066, 1, 5);
    glowLight.position.set(0, 0, 0);
    ironManModel.add(glowLight);
    
    // Calculate bounding box for debugging
    const bbox = new THREE.Box3().setFromObject(ironManModel);
    const size = bbox.getSize(new THREE.Vector3());
    console.log('Model bounding box size (after scale):', size);
    
    gameState.camera.add(ironManModel);
    gameState.gauntlet = ironManModel;
    
    console.log('✅ Iron Man model added to camera at position:', ironManModel.position);
    console.log('Scale:', ironManModel.scale);
    console.log('Rotation:', ironManModel.rotation);
    console.log('Model is now attached to camera - you should see a pink wireframe sphere!');
}

function createDetailedIronManHand() {
    const group = new THREE.Group();
    
    // Materials
    const redMetal = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x440000,
        emissiveIntensity: 0.3
    });
    
    const goldMetal = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 1,
        roughness: 0.1,
        emissive: 0x664400,
        emissiveIntensity: 0.2
    });
    
    // Palm
    const palmGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.5);
    const palm = new THREE.Mesh(palmGeometry, redMetal);
    palm.position.set(0, 0, 0);
    group.add(palm);
    
    // Gold accent on palm
    const accentGeometry = new THREE.BoxGeometry(0.41, 0.05, 0.51);
    const accent = new THREE.Mesh(accentGeometry, goldMetal);
    accent.position.set(0, 0.08, 0);
    group.add(accent);
    
    // Wrist/Forearm
    const wristGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.6, 8);
    const wrist = new THREE.Mesh(wristGeometry, redMetal);
    wrist.rotation.x = Math.PI / 2;
    wrist.position.set(0, 0, -0.5);
    group.add(wrist);
    
    // Repulsor Core (glowing)
    const coreGeometry = new THREE.SphereGeometry(0.12, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 0, 0.3);
    group.add(core);
    
    // Inner glow ring
    const innerGlowGeometry = new THREE.RingGeometry(0.12, 0.18, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    innerGlow.position.set(0, 0, 0.31);
    group.add(innerGlow);
    
    // Outer glow ring
    const outerGlowGeometry = new THREE.RingGeometry(0.18, 0.25, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.position.set(0, 0, 0.32);
    group.add(outerGlow);
    
    // Fingers (simplified)
    const fingerPositions = [
        [-0.15, 0, 0.2],  // Index
        [-0.05, 0, 0.25], // Middle
        [0.05, 0, 0.23],  // Ring
        [0.15, 0, 0.18]   // Pinky
    ];
    
    fingerPositions.forEach((pos, i) => {
        const fingerGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.3);
        const finger = new THREE.Mesh(fingerGeometry, redMetal);
        finger.position.set(pos[0], pos[1], pos[2]);
        finger.rotation.x = 0.2;
        group.add(finger);
        
        // Gold knuckle
        const knuckleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const knuckle = new THREE.Mesh(knuckleGeometry, goldMetal);
        knuckle.position.set(pos[0], pos[1], pos[2] - 0.1);
        group.add(knuckle);
    });
    
    // Thumb
    const thumbGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.25);
    const thumb = new THREE.Mesh(thumbGeometry, redMetal);
    thumb.position.set(-0.25, 0, 0.05);
    thumb.rotation.y = Math.PI / 3;
    thumb.rotation.z = Math.PI / 6;
    group.add(thumb);
    
    // Armor plates
    const platePositions = [
        [0, 0.1, -0.2],
        [0, -0.1, -0.2],
        [0.15, 0, -0.3],
        [-0.15, 0, -0.3]
    ];
    
    platePositions.forEach(pos => {
        const plateGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.15);
        const plate = new THREE.Mesh(plateGeometry, goldMetal);
        plate.position.set(pos[0], pos[1], pos[2]);
        group.add(plate);
    });
    
    // Add point light for repulsor
    const repulsorLight = new THREE.PointLight(0x00ffff, 3, 5);
    repulsorLight.position.set(0, 0, 0.4);
    group.add(repulsorLight);
    
    return group;
}

function createProceduralModel(type) {
    const group = new THREE.Group();
    
    if (type === 'robot') {
        // Create a more detailed robot model
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x330000
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.6;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.6, 0.5, 0);
        leftArm.rotation.z = Math.PI / 4;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.6, 0.5, 0);
        rightArm.rotation.z = -Math.PI / 4;
        group.add(rightArm);
        
        // Legs (with pivot point at top for rotation)
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
        
        // Left leg with proper pivot
        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.25, -0.2, 0);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.y = -0.4;
        leftLegPivot.add(leftLeg);
        group.add(leftLegPivot);
        
        // Right leg with proper pivot
        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.25, -0.2, 0);
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.y = -0.4;
        rightLegPivot.add(rightLeg);
        group.add(rightLegPivot);
        
        // Store leg references for animation
        group.userData.leftLeg = leftLegPivot;
        group.userData.rightLeg = rightLegPivot;
        group.userData.leftArm = leftArm;
        group.userData.rightArm = rightArm;
        
        // Glowing core
        const coreGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 0.5;
        group.add(core);
        
    } else if (type === 'drone') {
        // Create a flying drone model
        const bodyGeometry = new THREE.OctahedronGeometry(0.5, 0);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x6600ff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x330066
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // Propellers (stored for animation)
        group.userData.propellers = [];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const propGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.1);
            const propMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                metalness: 0.8,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5
            });
            const prop = new THREE.Mesh(propGeometry, propMaterial);
            prop.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
            group.add(prop);
            group.userData.propellers.push(prop);
        }
    } else if (type === 'ironman_gauntlet') {
        // Create Iron Man gauntlet for first-person view
        
        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.4);
        const gauntletMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x222222
        });
        const palm = new THREE.Mesh(palmGeometry, gauntletMaterial);
        palm.position.set(0, 0, 0);
        group.add(palm);
        
        // Fingers
        const fingerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.25);
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(fingerGeometry, gauntletMaterial);
            finger.position.set(-0.1 + i * 0.07, 0, 0.3);
            group.add(finger);
        }
        
        // Thumb
        const thumb = new THREE.Mesh(fingerGeometry, gauntletMaterial);
        thumb.position.set(-0.15, 0, 0.15);
        thumb.rotation.y = Math.PI / 4;
        group.add(thumb);
        
        // Wrist armor
        const wristGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 8);
        const wrist = new THREE.Mesh(wristGeometry, gauntletMaterial);
        wrist.position.set(0, 0, -0.3);
        wrist.rotation.x = Math.PI / 2;
        group.add(wrist);
        
        // Arc reactor glow on palm
        const reactorGeometry = new THREE.CircleGeometry(0.08, 16);
        const reactorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1,
            side: THREE.DoubleSide
        });
        const reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
        reactor.position.set(0, 0.08, 0.1);
        reactor.rotation.x = -Math.PI / 2;
        group.add(reactor);
        
        // Add point light for glow effect
        const reactorLight = new THREE.PointLight(0x00ffff, 1, 3);
        reactorLight.position.set(0, 0.08, 0.1);
        group.add(reactorLight);
        
        // Red accents
        const accentGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const accent1 = new THREE.Mesh(accentGeometry, accentMaterial);
        accent1.position.set(0.1, 0, 0);
        group.add(accent1);
        
        const accent2 = new THREE.Mesh(accentGeometry, accentMaterial);
        accent2.position.set(-0.1, 0, 0);
        group.add(accent2);
        
        group.userData.reactor = reactor;
        group.userData.reactorLight = reactorLight;
    }
    
    return group;
}

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (gameState.audioMuted) return;
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Initialize
window.addEventListener('load', () => {
    initLoading();
});

function initLoading() {
    let progress = 0;
    const progressBar = document.getElementById('loading-progress');
    const loadingText = document.getElementById('loading-text');
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('start-screen').style.display = 'flex';
            }, 500);
        }
        progressBar.style.width = progress + '%';
        
        const messages = [
            'Initializing Arc Reactor...',
            'Calibrating Repulsors...',
            'Loading JARVIS Protocol...',
            'Syncing HUD Systems...',
            'Powering Up Suit...'
        ];
        loadingText.textContent = messages[Math.floor(Math.random() * messages.length)];
    }, 200);
}

// Start Game
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button')?.addEventListener('click', restartGame);
document.getElementById('retry-button')?.addEventListener('click', restartGame);

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    gameState.gameStarted = true;
    gameState.startTime = Date.now();
    
    initThree();
    initControls();
    initAudio();
    loadAudioFiles();
    
    showWaveIntro(1);
    setTimeout(() => {
        spawnWave(1);
    }, 2000);
    animate();
}

function restartGame() {
    location.reload();
}

// Wave Intro
function showWaveIntro(waveNumber) {
    gameState.currentWave = waveNumber;
    const waveIntro = document.getElementById('wave-intro');
    const waveTitle = document.getElementById('wave-intro-title');
    
    if (waveNumber === 5) {
        waveTitle.textContent = 'FINAL BOSS';
    } else {
        waveTitle.textContent = `WAVE ${waveNumber}`;
    }
    
    waveIntro.style.display = 'flex';
    playSound(440, 0.2, 'square');
    
    setTimeout(() => {
        waveIntro.style.display = 'none';
    }, 1500);
    
    updateHUD();
}

// Combo System
function addCombo() {
    gameState.combo++;
    gameState.comboTimer = 3; // 3 seconds to maintain combo
    
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    if (gameState.combo >= 2) {
        showComboDisplay();
        playSound(600 + (gameState.combo * 50), 0.1, 'sine');
    }
}

function resetCombo() {
    gameState.combo = 0;
}

function showComboDisplay() {
    const comboDisplay = document.getElementById('combo-display');
    const comboText = document.getElementById('combo-text');
    
    let message = `${gameState.combo}x COMBO`;
    if (gameState.combo >= 10) message = `${gameState.combo}x LEGENDARY!`;
    else if (gameState.combo >= 7) message = `${gameState.combo}x GODLIKE!`;
    else if (gameState.combo >= 5) message = `${gameState.combo}x AMAZING!`;
    
    comboText.textContent = message;
    comboDisplay.style.display = 'block';
    
    setTimeout(() => {
        comboDisplay.style.display = 'none';
    }, 1000);
}

// Three.js Setup
function initThree() {
    // Scene with better fog
    gameState.scene = new THREE.Scene();
    gameState.scene.fog = new THREE.FogExp2(0x000000, 0.015);
    gameState.scene.background = new THREE.Color(0x000510);
    
    // Camera
    gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    gameState.camera.position.copy(gameState.player.position);
    
    // Renderer with enhanced settings
    gameState.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        logarithmicDepthBuffer: true
    });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gameState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    gameState.renderer.toneMappingExposure = 1.5;
    gameState.renderer.outputEncoding = THREE.sRGBEncoding;
    gameState.renderer.setClearColor(0x000510);
    // Shadows disabled for performance
    gameState.renderer.shadowMap.enabled = false;
    document.body.appendChild(gameState.renderer.domElement);
    
    // Clock
    gameState.clock = new THREE.Clock();
    
    // Enhanced Lighting System with dramatic colors
    const ambientLight = new THREE.AmbientLight(0x202040, 0.8);
    gameState.scene.add(ambientLight);
    
    // Main overhead light (brighter)
    const pointLight = new THREE.PointLight(0x00ffff, 3, 100);
    pointLight.position.set(0, 25, 0);
    gameState.scene.add(pointLight);
    
    // Colored accent lights (more intense)
    const redLight = new THREE.PointLight(0xff0066, 2.5, 50);
    redLight.position.set(-30, 10, -30);
    gameState.scene.add(redLight);
    
    const blueLight = new THREE.PointLight(0x0088ff, 2.5, 50);
    blueLight.position.set(30, 10, 30);
    gameState.scene.add(blueLight);
    
    const purpleLight = new THREE.PointLight(0x6600ff, 2, 45);
    purpleLight.position.set(0, 15, -30);
    gameState.scene.add(purpleLight);
    
    const orangeLight = new THREE.PointLight(0xff6600, 2, 45);
    orangeLight.position.set(0, 15, 30);
    gameState.scene.add(orangeLight);
    
    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0x00ffff, 0xff0066, 1);
    gameState.scene.add(hemiLight);
    
    // Store lights for animation
    gameState.sceneLights = [redLight, blueLight, purpleLight, orangeLight];
    
    // Optimized ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 40, 40);
    const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0x001a2a,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    gameState.scene.add(ground);
    gameState.ground = ground;
    
    // Optimized grid
    const gridHelper = new THREE.GridHelper(200, 50, 0x00ffff, 0x003366);
    gridHelper.material.opacity = 0.7;
    gridHelper.material.transparent = true;
    gameState.scene.add(gridHelper);
    gameState.grid = gridHelper;
    
    // Gauntlet
    createGauntlet();
    
    // Floating Data Screens
    createDataScreens();
    
    // Neon Structures
    createNeonStructures();
    
    // Starfield
    createStarfield();
    
    window.addEventListener('resize', onWindowResize);
}

function createGauntlet() {
    const gauntletGroup = new THREE.Group();
    
    // Palm with better material
    const palmGeometry = new THREE.BoxGeometry(0.35, 0.18, 0.45);
    const palmMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc0000,
        emissive: 0x660000,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.3
    });
    const palm = new THREE.Mesh(palmGeometry, palmMaterial);
    gauntletGroup.add(palm);
    
    // Gold accents
    const accentGeometry = new THREE.BoxGeometry(0.36, 0.05, 0.46);
    const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x664400,
        metalness: 1,
        roughness: 0.2
    });
    const accent = new THREE.Mesh(accentGeometry, accentMaterial);
    accent.position.y = 0.1;
    gauntletGroup.add(accent);
    
    // Repulsor Core - brighter
    const coreGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 0, 0.25);
    gauntletGroup.add(core);
    
    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    innerGlow.position.set(0, 0, 0.25);
    gauntletGroup.add(innerGlow);
    
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0, 0.25);
    gauntletGroup.add(glow);
    
    // Point light from repulsor
    const repulsorLight = new THREE.PointLight(0x00ffff, 2, 5);
    repulsorLight.position.set(0, 0, 0.3);
    gauntletGroup.add(repulsorLight);
    
    gauntletGroup.position.set(0.5, -0.35, -0.9);
    gauntletGroup.rotation.y = -0.3;
    gauntletGroup.rotation.x = 0.1;
    
    gameState.camera.add(gauntletGroup);
    gameState.scene.add(gameState.camera);
    gameState.gauntlet = gauntletGroup;
}

function createDataScreens() {
    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.PlaneGeometry(2.5, 1.8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const screen = new THREE.Mesh(geometry, material);
        
        const angle = (i / 8) * Math.PI * 2;
        const radius = 30;
        screen.position.set(
            Math.cos(angle) * radius,
            Math.random() * 12 + 5,
            Math.sin(angle) * radius
        );
        screen.lookAt(0, screen.position.y, 0);
        
        gameState.scene.add(screen);
    }
}

function createNeonStructures() {
    gameState.neonStructures = [];
    
    for (let i = 0; i < 12; i++) {
        const height = Math.random() * 18 + 10;
        const geometry = new THREE.BoxGeometry(2, height, 2);
        const color = Math.random() > 0.5 ? 0x00ffff : 0xff0066;
        const material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        const structure = new THREE.Mesh(geometry, material);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = 40 + Math.random() * 35;
        structure.position.set(
            Math.cos(angle) * radius,
            height / 2,
            Math.sin(angle) * radius
        );
        
        // Add rotation animation data
        structure.userData = {
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            pulseOffset: Math.random() * Math.PI * 2,
            baseOpacity: 0.8
        };
        
        gameState.scene.add(structure);
        gameState.neonStructures.push(structure);
    }
}

function createStarfield() {
    // Optimized single star layer
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 250;
        positions[i + 1] = Math.random() * 100 + 20;
        positions[i + 2] = (Math.random() - 0.5) * 250;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.4,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    gameState.scene.add(stars);
    gameState.stars = stars;
}

// Controls
function initControls() {
    // Use gameState.keys instead of local variable
    
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
        
        // Debug: Log all key presses
        console.log('Key pressed:', e.key, 'Keys state:', gameState.keys);
        
        // Slow motion (Q key instead of Space)
        if (e.key.toLowerCase() === 'q' && gameState.gameStarted && !gameState.slowMotion.active && gameState.slowMotion.cooldownLeft <= 0) {
            activateSlowMotion();
            e.preventDefault();
        }
        
        // Missile barrage (M)
        if (e.key.toLowerCase() === 'm' && gameState.gameStarted) {
            shootMissileBarrage();
        }
        
        // Toggle flying (F)
        if (e.key.toLowerCase() === 'f') {
            console.log('F key detected! Game started:', gameState.gameStarted, 'Current flying state:', gameState.player.isFlying);
            if (gameState.gameStarted) {
                toggleFlying();
            } else {
                console.log('Cannot fly - game not started yet!');
            }
        }
        
        // Toggle mute (V)
        if (e.key.toLowerCase() === 'v') {
            toggleMute();
        }
        
        // Handle space for flying (prevent default only when flying)
        if (e.key === ' ' && gameState.player.isFlying) {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
        console.log('Key released:', e.key, 'Keys state:', gameState.keys);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!gameState.gameStarted) return;
        gameState.mouse.x += e.movementX * gameState.player.mouseSensitivity;
        gameState.mouse.y += e.movementY * gameState.player.mouseSensitivity;
        gameState.mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gameState.mouse.y));
    });
    
    document.addEventListener('mousedown', (e) => {
        if (!gameState.gameStarted || gameState.gamePaused) return;
        if (e.button === 0) { // Left click
            shootRepulsor();
        } else if (e.button === 2) { // Right click
            shootBeam();
        }
    });
    
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Mobile touch controls
    initMobileControls();
}

function initMobileControls() {
    // Joystick for movement
    const joystick = document.getElementById('joystick');
    const joystickInner = joystick.querySelector('.joystick-inner');
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });
    
    joystick.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - joystickCenter.x;
        const deltaY = touch.clientY - joystickCenter.y;
        
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 35);
        const angle = Math.atan2(deltaY, deltaX);
        
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        joystickInner.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        
        // Update player movement
        if (gameState.keys) {
            gameState.keys.w = deltaY < -10;
            gameState.keys.s = deltaY > 10;
            gameState.keys.a = deltaX < -10;
            gameState.keys.d = deltaX > 10;
        }
    });
    
    joystick.addEventListener('touchend', () => {
        joystickActive = false;
        joystickInner.style.transform = 'translate(-50%, -50%)';
        if (gameState.keys) {
            gameState.keys.w = false;
            gameState.keys.s = false;
            gameState.keys.a = false;
            gameState.keys.d = false;
        }
    });
    
    // Mobile buttons
    document.getElementById('mobile-shoot').addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootRepulsor();
    });
    
    document.getElementById('mobile-beam').addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootBeam();
    });
    
    document.getElementById('mobile-missile').addEventListener('touchstart', (e) => {
        e.preventDefault();
        shootMissileBarrage();
    });
    
    document.getElementById('mobile-slow').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameState.slowMotion.active && gameState.slowMotion.cooldownLeft <= 0) {
            activateSlowMotion();
        }
    });
}

// Player Movement
function updatePlayer() {
    const moveSpeed = gameState.player.isFlying ? gameState.player.flySpeed : gameState.player.speed;
    
    // Rotation
    gameState.camera.rotation.y = -gameState.mouse.x;
    gameState.camera.rotation.x = -gameState.mouse.y;
    
    // Movement
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(gameState.camera.quaternion);
    
    if (gameState.player.isFlying) {
        // Flying mode - full 3D movement
        if (gameState.keys['w'] === true) {
            gameState.player.position.add(forward.multiplyScalar(moveSpeed));
        }
        if (gameState.keys['s'] === true) {
            gameState.player.position.add(forward.multiplyScalar(-moveSpeed));
        }
        if (gameState.keys['a'] === true) {
            gameState.player.position.add(right.multiplyScalar(-moveSpeed));
        }
        if (gameState.keys['d'] === true) {
            gameState.player.position.add(right.multiplyScalar(moveSpeed));
        }
        
        // Vertical movement in flying mode
        if (gameState.keys['shift']) {
            gameState.player.verticalVelocity = -0.2; // Descend
        } else if (gameState.keys[' '] || gameState.keys['space']) {
            gameState.player.verticalVelocity = 0.2; // Ascend
        } else {
            gameState.player.verticalVelocity *= 0.9; // Slow down
        }
        
        gameState.player.position.y += gameState.player.verticalVelocity;
        
        // Height limits
        if (gameState.player.position.y < 1) {
            gameState.player.position.y = 1;
            gameState.player.verticalVelocity = 0;
        }
        if (gameState.player.position.y > 50) {
            gameState.player.position.y = 50;
            gameState.player.verticalVelocity = 0;
        }
    } else {
        // Ground mode - 2D movement
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        if (gameState.keys['w'] === true) {
            gameState.player.position.add(forward.multiplyScalar(moveSpeed));
        }
        if (gameState.keys['s'] === true) {
            gameState.player.position.add(forward.multiplyScalar(-moveSpeed));
        }
        if (gameState.keys['a'] === true) {
            gameState.player.position.add(right.multiplyScalar(-moveSpeed));
        }
        if (gameState.keys['d'] === true) {
            gameState.player.position.add(right.multiplyScalar(moveSpeed));
        }
        
        gameState.player.position.y = 2;
    }
    
    gameState.camera.position.copy(gameState.player.position);
    
    // Energy regeneration
    if (gameState.player.energy < 100) {
        gameState.player.energy += 0.1;
        updateHUD();
    }
}

// Shooting
function shootRepulsor() {
    if (!gameState.player.canShoot || gameState.player.energy < 10) return;
    
    gameState.player.energy -= 10;
    gameState.totalShots++;
    updateHUD();
    
    // Play real repulsor sound
    playAudioFile('repulsor');
    
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.camera.quaternion);
    
    const projectile = {
        mesh: createRepulsorBlast(),
        velocity: direction.multiplyScalar(1),
        lifetime: 3,
        damage: 25
    };
    
    projectile.mesh.position.copy(gameState.camera.position);
    gameState.scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
    
    // Gauntlet recoil
    if (gameState.gauntlet) {
        gameState.gauntlet.position.z -= 0.1;
        setTimeout(() => {
            gameState.gauntlet.position.z += 0.1;
        }, 100);
    }
    
    createMuzzleFlash();
    createShootTrail(gameState.camera.position, direction);
}

function activateSlowMotion() {
    gameState.slowMotion.active = true;
    gameState.slowMotion.timeLeft = gameState.slowMotion.duration;
    gameState.slowMotion.cooldownLeft = gameState.slowMotion.cooldown;
    
    // Visual effect
    document.body.style.filter = 'hue-rotate(180deg) saturate(1.5)';
    playSound(200, 0.3, 'sine');
}

function deactivateSlowMotion() {
    gameState.slowMotion.active = false;
    document.body.style.filter = 'none';
    playSound(400, 0.2, 'sine');
}

function toggleFlying() {
    gameState.player.isFlying = !gameState.player.isFlying;
    
    const flightModeElement = document.getElementById('flight-mode');
    
    if (gameState.player.isFlying) {
        // Entering flying mode
        playSound(800, 0.2, 'sine');
        showNotification('🚀 FLIGHT MODE ACTIVATED', '#ffffff');
        if (flightModeElement) {
            flightModeElement.textContent = 'FLYING';
            flightModeElement.style.color = '#ffffff';
        }
        console.log('Flight mode activated');
    } else {
        // Exiting flying mode
        playSound(400, 0.2, 'sine');
        showNotification('🏃 GROUND MODE', '#888888');
        gameState.player.verticalVelocity = 0;
        if (flightModeElement) {
            flightModeElement.textContent = 'GROUND';
            flightModeElement.style.color = '#888888';
        }
        console.log('Ground mode activated');
    }
}

function toggleMute() {
    gameState.audioMuted = !gameState.audioMuted;
    
    const muteIndicator = document.getElementById('mute-indicator');
    
    if (gameState.audioMuted) {
        showNotification('🔇 AUDIO MUTED', '#888888');
        if (muteIndicator) {
            muteIndicator.textContent = '🔇 MUTED';
            muteIndicator.style.color = '#888888';
        }
        console.log('Audio muted');
    } else {
        showNotification('🔊 AUDIO ENABLED', '#ffffff');
        if (muteIndicator) {
            muteIndicator.textContent = '🔊 AUDIO';
            muteIndicator.style.color = '#ffffff';
        }
        console.log('Audio enabled');
    }
}

function showNotification(message, color) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.color = color;
    notification.style.fontSize = '32px';
    notification.style.fontWeight = 'bold';
    notification.style.textShadow = `0 0 20px ${color}`;
    notification.style.zIndex = '9999';
    notification.style.pointerEvents = 'none';
    notification.style.fontFamily = 'Orbitron, monospace';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 1500);
}

function shootMissileBarrage() {
    if (gameState.player.energy < 50 || gameState.missiles.cooldownLeft > 0) return;
    
    gameState.player.energy -= 50;
    gameState.missiles.cooldownLeft = gameState.missiles.cooldown;
    updateHUD();
    
    // Play missile sound once
    playAudioFile('missile');
    
    // Launch 5 missiles
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            launchHomingMissile();
        }, i * 100);
    }
}

function launchHomingMissile() {
    const missile = {
        mesh: createMissile(),
        velocity: new THREE.Vector3(0, 0, -1),
        lifetime: 5,
        damage: 40,
        isHoming: true,
        target: null
    };
    
    missile.mesh.position.copy(gameState.camera.position);
    gameState.scene.add(missile.mesh);
    gameState.projectiles.push(missile);
}

function createMissile() {
    const group = new THREE.Group();
    
    // Missile body
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Missile tip
    const tipGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
    const tipMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.35;
    group.add(tip);
    
    // Trail light
    const light = new THREE.PointLight(0xff6600, 1, 3);
    group.add(light);
    
    return group;
}

function shootBeam() {
    if (gameState.player.energy < 30) return;
    
    gameState.player.energy -= 30;
    gameState.totalShots++;
    updateHUD();
    
    // Play same repulsor sound as normal attack
    playAudioFile('repulsor');
    
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.camera.quaternion);
    const beamLength = 50;
    
    // Main beam
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, beamLength, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0066,
        transparent: true,
        opacity: 0.9
    });
    const beam = new THREE.Mesh(geometry, material);
    
    // Position beam correctly
    const beamPosition = gameState.camera.position.clone().add(direction.clone().multiplyScalar(beamLength / 2));
    beam.position.copy(beamPosition);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    
    gameState.scene.add(beam);
    
    // Outer glow beam
    const glowGeometry = new THREE.CylinderGeometry(0.4, 0.4, beamLength, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0066,
        transparent: true,
        opacity: 0.4
    });
    const glowBeam = new THREE.Mesh(glowGeometry, glowMaterial);
    glowBeam.position.copy(beam.position);
    glowBeam.quaternion.copy(beam.quaternion);
    gameState.scene.add(glowBeam);
    
    // Inner core beam
    const coreGeometry = new THREE.CylinderGeometry(0.1, 0.1, beamLength, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const coreBeam = new THREE.Mesh(coreGeometry, coreMaterial);
    coreBeam.position.copy(beam.position);
    coreBeam.quaternion.copy(beam.quaternion);
    gameState.scene.add(coreBeam);
    
    // Damage enemies in beam path
    gameState.enemies.forEach(enemy => {
        const distance = enemy.mesh.position.distanceTo(gameState.camera.position);
        if (distance < beamLength) {
            const toEnemy = enemy.mesh.position.clone().sub(gameState.camera.position).normalize();
            const dot = direction.dot(toEnemy);
            // More forgiving hit detection
            if (dot > 0.9) {
                damageEnemy(enemy, 50);
                createHitEffect(enemy.mesh.position);
            }
        }
    });
    
    // Add muzzle flash
    createMuzzleFlash();
    
    // Remove beams after duration
    setTimeout(() => {
        gameState.scene.remove(beam);
        gameState.scene.remove(glowBeam);
        gameState.scene.remove(coreBeam);
    }, 300);
}

function createRepulsorBlast() {
    const group = new THREE.Group();
    
    // Core blast (brighter)
    const geometry = new THREE.SphereGeometry(0.25, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);
    
    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    group.add(innerGlow);
    
    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    group.add(outerGlow);
    
    // Add bright point light
    const light = new THREE.PointLight(0x00ffff, 3, 8);
    group.add(light);
    
    return group;
}

function createMuzzleFlash() {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(gameState.camera.position);
    flash.position.add(new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.camera.quaternion));
    
    gameState.scene.add(flash);
    
    setTimeout(() => {
        gameState.scene.remove(flash);
    }, 50);
}

function createShootTrail(startPos, direction) {
    // Reduced trail particles for performance
    for (let i = 0; i < 3; i++) {
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        const particle = new THREE.Mesh(geometry, material);
        
        const offset = direction.clone().multiplyScalar(i * 0.4);
        particle.position.copy(startPos).add(offset);
        
        gameState.scene.add(particle);
        gameState.particles.push({
            mesh: particle,
            velocity: new THREE.Vector3(0, 0, 0),
            lifetime: 0.2
        });
    }
}

// Enemies
function spawnWave(waveNumber) {
    const enemyCount = 3 + waveNumber * 2;
    
    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            spawnEnemy(waveNumber > 3 ? 'thanos' : 'ultron');
        }, i * 1000);
    }
    
    if (waveNumber === 4) {
        setTimeout(() => {
            spawnBoss();
        }, enemyCount * 1000 + 2000);
    }
}

function spawnEnemy(type) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    
    const enemy = {
        type: type,
        mesh: createEnemyMesh(type),
        health: type === 'thanos' ? 75 : 50,
        maxHealth: type === 'thanos' ? 75 : 50,
        speed: type === 'thanos' ? 0.03 : 0.05,
        damage: type === 'thanos' ? 15 : 10,
        shootTimer: 0,
        shootInterval: type === 'thanos' ? 2 : 3
    };
    
    enemy.mesh.position.set(
        Math.cos(angle) * radius,
        0.5, // Ground level
        Math.sin(angle) * radius
    );
    
    gameState.scene.add(enemy.mesh);
    gameState.enemies.push(enemy);
    updateHUD();
}

function createEnemyMesh(type) {
    // Use procedural 3D models
    const modelType = type === 'thanos' ? 'drone' : 'robot';
    const baseModel = createProceduralModel(modelType);
    
    const group = new THREE.Group();
    const color = type === 'thanos' ? 0x6600ff : 0xff0000;
    
    // Add the procedural model
    group.add(baseModel);
    
    // Add point light to enemy (subtle)
    const enemyLight = new THREE.PointLight(color, 0.5, 3);
    enemyLight.position.set(0, 1, 0);
    group.add(enemyLight);
    
    return group;
}

function spawnBoss() {
    gameState.bossActive = true;
    document.getElementById('boss-health').style.display = 'block';
    document.getElementById('objective-text').textContent = 'Defeat System Overload';
    
    const boss = {
        type: 'boss',
        mesh: createBossMesh(),
        health: 500,
        maxHealth: 500,
        speed: 0.02,
        damage: 25,
        shootTimer: 0,
        shootInterval: 1,
        phase: 1
    };
    
    boss.mesh.position.set(0, 3, -40); // Lower but still imposing
    boss.baseY = 3; // Boss floats higher than regular enemies
    gameState.scene.add(boss.mesh);
    gameState.boss = boss;
    gameState.enemies.push(boss);
}

function createBossMesh() {
    const group = new THREE.Group();
    
    // Core - detailed geometric shape
    const coreGeometry = new THREE.IcosahedronGeometry(2.5, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0066,
        emissive: 0xff0066,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Inner rotating structure
    const innerGeometry = new THREE.OctahedronGeometry(2, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0066,
        wireframe: true,
        transparent: true,
        opacity: 0.6
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(inner);
    
    // Outer wireframe
    const wireframeGeometry = new THREE.IcosahedronGeometry(3.2, 0);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0066,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    group.add(wireframe);
    
    // Outer glow sphere
    const glowGeometry = new THREE.SphereGeometry(4, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0066,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Orbital rings
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(5 + i * 1.5, 0.3, 16, 64);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = (i * Math.PI) / 3;
        group.add(ring);
        
        // Ring particles
        const particleCount = 20;
        for (let j = 0; j < particleCount; j++) {
            const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            const angle = (j / particleCount) * Math.PI * 2;
            const radius = 5 + i * 1.5;
            particle.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            ring.add(particle);
        }
    }
    
    // Energy spikes
    for (let i = 0; i < 8; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.3, 2, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0066,
            emissive: 0xff0066,
            emissiveIntensity: 0.5,
            metalness: 0.8
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const angle = (i / 8) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
        spike.lookAt(0, 0, 0);
        group.add(spike);
    }
    
    // Add powerful point light
    const bossLight = new THREE.PointLight(0xff0066, 3, 25);
    bossLight.position.set(0, 0, 0);
    group.add(bossLight);
    
    return group;
}

function updateEnemies(delta) {
    const time = Date.now() * 0.001;
    
    gameState.enemies.forEach((enemy, index) => {
        // Store base Y position if not set (ground level)
        if (enemy.baseY === undefined) {
            enemy.baseY = 0.5; // Just above ground
        }
        
        // Move towards player (only X and Z)
        const direction = gameState.player.position.clone().sub(enemy.mesh.position).normalize();
        enemy.mesh.position.x += direction.x * enemy.speed;
        enemy.mesh.position.z += direction.z * enemy.speed;
        
        // Slight bobbing animation (only affects Y)
        const bobOffset = Math.sin(time * 2 + index) * 0.1; // Reduced bobbing
        enemy.mesh.position.y = enemy.baseY + bobOffset;
        
        // Walking animation for robots
        if (enemy.type !== 'boss' && enemy.type !== 'thanos') {
            const model = enemy.mesh.children[0]; // Get the procedural model
            if (model && model.userData) {
                const walkSpeed = 8; // Walking speed
                const walkCycle = time * walkSpeed + index;
                
                // Leg swing animation (opposite legs move together)
                if (model.userData.leftLeg) {
                    model.userData.leftLeg.rotation.x = Math.sin(walkCycle) * 0.5;
                }
                if (model.userData.rightLeg) {
                    model.userData.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
                }
                
                // Arm swing animation (opposite to legs)
                if (model.userData.leftArm) {
                    model.userData.leftArm.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
                }
                if (model.userData.rightArm) {
                    model.userData.rightArm.rotation.x = Math.sin(walkCycle) * 0.3;
                }
            }
        }
        
        // Gentle rotation for drones
        if (enemy.type === 'thanos') {
            enemy.mesh.rotation.y += delta * 0.5;
            
            // Propeller spinning for drones
            const model = enemy.mesh.children[0];
            if (model && model.userData && model.userData.propellers) {
                model.userData.propellers.forEach((propeller) => {
                    propeller.rotation.y += delta * 30; // Fast spinning
                });
            }
        }
        
        // Look at player (tilt)
        const lookDirection = gameState.player.position.clone().sub(enemy.mesh.position);
        const lookDistance = lookDirection.length();
        enemy.mesh.rotation.x = Math.atan2(lookDirection.y, lookDistance) * 0.5;
        
        // Shoot
        enemy.shootTimer += delta;
        if (enemy.shootTimer >= enemy.shootInterval) {
            enemy.shootTimer = 0;
            enemyShoot(enemy);
        }
        
        // Animate boss with complex rotations
        if (enemy.type === 'boss') {
            enemy.mesh.rotation.y += delta * 0.5;
            
            // Rotate inner core
            if (enemy.mesh.children[1]) {
                enemy.mesh.children[1].rotation.x += delta * 1.5;
                enemy.mesh.children[1].rotation.y += delta * 1;
            }
            
            // Rotate outer wireframe
            if (enemy.mesh.children[2]) {
                enemy.mesh.children[2].rotation.x -= delta * 0.8;
                enemy.mesh.children[2].rotation.z += delta * 0.5;
            }
            
            // Pulse boss glow
            const glowMesh = enemy.mesh.children[3];
            if (glowMesh) {
                glowMesh.material.opacity = 0.15 + Math.sin(Date.now() * 0.002) * 0.08;
            }
            
            // Animate energy spikes
            for (let i = 4; i < enemy.mesh.children.length - 9; i++) {
                const spike = enemy.mesh.children[i];
                if (spike) {
                    spike.position.y = Math.sin(Date.now() * 0.003 + i) * 0.5;
                }
            }
        } else {
            // Animate regular enemy models
            const baseModel = enemy.mesh.children[0];
            if (baseModel) {
                // Rotate drone propellers or robot parts
                if (enemy.type === 'thanos') {
                    // Rotate propellers
                    for (let i = 1; i < baseModel.children.length; i++) {
                        baseModel.children[i].rotation.y += delta * 10;
                    }
                    // Bob up and down
                    enemy.mesh.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.3;
                } else {
                    // Robot arm animation
                    if (baseModel.children[2]) {
                        baseModel.children[2].rotation.z = Math.PI / 4 + Math.sin(Date.now() * 0.002) * 0.2;
                    }
                    if (baseModel.children[3]) {
                        baseModel.children[3].rotation.z = -Math.PI / 4 - Math.sin(Date.now() * 0.002) * 0.2;
                    }
                }
            }
        }
        
        // Check collision with player
        const distance = enemy.mesh.position.distanceTo(gameState.player.position);
        if (distance < 2) {
            damagePlayer(enemy.damage);
            if (enemy.type !== 'boss') {
                removeEnemy(index);
            }
        }
    });
}

function createEnemyProjectile() {
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        emissive: 0xff0000
    });
    return new THREE.Mesh(geometry, material);
}

function enemyShoot(enemy) {
    const direction = gameState.player.position.clone().sub(enemy.mesh.position).normalize();
    
    const projectile = {
        mesh: createEnemyProjectile(),
        velocity: direction.multiplyScalar(0.5),
        lifetime: 5,
        damage: enemy.damage,
        isEnemy: true
    };
    
    projectile.mesh.position.copy(enemy.mesh.position);
    gameState.scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
}

function damageEnemy(enemy, baseDamage) {
    const { damage, isCrit } = calculateDamage(baseDamage);
    
    enemy.health -= damage;
    gameState.shotsHit++;
    
    // Show damage number
    showDamageNumber(damage, enemy.mesh.position, isCrit);
    
    if (enemy.type === 'boss') {
        updateBossHealth();
    }
    
    if (enemy.health <= 0) {
        const index = gameState.enemies.indexOf(enemy);
        if (index > -1) {
            // Kill tracking
            gameState.killCount++;
            addCombo();
            
            // Kill sound removed
            
            // Chance to drop pickup
            spawnPickup(enemy.mesh.position);
            
            removeEnemy(index);
            
            if (enemy.type === 'boss') {
                victory();
            } else {
                gameState.score += 100;
                if (gameState.dataFragments < gameState.totalFragments) {
                    showDataFragment();
                }
            }
            
            updateHUD();
        }
    }
    
    // Hit effect
    createHitEffect(enemy.mesh.position);
}

function showDamageNumber(damage, worldPosition, isCrit = false) {
    // Convert 3D position to 2D screen position
    const vector = worldPosition.clone();
    vector.project(gameState.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
    
    // Create damage number element
    const damageNum = document.createElement('div');
    damageNum.className = isCrit ? 'damage-number crit' : 'damage-number';
    damageNum.textContent = Math.floor(damage) + (isCrit ? ' CRIT!' : '');
    damageNum.style.left = x + 'px';
    damageNum.style.top = y + 'px';
    
    // Random horizontal offset
    const offsetX = (Math.random() - 0.5) * 50;
    damageNum.style.transform = `translateX(${offsetX}px)`;
    
    document.getElementById('damage-numbers').appendChild(damageNum);
    
    // Remove after animation
    setTimeout(() => {
        damageNum.remove();
    }, 1000);
}

function removeEnemy(index) {
    const enemy = gameState.enemies[index];
    gameState.scene.remove(enemy.mesh);
    gameState.enemies.splice(index, 1);
    updateHUD();
    
    // Check for next wave
    if (gameState.enemies.length === 0 && !gameState.bossActive) {
        const wave = gameState.currentWave + 1;
        if (wave <= 4) {
            setTimeout(() => {
                showWaveIntro(wave);
                setTimeout(() => {
                    spawnWave(wave);
                }, 2000);
            }, 2000);
        } else if (wave === 5) {
            // Spawn boss after wave 4
            setTimeout(() => {
                showWaveIntro(5);
                setTimeout(() => {
                    spawnBoss();
                }, 2000);
            }, 2000);
        }
    }
}

function damagePlayer(damage) {
    gameState.player.health -= damage;
    updateHUD();
    
    // Screen flash with vignette
    document.body.style.background = 'radial-gradient(circle, rgba(255,0,0,0.3) 0%, rgba(255,0,0,0.6) 100%)';
    setTimeout(() => {
        document.body.style.background = '#000';
    }, 150);
    
    // Camera shake
    if (gameState.camera) {
        const originalPos = gameState.camera.position.clone();
        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
            if (shakeCount < 5) {
                gameState.camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.1;
                gameState.camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.1;
                shakeCount++;
            } else {
                gameState.camera.position.copy(originalPos);
                clearInterval(shakeInterval);
            }
        }, 30);
    }
    
    // Screen shake
    document.body.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('shake');
    }, 300);
    
    if (gameState.player.health <= 0) {
        gameOver();
    }
}

function createHitEffect(position) {
    const particleCount = 6;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 0.2;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 0.2,
            Math.sin(angle) * speed
        );
        
        gameState.scene.add(particle);
        gameState.particles.push({
            mesh: particle,
            velocity: velocity,
            lifetime: 0.5
        });
    }
}

function createExplosion(position) {
    const particleCount = 25;
    
    // Main explosion particles
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.25, 8, 8);
        const hue = Math.random() * 0.15 + 0.05; // Orange to yellow
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(hue, 1, 0.6),
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.copy(position);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        const speed = 0.5 + Math.random() * 0.4;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
        );
        
        gameState.scene.add(particle);
        gameState.particles.push({
            mesh: particle,
            velocity: velocity,
            lifetime: 1.5,
            initialScale: 1
        });
    }
    
    // Bright core flash
    const flashGeometry = new THREE.SphereGeometry(2, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    gameState.scene.add(flash);
    
    gameState.particles.push({
        mesh: flash,
        velocity: new THREE.Vector3(0, 0, 0),
        lifetime: 0.4,
        isFlash: true
    });
    
    // Shockwave ring
    const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.lookAt(gameState.camera.position);
    gameState.scene.add(ring);
    
    gameState.particles.push({
        mesh: ring,
        velocity: new THREE.Vector3(0, 0, 0),
        lifetime: 0.5,
        isRing: true,
        scale: 1
    });
    
    // Add explosion light
    const explosionLight = new THREE.PointLight(0xff6600, 5, 15);
    explosionLight.position.copy(position);
    gameState.scene.add(explosionLight);
    
    setTimeout(() => {
        gameState.scene.remove(explosionLight);
    }, 200);
}

// Projectiles
function updateProjectiles(delta) {
    gameState.projectiles.forEach((projectile, index) => {
        // Homing missile logic
        if (projectile.isHoming) {
            // Find nearest enemy
            if (!projectile.target || !gameState.enemies.includes(projectile.target)) {
                let nearest = null;
                let nearestDist = Infinity;
                gameState.enemies.forEach(enemy => {
                    const dist = projectile.mesh.position.distanceTo(enemy.mesh.position);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = enemy;
                    }
                });
                projectile.target = nearest;
            }
            
            // Home toward target
            if (projectile.target) {
                const direction = projectile.target.mesh.position.clone()
                    .sub(projectile.mesh.position)
                    .normalize();
                projectile.velocity.lerp(direction.multiplyScalar(0.8), 0.1);
                projectile.mesh.lookAt(projectile.target.mesh.position);
            }
            
            // Spin missile
            projectile.mesh.rotation.z += delta * 10;
        } else {
            // Rotate regular projectiles
            projectile.mesh.rotation.x += delta * 5;
            projectile.mesh.rotation.y += delta * 5;
        }
        
        // Pulse glow layers
        if (projectile.mesh.children.length > 1) {
            const time = Date.now() * 0.005;
            projectile.mesh.children.forEach((child, i) => {
                if (child.material && child.material.opacity !== undefined) {
                    const baseOpacity = i === 0 ? 1 : (i === 1 ? 0.6 : 0.3);
                    child.material.opacity = baseOpacity + Math.sin(time + i) * 0.2;
                }
            });
        }
        
        projectile.mesh.position.add(projectile.velocity);
        projectile.lifetime -= delta;
        
        // Add trail particles
        if (!projectile.isEnemy && Math.random() < 0.3) {
            const trailGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const trailColor = projectile.isHoming ? 0xff6600 : 0x00ffff;
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: trailColor,
                transparent: true,
                opacity: 0.6
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.copy(projectile.mesh.position);
            gameState.scene.add(trail);
            
            gameState.particles.push({
                mesh: trail,
                velocity: new THREE.Vector3(0, 0, 0),
                lifetime: 0.3
            });
        }
        
        if (projectile.lifetime <= 0) {
            gameState.scene.remove(projectile.mesh);
            gameState.projectiles.splice(index, 1);
            return;
        }
        
        // Check collisions
        if (projectile.isEnemy) {
            const distance = projectile.mesh.position.distanceTo(gameState.player.position);
            if (distance < 1) {
                damagePlayer(projectile.damage);
                gameState.scene.remove(projectile.mesh);
                gameState.projectiles.splice(index, 1);
            }
        } else {
            gameState.enemies.forEach(enemy => {
                const distance = projectile.mesh.position.distanceTo(enemy.mesh.position);
                if (distance < 2) {
                    damageEnemy(enemy, projectile.damage);
                    gameState.scene.remove(projectile.mesh);
                    gameState.projectiles.splice(index, 1);
                }
            });
        }
    });
}

// Particles
function updateParticles(delta) {
    gameState.particles.forEach((particle, index) => {
        particle.mesh.position.add(particle.velocity);
        particle.lifetime -= delta;
        
        // Handle different particle types
        if (particle.isRing) {
            // Expand shockwave ring
            particle.scale += delta * 8;
            particle.mesh.scale.set(particle.scale, particle.scale, 1);
            particle.mesh.material.opacity = particle.lifetime * 1.6;
        } else if (particle.isFlash) {
            // Flash fades quickly
            particle.mesh.material.opacity = particle.lifetime * 2.5;
            particle.mesh.scale.setScalar(1 + (0.4 - particle.lifetime) * 2);
        } else {
            // Regular particles
            particle.mesh.material.opacity = particle.lifetime * 0.8;
            if (particle.initialScale) {
                const scale = 1 - (1 - particle.lifetime / 1.5) * 0.5;
                particle.mesh.scale.setScalar(scale);
            }
        }
        
        if (particle.lifetime <= 0) {
            gameState.scene.remove(particle.mesh);
            gameState.particles.splice(index, 1);
        }
    });
}

// HUD
function updateHUD() {
    document.getElementById('shield-bar').style.width = gameState.player.health + '%';
    document.getElementById('shield-value').textContent = Math.max(0, Math.floor(gameState.player.health));
    
    document.getElementById('energy-bar').style.width = gameState.player.energy + '%';
    document.getElementById('energy-value').textContent = Math.max(0, Math.floor(gameState.player.energy));
    
    document.getElementById('score-value').textContent = gameState.dataFragments + ' / ' + gameState.totalFragments;
    document.getElementById('enemy-value').textContent = gameState.enemies.length;
    document.getElementById('wave-value').textContent = gameState.currentWave;
    document.getElementById('kill-value').textContent = gameState.killCount;
}

function updateBossHealth() {
    if (gameState.boss) {
        const percent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
        document.getElementById('boss-bar').style.width = percent + '%';
    }
}

function showDataFragment() {
    gameState.dataFragments++;
    
    // Pause the game
    gameState.gamePaused = true;
    
    const popup = document.getElementById('data-popup');
    const body = document.getElementById('popup-body');
    
    body.textContent = portfolioData[gameState.dataFragments - 1];
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
        // Resume the game after popup closes
        gameState.gamePaused = false;
    }, 3000);
    
    updateHUD();
}

// Game States
function victory() {
    gameState.gameStarted = false;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('boss-health').style.display = 'none';
    
    // Calculate stats
    const timePlayed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(timePlayed / 60);
    const seconds = timePlayed % 60;
    const accuracy = gameState.totalShots > 0 ? Math.floor((gameState.shotsHit / gameState.totalShots) * 100) : 0;
    
    // Update stats display
    document.getElementById('final-kills').textContent = gameState.killCount;
    document.getElementById('final-accuracy').textContent = accuracy + '%';
    document.getElementById('final-combo').textContent = gameState.maxCombo + 'x';
    document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Victory sound
    playSound(523, 0.3, 'sine');
    setTimeout(() => playSound(659, 0.3, 'sine'), 300);
    setTimeout(() => playSound(784, 0.5, 'sine'), 600);
    
    document.getElementById('victory-screen').style.display = 'flex';
}

function gameOver() {
    gameState.gameStarted = false;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'flex';
}

// Window Resize
function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Pickup System
function spawnPickup(position) {
    const rand = Math.random();
    let type;
    
    if (rand < 0.3) { // 30% chance
        if (Math.random() < 0.4) type = 'health';
        else if (Math.random() < 0.6) type = 'energy';
        else type = 'powerup';
        
        const pickup = {
            type: type,
            mesh: createPickupMesh(type),
            lifetime: 15,
            rotationSpeed: 2
        };
        
        pickup.mesh.position.copy(position);
        pickup.mesh.position.y = 2;
        gameState.scene.add(pickup.mesh);
        gameState.pickups.push(pickup);
    }
}

function createPickupMesh(type) {
    const group = new THREE.Group();
    
    if (type === 'health') {
        const geometry = new THREE.OctahedronGeometry(0.4, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        const light = new THREE.PointLight(0xff0000, 1, 5);
        group.add(light);
    } else if (type === 'energy') {
        const geometry = new THREE.TetrahedronGeometry(0.4, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: false });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        const light = new THREE.PointLight(0x00ffff, 1, 5);
        group.add(light);
    } else if (type === 'powerup') {
        const geometry = new THREE.IcosahedronGeometry(0.5, 0);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: false });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        const light = new THREE.PointLight(0xffff00, 1, 5);
        group.add(light);
    }
    
    return group;
}

function updatePickups(delta) {
    for (let i = gameState.pickups.length - 1; i >= 0; i--) {
        const pickup = gameState.pickups[i];
        
        // Rotate
        pickup.mesh.rotation.y += pickup.rotationSpeed * delta;
        pickup.mesh.rotation.x += pickup.rotationSpeed * 0.5 * delta;
        
        // Bob up and down
        pickup.mesh.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.3;
        
        // Check collision with player
        const distance = pickup.mesh.position.distanceTo(gameState.player.position);
        if (distance < 1.5) {
            collectPickup(pickup, i);
        }
        
        // Lifetime
        pickup.lifetime -= delta;
        if (pickup.lifetime <= 0) {
            gameState.scene.remove(pickup.mesh);
            gameState.pickups.splice(i, 1);
        }
    }
}

function collectPickup(pickup, index) {
    playSound(800, 0.2, 'sine');
    
    if (pickup.type === 'health') {
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
        showNotification('❤️ +30 HEALTH', '#ff0000');
    } else if (pickup.type === 'energy') {
        gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + 50);
        showNotification('⚡ +50 ENERGY', '#00ffff');
    } else if (pickup.type === 'powerup') {
        activateRandomPowerup();
    }
    
    gameState.scene.remove(pickup.mesh);
    gameState.pickups.splice(index, 1);
    updateHUD();
}

function activateRandomPowerup() {
    const powerups = ['damageBoost', 'rapidFire', 'shield'];
    const selected = powerups[Math.floor(Math.random() * powerups.length)];
    
    const powerup = gameState.powerups[selected];
    powerup.active = true;
    powerup.timeLeft = powerup.duration;
    
    if (selected === 'damageBoost') {
        showNotification('💥 DAMAGE BOOST!', '#ff6600');
    } else if (selected === 'rapidFire') {
        showNotification('🔥 RAPID FIRE!', '#ffaa00');
        gameState.player.canShoot = true;
    } else if (selected === 'shield') {
        showNotification('🛡️ SHIELD BOOST!', '#00ffff');
        gameState.player.shield = gameState.player.maxShield;
    }
}

function updatePowerups(delta) {
    for (const key in gameState.powerups) {
        const powerup = gameState.powerups[key];
        if (powerup.active) {
            powerup.timeLeft -= delta;
            if (powerup.timeLeft <= 0) {
                powerup.active = false;
                showNotification(`${key.toUpperCase()} ENDED`, '#888888');
            }
        }
    }
}

// Critical Hit System
function calculateDamage(baseDamage) {
    let damage = baseDamage;
    
    // Apply damage boost powerup
    if (gameState.powerups.damageBoost.active) {
        damage *= gameState.powerups.damageBoost.multiplier;
    }
    
    // Critical hit chance
    if (Math.random() < gameState.critChance) {
        damage *= gameState.critMultiplier;
        return { damage, isCrit: true };
    }
    
    return { damage, isCrit: false };
}

// Animation Loop
function animate() {
    if (!gameState.gameStarted) return;
    
    requestAnimationFrame(animate);
    
    if (gameState.gamePaused) return;
    
    let delta = gameState.clock.getDelta();
    
    // Slow motion effect
    if (gameState.slowMotion.active) {
        delta *= 0.3; // 30% speed
        gameState.slowMotion.timeLeft -= gameState.clock.getDelta();
        if (gameState.slowMotion.timeLeft <= 0) {
            deactivateSlowMotion();
        }
    }
    
    // Update cooldowns
    if (gameState.slowMotion.cooldownLeft > 0) {
        gameState.slowMotion.cooldownLeft -= gameState.clock.getDelta();
    }
    if (gameState.missiles.cooldownLeft > 0) {
        gameState.missiles.cooldownLeft -= gameState.clock.getDelta();
    }
    
    updatePlayer();
    updateEnemies(delta);
    updateProjectiles(delta);
    updateParticles(delta);
    updatePickups(delta);
    updatePowerups(delta);
    
    // Update combo timer
    if (gameState.combo > 0) {
        gameState.comboTimer -= delta;
        if (gameState.comboTimer <= 0) {
            resetCombo();
        }
    }
    
    // Animate starfield
    if (gameState.stars) {
        gameState.stars.rotation.y += delta * 0.05;
    }
    
    // Simplified animations for performance
    const time = Date.now() * 0.002;
    
    // Animate scene lights for dynamic atmosphere
    if (gameState.sceneLights) {
        gameState.sceneLights.forEach((light, index) => {
            const offset = index * Math.PI * 0.5;
            light.intensity = 2 + Math.sin(time * 2 + offset) * 0.5;
        });
    }
    
    // Animate neon structures
    if (gameState.neonStructures) {
        gameState.neonStructures.forEach((structure) => {
            // Rotate
            structure.rotation.y += structure.userData.rotationSpeed * delta;
            
            // Pulse opacity
            const pulse = Math.sin(time * 3 + structure.userData.pulseOffset);
            structure.material.opacity = structure.userData.baseOpacity + pulse * 0.2;
            
            // Slight vertical bob
            structure.position.y += Math.sin(time * 2 + structure.userData.pulseOffset) * 0.01;
        });
    }
    
    // Animate gauntlet glow and position
    if (gameState.gauntlet) {
        // Pulse glow layers
        const outerGlow = gameState.gauntlet.children[4];
        if (outerGlow && outerGlow.material && outerGlow.material.transparent) {
            outerGlow.material.opacity = 0.3 + Math.sin(time * 4) * 0.15;
        }
        
        const innerGlow = gameState.gauntlet.children[3];
        if (innerGlow && innerGlow.material && innerGlow.material.transparent) {
            innerGlow.material.opacity = 0.6 + Math.sin(time * 3) * 0.2;
        }
        
        // Subtle breathing animation
        gameState.gauntlet.position.z = -0.9 + Math.sin(time * 1.5) * 0.02;
        
        // Pulse repulsor light
        const repulsorLight = gameState.gauntlet.children[5];
        if (repulsorLight && repulsorLight.isLight) {
            repulsorLight.intensity = 2 + Math.sin(time * 5) * 0.5;
        }
    }
    
    // Animate ground opacity only
    if (gameState.ground) {
        gameState.ground.material.opacity = 0.6 + Math.sin(time * 0.5) * 0.1;
    }
    
    gameState.renderer.render(gameState.scene, gameState.camera);
}
