// ==========================================
// 1. GESTIONNAIRE DE CLAVIER (ZQSD + Flèches)
// ==========================================
class Clavier {
    constructor() {
        this.touches = {
            gauche: false,
            droite: false,
            saut: false,
            bas: false
        };

        window.addEventListener('keydown', (e) => this.actualiserTouche(e.key, true));
        window.addEventListener('keyup', (e) => this.actualiserTouche(e.key, false));
    }

    actualiserTouche(cle, etat) {
        const touche = cle.toLowerCase();
        if (touche === 'q' || touche === 'arrowleft') this.touches.gauche = etat;
        if (touche === 'd' || touche === 'arrowright') this.touches.droite = etat;
        if (touche === 'z' || touche === 'arrowup') this.touches.saut = etat;
        if (touche === 's' || touche === 'arrowdown') this.touches.bas = etat;
    }
}

// ==========================================
// 2. SIMULATION PHYSIQUE (Provisoire, avant Wasm)
// ==========================================
class EntitePhysique {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0; 
        this.vy = 0; 
    }

    appliquerPhysique() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Fausse gravité
        if (this.y < 500) {
            this.vy += 0.5; // Gravité temporaire
        }
    }
}

// ==========================================
// 3. LOGIQUE DU PERSONNAGE (Ton travail !)
// ==========================================
class Rat extends EntitePhysique {
    constructor(x, y, idJoueur, couleur) {
        super(x, y);
        this.idJoueur = idJoueur;
        this.couleur = couleur;
        
        this.vitesseMarche = 3; 
        this.forceSaut = -8; 

        // Les deux types de boost :
        this.boostActif = false; // Pour la zone verte (usage unique)
        this.surRat = false;     // NOUVEAU : Pour le bloc (actif seulement dessus)
        
        this.peutSauter = false; 
    }

    declencherSaut() {
        // On vérifie si l'un des deux boosts est actif
        if (this.boostActif || this.surRat) {
            this.vy = this.forceSaut * 1.4; 
            
            // On consomme le boost de la zone verte
            this.boostActif = false; 
            // (Pas besoin de toucher à surRat, la gravité s'en chargera quand on quittera le bloc)
        } else {
            this.vy = this.forceSaut;
        }
    }

    calculerVelocite(touches) {
        if (touches.gauche) {
            this.vx = -this.vitesseMarche;
        } else if (touches.droite) {
            this.vx = this.vitesseMarche;
        } else {
            this.vx = 0; 
        }

        if (touches.saut && this.peutSauter) {
            this.declencherSaut();
            touches.saut = false; 
            this.peutSauter = false; 
        }
    }
}
// ==========================================
// 4. INITIALISATION & ZONES DE TESTS
// ==========================================

const clavier = new Clavier();
const monRat = new Rat(100, 500, "joueur1", "gris"); 

// --- Élément A : La Zone Magique (Vert) ---
const zoneTestBoost = {
    x: 200,
    y: 460,
    width: 40,
    height: 40,
    couleur: "rgba(0, 255, 0, 0.5)"
};

// --- Élément B : Le Faux Rat Solide (Gris/Bleu) ---
const fauxRat = {
    x: 350,
    y: 450, // C'est le HAUT du bloc (sa base touchera le sol à 500)
    width: 50,
    height: 50
};

// Chargement de ton Sprite
const spriteRat = new Image();
spriteRat.src = '../assets/sprites/rats/rat_cours.png'; 

const canvas = document.getElementById("ecranDeJeu");
const ctx = canvas.getContext("2d");

// ==========================================
// 5. BOUCLE DE JEU (MOTEUR D'ACTION)
// ==========================================
function boucleDeJeu() {
    // 1. LOGIQUE DE TES TOUCHES
    monRat.calculerVelocite(clavier.touches);

    // 2. PHYSIQUE & GRAVITÉ
    monRat.appliquerPhysique();

   // --- 3. SIMULATION DE COLLISIONS (Tâche Provisoire) ---
    monRat.peutSauter = false; 
    monRat.surRat = false; // NOUVEAU : On réinitialise l'état à chaque image

    // A. Collision avec le Sol (Y = 500)
    if (monRat.y >= 500) { 
        monRat.y = 500;
        monRat.vy = 0;
        monRat.peutSauter = true; 
    }

    // B. Collision avec le Faux Rat Solide (Dessus)
    let aligneHorizontalement = (monRat.x < fauxRat.x + fauxRat.width && monRat.x + 50 > fauxRat.x);
    if (monRat.vy >= 0 && monRat.y >= fauxRat.y && monRat.y <= fauxRat.y + 20 && aligneHorizontalement) {
        monRat.y = fauxRat.y; 
        monRat.vy = 0;        
        monRat.peutSauter = true; 
        monRat.surRat = true; // 🔥 On active l'état "sur le rat"
    }

    // C. Collision avec la Zone Magique (Usage unique)
    const boiteRat = { x: monRat.x, y: monRat.y - 50, w: 50, h: 50 };
    if (boiteRat.x < zoneTestBoost.x + zoneTestBoost.width &&
        boiteRat.x + boiteRat.w > zoneTestBoost.x &&
        boiteRat.y < zoneTestBoost.y + zoneTestBoost.height &&
        boiteRat.y + boiteRat.h > zoneTestBoost.y) {
        
        monRat.boostActif = true; // 🔥 Donne le boost persistant
    }


    // --- 4. RENDU VISUEL ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le sol (Marron)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 500, canvas.width, 100);

    // Dessiner la Zone Magique
    ctx.fillStyle = zoneTestBoost.couleur;
    ctx.fillRect(zoneTestBoost.x, zoneTestBoost.y, zoneTestBoost.width, zoneTestBoost.height);

    
    // Dessiner le "Faux Rat" (Bloc Solide)
    ctx.fillStyle = "#557799";
    // On enlève le - 50 ici, on le dessine direct à fauxRat.y (450)
    ctx.fillRect(fauxRat.x, fauxRat.y, fauxRat.width, fauxRat.height); 
    
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("Autre Rat", fauxRat.x - 5, fauxRat.y - 10);

    // Dessiner TON rat (Sprite)
    ctx.drawImage(spriteRat, monRat.x, monRat.y - 50, 50, 50);

   // --- Feedback visuel ---
    // On brille si la zone magique OU le bloc rat nous donne le boost
    if (monRat.boostActif || monRat.surRat) {
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.strokeRect(monRat.x, monRat.y - 50, 50, 50);
        ctx.fillStyle = "lime";
        ctx.font = "bold 16px Arial";
        ctx.fillText("SAUT BOOSTÉ PRÊT !", monRat.x - 30, monRat.y - 60);
    }

    requestAnimationFrame(boucleDeJeu);
}

// C'est parti !
boucleDeJeu();