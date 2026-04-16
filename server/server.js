const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
// Importation de notre moteur physique codé en Rust et compilé en WebAssembly
const { World } = require('./pkg/physics.js');

// Bouclier anti-crash global
// Certains navigateurs tentent de découper les fichiers audio, ce qui peut faire planter Express.
// Ce bloc intercepte l'erreur pour garder le serveur en ligne quoi qu'il arrive.
process.on('uncaughtException', (err) => {
    if (err.name === 'RangeNotSatisfiableError' || err.message.includes('Range Not Satisfiable')) {
        console.warn("Avertissement : Un navigateur a mal chargé un son. Crash évité.");
    } else {
        console.error("Erreur critique :", err);
    }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuration d'Express pour bloquer les requêtes partielles (évite les erreurs audio)
app.use(express.static(path.join(__dirname, '../public'), { acceptRanges: false }));

app.use((err, req, res, next) => {
    if (err.status === 416 || err.message.includes('Range')) { res.status(416).end(); } else { next(err); }
});

// --- DONNÉES DES NIVEAUX ---
// Definition de la géométrie de la cuisine selon le mode de jeu.
// Chaque plateforme possède des coordonnées (x, y), une taille (w, h) et une inclinaison (slope).
const CONFIG_ENNEMI = {
    width: 900,
    platforms: [
        { x: 42, y: 800, w: 819, h: 18, slope: -50 },
        { x: 42, y: 620, w: 646, h: 18, slope: 45 },
        { x: 109, y: 520, w: 751, h: 18, slope: -50 },
        { x: 42, y: 353, w: 755, h: 18, slope: 50 },
        { x: 92, y: 275, w: 867, h: 18, slope: -65 },
        { x: 63, y: 125, w: 672, h: 18, slope: 30 },
        { x: 300, y: 70, w: 170, h: 18, slope: 0 }
    ],
    laddersX: [600, 150, 650, 100, 600, 420],
    ladderPairs: [[1,0], [2,1], [3,2], [4,3], [5,4], [6,5]]
};

const CONFIG_COOP = {
    width: 1000,
    platforms: [
        { x: 0, y: 800, w: 1000, h: 20, slope: 0 },
        { x: 50, y: 650, w: 300, h: 15, slope: 0 },
        { x: 550, y: 650, w: 300, h: 15, slope: 0 },
        { x: 200, y: 500, w: 400, h: 15, slope: 0 },
        { x: 650, y: 500, w: 250, h: 15, slope: 0 },
        { x: 50, y: 350, w: 250, h: 15, slope: 0 },
        { x: 350, y: 350, w: 450, h: 15, slope: 0 },
        { x: 150, y: 200, w: 350, h: 15, slope: 0 },
        { x: 550, y: 200, w: 300, h: 15, slope: 0 },
        { x: 300, y: 150, w: 400, h: 15, slope: 0 }
    ],
    ladders: [
        {x:100, t:1, b:0}, {x:710, t:2, b:0}, {x:250, t:3, b:1}, {x:560, t:3, b:2},
        {x:740, t:4, b:2}, {x:210, t:5, b:3}, {x:450, t:6, b:3}, {x:680, t:6, b:4},
        {x:180, t:7, b:5}, {x:650, t:8, b:6}, {x:350, t:9, b:7}, {x:600, t:9, b:8}
    ]
};

// --- ÉTAT GLOBAL DU JEU ---
// Ces variables gardent en mémoire la configuration de la partie et les entités présentes.
let gameConfig = { nbPlayers: 2, modeAmi: true, isStarted: false };
let players = {}, playerWasmIds = {};
let tomatoes = [], knives = [], hearts = [], levers = [], baskets = [];
let rollers = []; 
let world, cheeseActive = false, nextItemId = 1;

// Pool de vies partagées spécifiquement pour le mode coopératif
let sharedLives = 3;

const typesPowerups = ['éclair', 'piege', 'vin', 'ressort'];
const heartSpawns = [{x:200,y:760}, {x:500,y:620}, {x:300,y:475}, {x:650,y:360}, {x:250,y:225}];

// Initialisation du moteur physique Wasm avec les données du niveau sélectionné
function initLevel() {
    const cfg = gameConfig.modeAmi ? CONFIG_COOP : CONFIG_ENNEMI;
    world = new World(1980.0, 850.0, cfg.width);
    
    cfg.platforms.forEach(p => world.add_platform(p.x, p.y, p.w, p.h, p.slope));
    
    if (gameConfig.modeAmi) {
        cfg.ladders.forEach(l => world.add_ladder(l.x, 30, cfg.platforms[l.t].y, cfg.platforms[l.b].y));
    } else {
        cfg.ladderPairs.forEach((pair, i) => {
            const x = cfg.laddersX[i], pT = cfg.platforms[pair[0]], pB = cfg.platforms[pair[1]];
            const yT = pT.y + (pT.slope * ((x - pT.x) / pT.w));
            const yB = pB.y + (pB.slope * ((x - pB.x) / pB.w));
            world.add_ladder(x, 30, yT, yB);
        });
    }
    resetItems();
}

// Nettoyage de la carte avant un nouveau service
function resetItems() {
    tomatoes = []; knives = []; hearts = []; levers = []; baskets = []; rollers = [];
    cheeseActive = !gameConfig.modeAmi; 
}

// Placement aléatoire des leviers pour le mode coopératif
function spawnLevers() {
    if (!gameConfig.modeAmi) return;
    levers = [];
    [1,2,3,4,5,6,7,8].sort(()=>.5-Math.random()).slice(0,3).forEach((idx, i) => {
        const p = CONFIG_COOP.platforms[idx];
        levers.push({ id: `L${i}`, x: p.x + 20 + Math.random()*(p.w-40), y: p.y, active: false });
    });
}

initLevel();

// --- GESTION DU RÉSEAU (SOCKET.IO) ---
io.on('connection', (socket) => {
    // Dès la connexion, on informe le client des couleurs déjà sélectionnées par les autres
    socket.emit('takenColors', Object.values(players).map(p => p.color));

    socket.on('login', (data) => {
        // Sécurité : on bloque si le lobby est plein ou si la couleur est déjà prise
        if (Object.keys(players).length >= gameConfig.nbPlayers) return;
        if (Object.values(players).some(p => p.color === data.color)) {
            socket.emit('loginFailed', "Ce rat a deja ete choisi par un autre commis !");
            return;
        }

        // Création du joueur dans le moteur Wasm et stockage de son identifiant
        const wasmId = world.add_player(100, 750, 30, 30);
        playerWasmIds[socket.id] = wasmId;
        
        // Initialisation des statistiques du joueur
        players[socket.id] = {
            id: socket.id, pseudo: data.pseudo, color: data.color, 
            isAdmin: Object.keys(players).length === 0, // Le premier joueur est l'admin
            wasmId, vx: 0, vy_input: 0, lives: 3, isDead: false, invulUntil: 0, isOverLadder: false,
            direction: 1, inventory: null, boost: false, trappedUntil: 0, invertedUntil: 0
        };
        
        socket.emit('loginSuccess', players[socket.id]);
        io.emit('currentPlayers', players);
        io.emit('takenColors', Object.values(players).map(p => p.color));
    });

    socket.on('updateConfig', (newCfg) => {
        if (players[socket.id]?.isAdmin) {
            const modeChanged = newCfg.modeAmi !== gameConfig.modeAmi;
            gameConfig = { ...gameConfig, ...newCfg };
            if (modeChanged) initLevel();
            io.emit('configUpdated', gameConfig);
        }
    });

    socket.on('requestStart', () => {
        if (players[socket.id] && players[socket.id].isAdmin) {
            initLevel(); 
            sharedLives = 3; // Réinitialisation des vies partagées
            
            // On replace tous les joueurs au point de départ et on vide leurs inventaires/malus
            Object.keys(players).forEach(id => {
                const p = players[id];
                if (world.disconnect_player) world.disconnect_player(p.wasmId);
                const newWasmId = world.add_player(100, 750, 30, 30);
                p.wasmId = newWasmId; p.x = 100; p.y = 750; p.isDead = false; p.lives = 3;
                p.vx = 0; p.vy_input = 0; p.invulUntil = 0; p.direction = 1;
                p.inventory = null; p.boost = false; p.trappedUntil = 0; p.invertedUntil = 0;
            });
            gameConfig.isStarted = true;
            
            if (gameConfig.modeAmi) {
                spawnLevers();
            } else {
                // En mode ennemi, le chef lance un tonneau dès le début
                rollers.push({ id: nextItemId++, x: 180, y: 80, w: 45, h: 45, vx: 4, vy: 0, angle: 0 });
            }
            
            io.emit('gameStarted', { modeAmi: gameConfig.modeAmi });
        }
    });

    // Gestion des commandes des joueurs
    socket.on('playerInput', (data) => {
        const p = players[socket.id];
        // On ignore les commandes si le joueur est mort ou bloqué dans un piège
        if (!p || p.isDead || Date.now() < p.trappedUntil) return;

        if (data.action === 'move') { 
            let vx = data.vx;
            // Gestion du malus "vin" : on inverse la direction du vecteur
            if (Date.now() < p.invertedUntil) vx *= -1; 
            world.set_player_vx(p.wasmId, vx); 
            p.vx = vx; 
            if (vx > 0) p.direction = 1; else if (vx < 0) p.direction = -1;
        }
        if (data.action === 'move_v') { 
            p.vy_input = data.vy; 
            if (world.set_player_dropping) world.set_player_dropping(p.wasmId, data.vy > 0); 
        }
        if (data.action === 'jump') {
            // Le pouvoir ressort augmente considérablement la force du saut
            let force = p.boost ? 800 : 550; 
            p.boost = false; 
            world.player_jump(p.wasmId, force);
        }
        if (data.action === 'powerup' && p.inventory) {
            let item = p.inventory; 
            p.inventory = null;
            
            if (item === 'ressort') p.boost = true;
            else {
                // Application des pouvoirs offensifs sur tous les autres joueurs vivants
                Object.values(players).forEach(other => {
                    if (other.id !== socket.id && !other.isDead) {
                        if (item === 'éclair') { 
                            // L'éclair force la cible à passer à travers le sol via une instruction au moteur Wasm
                            if (world.set_player_y) {
                                let currentY = world.get_player_y(other.wasmId);
                                world.set_player_y(other.wasmId, currentY + 25);
                            }
                            other.trappedUntil = Date.now() + 500; // Etourdissement léger pendant la chute
                        }
                        if (item === 'piege') { 
                            other.trappedUntil = Date.now() + 3000; 
                            world.set_player_vx(other.wasmId, 0); 
                        }
                        if (item === 'vin') other.invertedUntil = Date.now() + 4000;
                    }
                });
            }
        }
    });

    socket.on('interact', () => {
        if (!gameConfig.modeAmi) return;
        const p = players[socket.id];
        const px = world.get_player_x(p.wasmId), py = world.get_player_y(p.wasmId);
        let changed = false;
        
        // Vérification de la proximité du joueur avec un levier
        levers.forEach(l => { 
            if (Math.abs(px - l.x) < 80 && Math.abs(py - l.y) < 80) { 
                l.active = true; 
                changed = true; 
            }
        });
        
        // Si tous les leviers sont activés, la cloche du fromage se lève
        if (changed) { cheeseActive = levers.every(l => l.active); } 
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            const wasAdmin = players[socket.id].isAdmin;
            if (world.disconnect_player) world.disconnect_player(players[socket.id].wasmId);
            delete players[socket.id];
            
            // Si le serveur se vide, on annule la partie
            if (Object.keys(players).length === 0) { gameConfig.isStarted = false; resetItems(); }
            // Sinon, si le chef est parti, on promeut le joueur suivant
            else if (wasAdmin) players[Object.keys(players)[0]].isAdmin = true;
            
            io.emit('playerDisconnected', socket.id);
            io.emit('currentPlayers', players);
            io.emit('takenColors', Object.values(players).map(p => p.color));
        }
    });
});

// --- BOUCLE DE GÉNÉRATION DES OBSTACLES (Toutes les 2 secondes) ---
setInterval(() => {
    if (!gameConfig.isStarted) return;

    if (gameConfig.modeAmi) {
        // En coop, il n'y a pas de tonneaux. On compense en générant des rafales massives de tomates et de couteaux.
        if (tomatoes.length < 25) { 
            tomatoes.push({ id: nextItemId++, x: Math.random()*800+20, y: -20, speed: Math.random()*3+2 });
            if (Math.random() > 0.4) tomatoes.push({ id: nextItemId++, x: Math.random()*800+20, y: -20, speed: Math.random()*3+2 });
            if (Math.random() > 0.6) tomatoes.push({ id: nextItemId++, x: Math.random()*800+20, y: -20, speed: Math.random()*3+2 });
        }
        if (knives.length < 10 && Math.random() > 0.2) { 
            knives.push({ id: nextItemId++, x: Math.random()*800+50, y: -50, speed: 7 });
            if (Math.random() > 0.5) knives.push({ id: nextItemId++, x: Math.random()*800+50, y: -50, speed: 7 });
        }
    } else {
        // Mode Compétition : un mix équilibré de projectiles, de tonneaux et de boîtes mystères.
        if (tomatoes.length < 10) {
            tomatoes.push({ id: nextItemId++, x: Math.random()*800+20, y: -20, speed: Math.random()*3+2 });
        }
        if (knives.length < 5 && Math.random() > 0.40) {
            knives.push({ id: nextItemId++, x: Math.random()*800+50, y: -50, speed: 7 });
        }
        if (baskets.length < 4 && Math.random() > 0.40) {
            const plat = CONFIG_ENNEMI.platforms[Math.floor(Math.random() * (CONFIG_ENNEMI.platforms.length - 1))];
            const bx = plat.x + Math.random() * (plat.w - 40);
            const by = plat.y + (plat.slope * ((bx - plat.x) / plat.w)) - 40; 
            baskets.push({ id: nextItemId++, x: bx, y: by });
        }
        // Les tonneaux démarrent du haut et peuvent rouler vers la gauche ou vers la droite
        if (rollers.length < 5 && Math.random() > 0.10) {
            let spawnRight = Math.random() > 0.5;
            let spawnX = spawnRight ? 720 : 180;
            let startVx = spawnRight ? -4 : 4;
            rollers.push({ id: nextItemId++, x: spawnX, y: 80, w: 45, h: 45, vx: startVx, vy: 0, angle: 0 });
        }
    }

    // Apparition aléatoire de cœurs de soin
    if (hearts.length < 1 && Math.random() > 0.8) {
        const s = heartSpawns[Math.floor(Math.random()*heartSpawns.length)];
        hearts.push({ id: nextItemId++, x: s.x, y: s.y });
    }

}, 2000);


// --- BOUCLE PHYSIQUE PRINCIPALE DU JEU (60 FPS) ---
setInterval(() => {
    if (!gameConfig.isStarted) return;
    const cfg = gameConfig.modeAmi ? CONFIG_COOP : CONFIG_ENNEMI;

    // 1. Calcul de la physique serveur pour les tonneaux (Rollers)
    for (let i = rollers.length - 1; i >= 0; i--) {
        let r = rollers[i];
        r.x += r.vx; r.y += r.vy; 
        r.angle -= 0.06; // Fait tourner le sprite
        
        // Rebondissement brutal contre les bords de l'écran pour les forcer à faire des zigzags
        if (r.y + r.h < 790) {
            if (r.x <= 40) { r.x = 40; r.vx = 4; }
            if (r.x + r.w >= cfg.width - 40) { r.x = cfg.width - 40 - r.w; r.vx = -4; }
        }
        
        let onSlope = false;
        // Calcul mathématique pour faire rouler le tonneau en suivant l'angle exact des plateformes
        for (let plat of cfg.platforms) {
            if (plat.w === 0) continue;
            let ratio = (r.x - plat.x) / plat.w;
            let hauteurPente = plat.y + (plat.slope * ratio);
            
            if (r.x + r.w/2 > plat.x && r.x + r.w/2 < plat.x + plat.w &&
                r.y + r.h >= hauteurPente - 10 && r.y + r.h - r.vy <= hauteurPente + 20) {
                onSlope = true;
                r.y = hauteurPente - r.h; r.vy = 0;
                
                // Accélération naturelle vers le bas de la pente
                let accelX = (plat.slope / plat.w) * 45; 
                r.vx = accelX;
                
                // On impose une vitesse minimale pour eviter que le tonneau ne se fige sur une zone plate
                if (r.vx > -2 && r.vx <= 0) r.vx = -4;
                if (r.vx < 2 && r.vx >= 0) r.vx = 4;
                break;
            }
        }
        
        // Si le tonneau n'est pas sur une pente, on lui applique la gravité
        if (!onSlope) {
            r.vy += 0.5;
            if (r.y + r.h >= 800) { r.y = 800 - r.h; r.vy = 0; if (r.vx > -1) r.vx = -4; }
        }
        
        // Nettoyage si le tonneau sort de la carte
        if (r.x < -100 || r.x > cfg.width + 100 || r.y > 950) rollers.splice(i, 1);
    }

    // 2. Préparation des variables pour la gestion des échelles par le moteur Wasm
    for (let id in players) {
        let p = players[id]; 
        let px = world.get_player_x(p.wasmId), py = world.get_player_y(p.wasmId);
        p.isOverLadder = false;
        const ladders = gameConfig.modeAmi ? cfg.ladders : cfg.laddersX.map((x, i) => ({x, t:cfg.ladderPairs[i][0], b:cfg.ladderPairs[i][1]}));
        
        for(let l of ladders) {
            let pT = cfg.platforms[l.t], pB = cfg.platforms[l.b];
            let yT = pT.y + (pT.slope * ((l.x - pT.x) / pT.w)), yB = pB.y + (pB.slope * ((l.x - pB.x) / pB.w));
            if (Math.abs(px - l.x) <= 15 && py >= Math.min(yT,yB) - 30 && py <= Math.max(yT,yB) + 10) { 
                p.isOverLadder = true; break; 
            }
        }
        if (p.isOverLadder) world.set_player_vy(p.wasmId, p.vy_input);
    }

    // 3. Appel au moteur physique Rust/WebAssembly pour traiter les collisions des joueurs
    world.step(1/60);

    // 4. Gestion des collisions (Hitboxes) entre les joueurs et les objets
    for (let id in players) {
        let p = players[id]; if (p.isDead) continue;
        let px = world.get_player_x(p.wasmId), py = world.get_player_y(p.wasmId);

        // Collisions avec les projectiles (tomates, couteaux)
        [tomatoes, knives].forEach((list) => {
            for (let i = list.length-1; i>=0; i--) {
                let m = list[i];
                if (Math.abs(px - m.x) < 30 && Math.abs(py - m.y) < 30) {
                    if (Date.now() > p.invulUntil) {
                        if (gameConfig.modeAmi) {
                            sharedLives--; // Dommage partagé en coop
                            p.invulUntil = Date.now() + 1500; // Période de clignotement invulnérable (1.5 sec)
                            list.splice(i, 1);
                        } else {
                            p.lives--;
                            p.invulUntil = Date.now() + 1500; 
                            if (p.lives <= 0) { p.isDead = true; world.set_player_vx(p.wasmId, 0); }
                            list.splice(i, 1);
                        }
                    }
                }
            }
        });

        // Collisions avec les tonneaux roulants
        for (let i = rollers.length - 1; i >= 0; i--) {
            let r = rollers[i];
            if (Math.abs(px - (r.x + 22.5)) < 35 && Math.abs(py - (r.y + 22.5)) < 35) {
                if (Date.now() > p.invulUntil) {
                    if (gameConfig.modeAmi) {
                        sharedLives--;
                        p.invulUntil = Date.now() + 1500;
                    } else {
                        p.lives--;
                        p.invulUntil = Date.now() + 1500;
                        if (p.lives <= 0) { p.isDead = true; world.set_player_vx(p.wasmId, 0); }
                    }
                }
            }
        }

        // Ramassage des cœurs de vie
        hearts.forEach((h, i) => { 
            if (Math.abs(px-h.x)<30 && Math.abs(py-h.y)<30) { 
                if (gameConfig.modeAmi) {
                    if (sharedLives < 3) { sharedLives++; hearts.splice(i,1); }
                } else {
                    if (p.lives < 3) { p.lives++; hearts.splice(i,1); }
                }
            }
        });

        // Ouverture des paniers mystères pour obtenir un pouvoir aléatoire
        for (let i = baskets.length - 1; i >= 0; i--) {
            let b = baskets[i];
            if (Math.abs(px - b.x) < 35 && Math.abs(py - b.y) < 35) {
                if (!p.inventory) {
                    p.inventory = typesPowerups[Math.floor(Math.random() * typesPowerups.length)];
                    baskets.splice(i, 1);
                }
            }
        }

        // Vérification de la condition de victoire : Atteindre le fromage
        if (cheeseActive) {
            let isWinning = false;
            if (gameConfig.modeAmi) { if (px > 450 && px < 580 && py > 0 && py < 160) isWinning = true; } 
            else { if (px > 290 && px < 420 && py > -50 && py < 80) isWinning = true; }
            if (isWinning) { io.emit('gameWon', p.pseudo); gameConfig.isStarted = false; return; }
        }
    }

    // Descente progressive des projectiles
    [tomatoes, knives].forEach(list => list.forEach(m => m.y += m.speed));
    tomatoes = tomatoes.filter(m => m.y < 850);
    knives = knives.filter(m => m.y < 850);

    // 5. Assemblage du paquet de données "State" qui sera envoyé à tous les clients
    const state = { players: {}, tomatoes, knives, hearts, baskets, rollers, levers, cheeseActive, sharedLives };
    let aliveRats = 0;
    let totalRats = 0;

    for (let id in players) {
        totalRats++;
        let p = players[id], w = p.wasmId;
        
        if (!p.isDead) aliveRats++; 

        let onGround = world.get_player_on_ground(w);
        // Déduction de l'animation à jouer selon l'état et l'input du joueur
        let isMovingAnimation = onGround && Math.abs(p.vx) > 0;
        let isClimbingAnimation = p.isOverLadder && (!onGround || Math.abs(p.vy_input) > 0);

        state.players[id] = {
            id, x: world.get_player_x(w), y: world.get_player_y(w),
            pseudo: p.pseudo, color: p.color, lives: p.lives, isDead: p.isDead,
            isInvulnerable: Date.now() < p.invulUntil, 
            on_ground: onGround,
            isMoving: isMovingAnimation, direction: p.direction, isClimbing: isClimbingAnimation,
            inventory: p.inventory, hasBoost: p.boost, isTrapped: Date.now() < p.trappedUntil, isInverted: Date.now() < p.invertedUntil
        };
    }

    // 6. Vérification du Game Over global
    if (gameConfig.isStarted) {
        if (gameConfig.modeAmi) {
            if (sharedLives <= 0) {
                io.emit('gameOver');
                gameConfig.isStarted = false;
            }
        } else {
            // En compétition, la partie s'arrête uniquement si TOUS les rats sont morts
            if (totalRats > 0 && aliveRats === 0) {
                io.emit('gameOver');
                gameConfig.isStarted = false;
            }
        }
    }

    // Diffusion de l'état du monde à tous les joueurs connectés
    io.emit('worldState', state);
}, 1000/60); // 1000 millisecondes / 60 = environ 16.6 ms par boucle

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Serveur Operationnel sur le port ${PORT}`));