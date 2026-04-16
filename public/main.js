import { GameRenderer } from './renderer.js';

const socket = io();

// ==========================================
// 1. INITIALISATION DES SONS (AUDIO ENGINE)
// ==========================================
const sfx = {
    click: new Audio('assets/bouton_lobby.ogg'),
    victory: new Audio('assets/victoire.wav'),
    defeat: new Audio('assets/defaite.wav'),
    start: new Audio('assets/start_game.mp3'),
    tomatoHit: new Audio('assets/tomate_eclate.mp3'),
    knifeHit: new Audio('assets/couteau_tombe.ogg'),
    powerUp: new Audio('assets/powerup.ogg'),
    chefAttack: new Audio('assets/chef_enerve.wav'),
    jump: new Audio('assets/saut.ogg')
};

Object.values(sfx).forEach(s => s.volume = 0.4);
sfx.start.volume = 0.05;
sfx.defeat.volume = 0.1;
sfx.victory.volume = 0.1;

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0; 
        sound.play().catch(e => console.log("Audio bloqué :", e)); 
    }
}

function playShortSound(sound, start, duration) {
    if (sound) {
        sound.currentTime = start;
        sound.play().catch(e => console.log("Audio bloqué :", e));
        setTimeout(() => { if (!sound.paused) sound.pause(); }, duration);
    }
}

function stopAllSounds() {
    Object.values(sfx).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
}

// ==========================================
// 2. VARIABLES GLOBALES DU CLIENT
// ==========================================
let renderer = null; 
let currentPseudo = "";
let selectedColor = "gray"; 
let nbPlayers = 2;
let modeAmi = true;
let isPaused = false;
let isAdmin = false; 

let currentState = { players: {}, tomatoes: [], hearts: [], knives: [], baskets: [], rollers: [] };

let lastLives = 3;
let lastTomatoCount = 0;
let lastKnifeCount = 0;

const opt2 = document.getElementById('opt-2-players');
const opt4 = document.getElementById('opt-4-players');
const optAmi = document.getElementById('opt-mode-ami');
const optEnnemi = document.getElementById('opt-mode-ennemi');
const extraSlotsContainer = document.getElementById('extra-slots');

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// ==========================================
// 3. LOGIQUE DU VESTIAIRE (LOBBY)
// ==========================================
socket.on('takenColors', (taken) => {
    let isSelectedAvailable = false;
    document.querySelectorAll('.color-opt').forEach(opt => {
        const color = opt.getAttribute('data-color');
        if (taken.includes(color)) {
            opt.style.opacity = '0.2';
            opt.style.pointerEvents = 'none';
            opt.classList.remove('active');
        } else {
            opt.style.opacity = '1';
            opt.style.pointerEvents = 'auto';
            if (selectedColor === color) isSelectedAvailable = true;
        }
    });
    if (!isSelectedAvailable) {
        const firstAvailable = Array.from(document.querySelectorAll('.color-opt')).find(opt => opt.style.pointerEvents === 'auto');
        if (firstAvailable) {
            firstAvailable.classList.add('active');
            selectedColor = firstAvailable.getAttribute('data-color');
        }
    }
});

document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
        playSound(sfx.click); 
        document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedColor = opt.getAttribute('data-color');
    });
});

document.getElementById('btn-to-lobby').addEventListener('click', () => {
    playSound(sfx.click); 
    const input = document.getElementById('pseudo');
    currentPseudo = input.value.trim();
    if (currentPseudo !== "") {
        socket.emit('login', { pseudo: currentPseudo, color: selectedColor });
    } else {
        alert("Hé ! Entre un nom !");
    }
});

socket.on('loginSuccess', () => showScreen('screen-lobby'));
socket.on('loginFailed', (message) => alert(message));

// ==========================================
// 4. LA BOUCLE RÉSEAU (SYNCHRONISATION DU JEU)
// ==========================================
socket.on('worldState', (state) => {
    currentState = state; 

    const myPlayer = state.players[socket.id];
    if (myPlayer) {
        
        let currentLives = modeAmi ? state.sharedLives : myPlayer.lives;

        if (currentLives < lastLives) {
            if (state.knives.length < lastKnifeCount) playShortSound(sfx.knifeHit, 0, 1000);
            else playSound(sfx.tomatoHit);
        } else if (currentLives > lastLives) {
            playSound(sfx.powerUp); 
        }
        lastLives = currentLives;

        const livesEl = document.getElementById('lives-display');
        if (livesEl) {
            if (modeAmi) {
                let heartsHtml = "<span style='color:#2ecc71; margin-right:10px;'>COOP</span>";
                for (let i = 0; i < state.sharedLives; i++) {
                    heartsHtml += `<img src="assets/coeur.png" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 5px; margin-bottom: 4px;">`;
                }
                livesEl.innerHTML = heartsHtml;
            } else if (myPlayer.isDead) {
                livesEl.innerHTML = "👻 SPECTATEUR";
            } else {
                let heartsHtml = "";
                for (let i = 0; i < myPlayer.lives; i++) {
                    heartsHtml += `<img src="assets/coeur.png" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 5px; margin-bottom: 4px;">`;
                }
                livesEl.innerHTML = heartsHtml;
            }
        }

        const icon = document.getElementById('inventory-icon');
        const emptyText = document.getElementById('inventory-empty');
        const box = document.getElementById('inventory-box');

        if (myPlayer.inventory) {
            const powerupImages = {
                'éclair': 'assets/eclair.png',
                'piege': 'assets/mousetrap.png',
                'vin': 'assets/vine.png',
                'ressort': 'assets/ressorts.png'
            };

            const newSrc = powerupImages[myPlayer.inventory];

            if (icon && icon.src.indexOf(newSrc) === -1) {
                icon.src = newSrc;
                icon.style.display = 'block';
                if(emptyText) emptyText.style.display = 'none';
                playSound(sfx.powerUp); 

                if(box) {
                    box.classList.add('powerup-pop');
                    setTimeout(() => box.classList.remove('powerup-pop'), 300);
                }
            }
        } else {
            if(icon) {
                icon.style.display = 'none';
                icon.src = "";
            }
            if(emptyText) emptyText.style.display = 'block';
        }
    }

    if (state.tomatoes.length > lastTomatoCount || state.knives.length > lastKnifeCount) {
        playShortSound(sfx.chefAttack, 1.2, 1000);
    }

    lastTomatoCount = state.tomatoes.length;
    lastKnifeCount = state.knives.length;
});

// ==========================================
// 5. GESTION DES FINS DE PARTIES
// ==========================================
socket.on('gameWon', (heroName) => {
    isPaused = true;
    if(window.gameTimer) clearInterval(window.gameTimer);
    stopAllSounds();
    playSound(sfx.victory); 
    const resultTitle = document.getElementById('result-title');
    if (resultTitle) {
        if (modeAmi) {
            resultTitle.innerHTML = `<span class='text-glow-green'>VICTOIRE DE LA BRIGADE !</span><br><span class='text-shake-red' style='font-size: 1.5rem; display: inline-block; margin-top: 20px;'>VOUS AVEZ PIQUÉ LE FROMAGE !</span>`;
        } else {
            resultTitle.innerHTML = `<span class='text-glow-green'>VICTOIRE DE ${heroName.toUpperCase()} !</span><br><span class='text-shake-red' style='font-size: 1.5rem; display: inline-block; margin-top: 20px;'>IL A PIQUÉ LE FROMAGE !</span>`;
        }
    }
    showScreen('screen-result');
});

socket.on('gameOver', () => {
    isPaused = true;
    if(window.gameTimer) clearInterval(window.gameTimer);
    stopAllSounds();
    playSound(sfx.defeat); 
    const resultTitle = document.getElementById('result-title');
    if (resultTitle) {
        resultTitle.innerHTML = "<span class='text-shake-red'>TOUT LE MONDE EST K.O. !</span><br><span style='font-size: 1.5rem; color: #888; display: inline-block; margin-top: 20px; text-shadow: none; animation: none;'>LE CHEF A GAGNÉ...</span>";
    }
    showScreen('screen-result');
});

// ==========================================
// 6. GESTION DU LOBBY (RÈGLES EN DIRECT)
// ==========================================
socket.on('configUpdated', (config) => {
    nbPlayers = config.nbPlayers; modeAmi = config.modeAmi;
    
    if(nbPlayers === 2) {
        opt2.classList.add('active'); opt4.classList.remove('active');
        if(extraSlotsContainer) extraSlotsContainer.style.display = 'none';
    } else {
        opt4.classList.add('active'); opt2.classList.remove('active');
        if(extraSlotsContainer) extraSlotsContainer.style.display = 'contents';
    }
    if(modeAmi) {
        optAmi.classList.add('active'); optEnnemi.classList.remove('active');
    } else {
        optEnnemi.classList.add('active'); optAmi.classList.remove('active');
    }
});

[opt2, opt4, optAmi, optEnnemi].forEach(btn => {
    if(!btn) return;
    btn.addEventListener('click', () => {
        if (isAdmin) { 
            playSound(sfx.click); 
            if (btn === opt2) socket.emit('updateConfig', { nbPlayers: 2, modeAmi });
            if (btn === opt4) socket.emit('updateConfig', { nbPlayers: 4, modeAmi });
            if (btn === optAmi) socket.emit('updateConfig', { nbPlayers, modeAmi: true });
            if (btn === optEnnemi) socket.emit('updateConfig', { nbPlayers, modeAmi: false });
        }
    });
});

document.getElementById('btn-start-service').addEventListener('click', () => {
    if (isAdmin) {
        playSound(sfx.click); 
        socket.emit('requestStart'); 
    }
});

// ==========================================
// 7. INITIALISATION DU JEU & DU RENDERER
// ==========================================
socket.on('gameStarted', (config) => {
    stopAllSounds(); 
    playSound(sfx.start);
    modeAmi = config.modeAmi;
    showScreen('screen-game'); 

    const modeText = document.getElementById('mode-text');
    const inventory = document.getElementById('inventory-box');

    if (inventory) {
        inventory.style.display = modeAmi ? "none" : "block";
        inventory.style.opacity = "1";
    }

    if (modeText) {
        if (modeAmi) {
            modeText.innerText = "COOPÉRATEUR : AIDEZ-VOUS !";
            modeText.style.color = "#2ecc71";
        } else {
            modeText.innerText = "RIVALITÉ : CHACUN POUR SOI !";
            modeText.style.color = "#e74c3c";
        }
    }

    initGameEngine();
});

function initGameEngine() {
    const canvas = document.getElementById('gameCanvas');
    resizeCanvas();
    
    if (modeAmi) {
        const livesEl = document.getElementById('lives-display');
        if (livesEl) livesEl.innerHTML = ""; 
    }

    if (!renderer) {
        renderer = new GameRenderer(canvas, selectedColor, socket, modeAmi ? 'coop' : 'ennemi');
        
        function gameLoop() {
            if (!isPaused) {
                renderer.draw(currentState);
            }
            requestAnimationFrame(gameLoop); 
        }
        gameLoop();
    }
    startTestTimer(); 
}

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = 900;
        canvas.height = window.innerHeight - 80; 
    }
}
window.addEventListener('resize', resizeCanvas);

// ==========================================
// 8. INPUTS CLAVIER (ENVOI AU SERVEUR)
// ==========================================
document.addEventListener('keydown', (e) => {
    if (isPaused || !document.getElementById('screen-game').classList.contains('active')) return;

    const key = (e.key || "").toLowerCase();
    
    if (key === 'd' || key === 'arrowright') socket.emit('playerInput', { action: 'move', vx: 200 });
    if (key === 'q' || key === 'a' || key === 'arrowleft') socket.emit('playerInput', { action: 'move', vx: -200 });

    if (key === 'w' || key === 's' || key === 'arrowdown') {
        socket.emit('playerInput', { action: 'move_v', vy: (key === 's' || key === 'arrowdown') ? 200 : -200 });
    }

    if ((key === 'z' || e.key === 'ArrowUp') && !e.repeat) {
        playSound(sfx.jump);
        socket.emit('playerInput', { action: 'jump' });
    }

    if (key === 'e') socket.emit('interact');

    // 🌟 FIX : Seulement la touche F pour le pouvoir !
    if (key === 'f') {
        socket.emit('playerInput', { action: 'powerup' }); 
    }
});

document.addEventListener('keyup', (e) => {
    const key = (e.key || "").toLowerCase();
    if (['d', 'q', 'a', 'arrowright', 'arrowleft'].includes(key)) {
        socket.emit('playerInput', { action: 'move', vx: 0 });
    }
    if (['w', 's', 'z', 'arrowup', 'arrowdown'].includes(key)) {
        socket.emit('playerInput', { action: 'move_v', vy: 0 });
    }
});

// ==========================================
// 9. LOGIQUE D'AFFICHAGE DU VESTIAIRE
// ==========================================
socket.on('currentPlayers', (players) => updatePlayersSlots(players));

function updatePlayersSlots(playersObj) {
    const playersList = Object.values(playersObj);

    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) {
            slot.innerText = "EN ATTENTE...";
            slot.classList.remove('active');
            slot.style.color = "white";
        }
    }

    playersList.forEach((player, index) => {
        const slotNum = index + 1;
        const slotEl = document.getElementById(`slot-${slotNum}`);
        if (slotEl) {
            slotEl.innerText = player.pseudo.toUpperCase() + (player.id === socket.id ? " (MOI)" : "");
            slotEl.classList.add('active');
            slotEl.style.color = ""; 
        }
    });

    isAdmin = (playersList[0] && playersList[0].id === socket.id);

    const startBtn = document.getElementById('btn-start-service');
    const waitMsg = document.getElementById('wait-message');
    if (startBtn) startBtn.style.display = isAdmin ? 'block' : 'none';
    if (waitMsg) waitMsg.style.display = isAdmin ? 'none' : 'block';

    enableLobbyInteractions(isAdmin);
}

function enableLobbyInteractions(enabled) {
    document.querySelectorAll('.choice-card, .admin-btn').forEach(el => {
        el.style.pointerEvents = enabled ? 'auto' : 'none';
        el.style.opacity = enabled ? '1' : '0.5';
    });
}

function startTestTimer() {
    let timeLeft = 180;
    const timerDisplay = document.getElementById('timer');
    if (window.gameTimer) clearInterval(window.gameTimer);

    if (modeAmi) {
        if(timerDisplay) timerDisplay.innerText = "--:--"; 
        return;
    }

    window.gameTimer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            if(timerDisplay) timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            
            if (timeLeft <= 0) {
                clearInterval(window.gameTimer);
                const resultTitle = document.getElementById('result-title');
                if (resultTitle) resultTitle.innerHTML = "<span class='text-shake-red'>LE TEMPS EST ÉCOULÉ !</span><br><span style='font-size: 1.5rem; color: #888; display: inline-block; margin-top: 20px; text-shadow: none; animation: none;'>PAS DE FROMAGE CE SOIR...</span>";
                showScreen('screen-result');
            }
        }
    }, 1000);
}