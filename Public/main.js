// ==========================================
// 1. ÉTAT DU JEU (POST-ITS)
// ==========================================
let currentPseudo = "";
let selectedColor = "gray";
let nbPlayers = 2;
let modeAmi = true;
let isPaused = false;

// ==========================================
// 2. NAVIGATION (SPA)
// ==========================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// ==========================================
// 3. LOGIQUE CONNEXION (LOGIN)
// ==========================================

// Sélection couleur
document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedColor = opt.getAttribute('data-color');
    });
});

// Bouton Connexion -> Envoi à Raph
document.getElementById('btn-to-lobby').addEventListener('click', () => {
    const input = document.getElementById('pseudo');
    currentPseudo = input.value.trim();
    
    if (currentPseudo !== "") {
        // INFO POUR RAPH : On envoie les données de connexion
        console.log("LOGIN envoyé :", currentPseudo, selectedColor);
        /* socket.emit('login', { pseudo: currentPseudo, color: selectedColor }); */
        
        showScreen('screen-lobby');
    } else {
        alert("Hé commis ! Entre un nom !");
    }
});

// ==========================================
// 4. LOGIQUE LOBBY (RÉGLAGES)
// ==========================================

// Choix 2/4 Joueurs
const opt2 = document.getElementById('opt-2-players');
const opt4 = document.getElementById('opt-4-players');
const extraSlots = document.querySelectorAll('.extra-slot');

opt2.addEventListener('click', () => {
    nbPlayers = 2;
    opt2.classList.add('active');
    opt4.classList.remove('active');
    extraSlots.forEach(s => s.style.display = 'none');
});

opt4.addEventListener('click', () => {
    nbPlayers = 4;
    opt4.classList.add('active');
    opt2.classList.remove('active');
    extraSlots.forEach(s => s.style.display = 'block');
});

// Choix Ami/Ennemi
const optAmi = document.getElementById('opt-mode-ami');
const optEnnemi = document.getElementById('opt-mode-ennemi');

optAmi.addEventListener('click', () => {
    modeAmi = true;
    optAmi.classList.add('active');
    optEnnemi.classList.remove('active');
});

optEnnemi.addEventListener('click', () => {
    modeAmi = false;
    optEnnemi.classList.add('active');
    optAmi.classList.remove('active');
});

// FONCTION POUR RAPH : Remplir les slots quand les gens arrivent
function updatePlayersSlots(playersList) {
    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.innerText = "EN ATTENTE...";
        slot.classList.remove('active');
    }
    playersList.forEach((player, index) => {
        const slotNum = index + 1;
        const slotEl = document.getElementById(`slot-${slotNum}`);
        if (slotEl) {
            slotEl.innerText = player.pseudo.toUpperCase() + (player.pseudo === currentPseudo ? " (MOI)" : "");
            slotEl.classList.add('active');
        }
    });
}

// FONCTION POUR RAPH : Verrouiller si on n'est pas le chef
function setGuestMode() {
    document.getElementById('btn-start-service').style.display = 'none';
    document.getElementById('wait-message').style.display = 'block';
    document.querySelectorAll('.choice-card').forEach(card => {
        card.style.pointerEvents = 'none';
        card.style.opacity = '0.5';
    });
}

// ==========================================
// 5. LOGIQUE JEU (GAMEPLAY & HUD)
// ==========================================

// Lancement (Appelé par le bouton Start ou par le signal de Raph)
document.getElementById('btn-start-service').addEventListener('click', () => {
    // INFO POUR RAPH : On prévient que le chef lance
    /* socket.emit('start_service', { nbPlayers, modeAmi }); */
    
    showScreen('screen-game');
    resizeCanvas();
    startTestTimer();
});

function startTestTimer() {
    let timeLeft = 180;
    const timerDisplay = document.getElementById('timer');
    const countdown = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                endGame(false);
            }
        }
    }, 1000);
}

function endGame(isVictory) {
    const resultScreen = document.getElementById('screen-result');
    const resultTitle = document.getElementById('result-title');
    const finalScoreDisplay = document.getElementById('final-score');
    const currentScore = document.getElementById('score').innerText;

    resultScreen.classList.remove('victory', 'game-over');
    if (isVictory) {
        resultScreen.classList.add('victory');
        resultTitle.innerText = "MISSION RÉUSSIE !";
    } else {
        resultScreen.classList.add('game-over');
        resultTitle.innerText = "BRIGADE VIRÉE !";
    }
    finalScoreDisplay.innerText = currentScore;
    showScreen('screen-result');
}

// ==========================================
// 6. SYSTÈME (RESIZE, PAUSE, CLAVIER)
// ==========================================

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function togglePause() {
    if (document.getElementById('screen-game').classList.contains('active')) {
        isPaused = !isPaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        pauseOverlay.style.display = isPaused ? 'flex' : 'none';
    }
}

window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', (e) => {
    // PAUSE
    if (e.key === "Escape") togglePause();
    
    // INTERACTION (Touche E demandée par Raph)
    if (e.key.toLowerCase() === "e") {
        console.log("Action : Touche E pressée");
        /* socket.emit('toggleLever'); */
    }
});

document.getElementById('btn-resume').addEventListener('click', togglePause);