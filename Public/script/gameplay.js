class Clavier {
    constructor() {
        this.touches = { z: false, q: false, s: false, d: false };

        window.addEventListener('keydown', (e) => this.actualiserTouche(e.key, true));
        window.addEventListener('keyup', (e) => this.actualiserTouche(e.key, false));
    }

    actualiserTouche(cle, etat) {
        const touche = cle.toLowerCase();
        if (this.touches.hasOwnProperty(touche)) {
            this.touches[touche] = etat;
        }
    }
}
class EntitePhysique {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0; // Vélocité sur l'axe X (gauche/droite)
        this.vy = 0; // Vélocité sur l'axe Y (haut/bas)
    }

    // Fahed gérera cette partie plus tard avec son Wasm
    appliquerPhysique() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Simulation d'un sol basique pour tes tests d'aujourd'hui
        if (this.y > 500) { 
            this.y = 500;
            this.vy = 0;
        } else if (this.y < 500) {
            this.vy += 0.5; // Fausse gravité
        }
    }
}
class Rat extends EntitePhysique {
    constructor(x, y, idJoueur, couleur) {
        super(x, y); // Appelle le constructeur de l'EntitePhysique
        
        this.idJoueur = idJoueur; // Utile plus tard pour La Raph (Serveur)
        this.couleur = couleur;   // Utile plus tard pour Selma (Rendu Canvas)
        
        // Tes variables de Gameplay
        this.vitesseMarche = 5; 
        this.forceSaut = -12; // Négatif car on monte vers le haut de l'écran (Y=0)
    }

    // C'est TA méthode principale pour aujourd'hui
    calculerVelocite(touches) {
        // --- AXE X : Déplacements Gauche (Q) / Droite (D) ---
        if (touches.q) {
            this.vx = -this.vitesseMarche;
        } else if (touches.d) {
            this.vx = this.vitesseMarche;
        } else {
            this.vx = 0; // S'arrête si on lâche la touche
        }

        // --- AXE Y : Saut (Z) ---
        // On vérifie qu'on est au sol (y == 500 dans notre simulation provisoire)
        if (touches.z && this.y === 500) {
            this.vy = this.forceSaut;
        }

        // --- AXE Y : Descendre / Échelles (S) ---
        if (touches.s) {
            // Plus tard, tu mettras la logique pour descendre les plateformes
            // ou t'accroupir pour esquiver les tomates !
        }
    }
}
const clavier = new Clavier();
// On crée un rat en position X=100, Y=500
const monRat = new Rat(100, 500, "joueur1", "gris"); 

function boucleDeJeu() {
    // 1. Toi (Gameplay) : Tu calcules les vitesses selon les touches
    monRat.calculerVelocite(clavier.touches);
    
    // 2. Fahed (Physique) : Applique les vitesses aux positions X/Y
    monRat.appliquerPhysique();

    // Affichage dans la console pour vérifier tes vitesses
    console.log(`Rat | Vx: ${monRat.vx}, Vy: ${monRat.vy} | Pos: X=${monRat.x}, Y=${monRat.y}`);

    requestAnimationFrame(boucleDeJeu);
}

boucleDeJeu();