/**
 * Seed AlloArtisan — données de démonstration réalistes (Bénin).
 *
 * Crée : 10 catégories, 20 métiers, 6 clients, 14 artisans (photos, bios,
 * tarifs, positions autour de Cotonou/Calavi/Porto-Novo), bookings terminés
 * et avis — les triggers PostgreSQL recalculent les notes automatiquement.
 *
 * Idempotent : les catégories/métiers/utilisateurs sont upsertés,
 * les avis ne sont créés qu'une fois.
 *
 * Lancer :  pnpm exec ts-node --transpile-only prisma/seed.ts
 * Comptes de test : tous les emails ci-dessous / mot de passe "Test@1234"
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, Role, Statut, StatutArtisan, AbonnementType, StatutBooking } from '../src/generated/prisma';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PASSWORD = 'Test@1234';

// ─── Taxonomie ────────────────────────────────────────────────────────────────

const CATEGORIES: { nom: string; slug: string; ordre: number; metiers: { nom: string; slug: string; populaire?: boolean }[] }[] = [
    {
        nom: 'Plomberie', slug: 'plomberie', ordre: 1,
        metiers: [
            { nom: 'Plombier', slug: 'plombier', populaire: true },
            { nom: 'Installateur sanitaire', slug: 'installateur-sanitaire' },
        ],
    },
    {
        nom: 'Électricité', slug: 'electricite', ordre: 2,
        metiers: [
            { nom: 'Électricien bâtiment', slug: 'electricien-batiment', populaire: true },
            { nom: 'Installateur solaire', slug: 'installateur-solaire', populaire: true },
        ],
    },
    {
        nom: 'Maçonnerie', slug: 'maconnerie', ordre: 3,
        metiers: [
            { nom: 'Maçon', slug: 'macon', populaire: true },
            { nom: 'Carreleur', slug: 'carreleur' },
        ],
    },
    {
        nom: 'Menuiserie', slug: 'menuiserie', ordre: 4,
        metiers: [
            { nom: 'Menuisier bois', slug: 'menuisier-bois' },
            { nom: 'Menuisier aluminium', slug: 'menuisier-aluminium' },
        ],
    },
    {
        nom: 'Peinture', slug: 'peinture', ordre: 5,
        metiers: [
            { nom: 'Peintre bâtiment', slug: 'peintre-batiment' },
            { nom: 'Décorateur intérieur', slug: 'decorateur-interieur' },
        ],
    },
    {
        nom: 'Climatisation & Froid', slug: 'climatisation', ordre: 6,
        metiers: [
            { nom: 'Installateur climatisation', slug: 'installateur-climatisation', populaire: true },
            { nom: 'Frigoriste', slug: 'frigoriste' },
        ],
    },
    {
        nom: 'Couture & Mode', slug: 'couture', ordre: 7,
        metiers: [
            { nom: 'Couturier / Tailleur', slug: 'couturier', populaire: true },
            { nom: 'Styliste modéliste', slug: 'styliste' },
        ],
    },
    {
        nom: 'Coiffure & Beauté', slug: 'coiffure', ordre: 8,
        metiers: [
            { nom: 'Coiffeur / Coiffeuse', slug: 'coiffeur', populaire: true },
            { nom: 'Esthéticienne', slug: 'estheticienne' },
        ],
    },
    {
        nom: 'Mécanique', slug: 'mecanique', ordre: 9,
        metiers: [
            { nom: 'Mécanicien auto', slug: 'mecanicien-auto', populaire: true },
            { nom: 'Mécanicien moto', slug: 'mecanicien-moto' },
        ],
    },
    {
        nom: 'Jardinage', slug: 'jardinage', ordre: 10,
        metiers: [
            { nom: 'Jardinier', slug: 'jardinier' },
            { nom: 'Paysagiste', slug: 'paysagiste' },
        ],
    },
];

// ─── Clients (auteurs des avis) ───────────────────────────────────────────────

const CLIENTS = [
    { email: 'aline.client@test.bj', prenom: 'Aline', nom: 'DOSSOU', ville: 'Cotonou', quartier: 'Fidjrossè', photo: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { email: 'richard.client@test.bj', prenom: 'Richard', nom: 'SOMASSE', ville: 'Cotonou', quartier: 'Akpakpa', photo: 'https://randomuser.me/api/portraits/men/75.jpg' },
    { email: 'grace.client@test.bj', prenom: 'Grâce', nom: 'AHOYO', ville: 'Abomey-Calavi', quartier: 'Godomey', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { email: 'marius.client@test.bj', prenom: 'Marius', nom: 'KPADONOU', ville: 'Cotonou', quartier: 'Cadjèhoun', photo: 'https://randomuser.me/api/portraits/men/52.jpg' },
    { email: 'esperance.client@test.bj', prenom: 'Espérance', nom: 'ZINSOU', ville: 'Porto-Novo', quartier: 'Ouando', photo: 'https://randomuser.me/api/portraits/women/33.jpg' },
    { email: 'gildas.client@test.bj', prenom: 'Gildas', nom: 'SOGLO', ville: 'Cotonou', quartier: 'Zogbo', photo: 'https://randomuser.me/api/portraits/men/41.jpg' },
];

// ─── Artisans ─────────────────────────────────────────────────────────────────

interface ArtisanSeed {
    email: string; prenom: string; nom: string; photo: string;
    entreprise: string; slogan: string; bio: string;
    metierSlug: string; metierSecondaire?: string;
    ville: string; quartier: string; lat: number; lng: number;
    tarifHoraire: number; tarifDeplacement: number; annees: number;
    abonnement: AbonnementType; urgences: boolean; weekend: boolean;
    missions: number;
    avis: { client: number; note: number; commentaire: string }[];
}

const ARTISANS: ArtisanSeed[] = [
    {
        email: 'jerome.plombier@test.bj', prenom: 'Jérôme', nom: 'HOUNGBEDJI',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        entreprise: 'Plomberie Express Cotonou', slogan: 'La fuite s\'arrête ici',
        bio: "Plombier professionnel depuis 12 ans à Cotonou. Spécialiste des fuites, installations sanitaires complètes et surpresseurs. Travail propre, devis clair avant intervention, garantie 3 mois sur toutes mes réparations.",
        metierSlug: 'plombier', metierSecondaire: 'installateur-sanitaire',
        ville: 'Cotonou', quartier: 'Fidjrossè', lat: 6.3521, lng: 2.3705,
        tarifHoraire: 3500, tarifDeplacement: 1000, annees: 12,
        abonnement: 'PREMIUM', urgences: true, weekend: true, missions: 247,
        avis: [
            { client: 0, note: 5, commentaire: "Arrivé en 40 minutes pour une fuite urgente un dimanche. Travail impeccable et prix honnête. Je recommande vivement !" },
            { client: 1, note: 5, commentaire: 'Très professionnel, il a tout expliqué avant de commencer. La salle de bain est comme neuve.' },
            { client: 3, note: 4, commentaire: 'Bon travail sur mon chauffe-eau. Un peu de retard mais il avait prévenu par message.' },
        ],
    },
    {
        email: 'felicien.electricien@test.bj', prenom: 'Félicien', nom: 'AGOSSOU',
        photo: 'https://randomuser.me/api/portraits/men/22.jpg',
        entreprise: 'Élec+ Bénin', slogan: 'Le courant passe, en toute sécurité',
        bio: "Électricien bâtiment certifié, 9 ans d'expérience. Installations complètes, mises aux normes, dépannages et tableaux électriques. J'interviens aussi sur les installations solaires domestiques.",
        metierSlug: 'electricien-batiment', metierSecondaire: 'installateur-solaire',
        ville: 'Cotonou', quartier: 'Akpakpa', lat: 6.3596, lng: 2.4485,
        tarifHoraire: 4000, tarifDeplacement: 1500, annees: 9,
        abonnement: 'PREMIUM', urgences: true, weekend: false, missions: 189,
        avis: [
            { client: 2, note: 5, commentaire: 'Il a refait toute l\'installation de ma boutique. Travail soigné, câbles bien rangés, tout aux normes.' },
            { client: 4, note: 5, commentaire: 'Dépannage rapide après une panne générale. Très pédagogue, il m\'a montré quoi surveiller.' },
            { client: 5, note: 4, commentaire: 'Bonne prestation pour l\'installation de mes ventilateurs plafonniers.' },
        ],
    },
    {
        email: 'clarisse.couturiere@test.bj', prenom: 'Clarisse', nom: 'GBAGUIDI',
        photo: 'https://randomuser.me/api/portraits/women/65.jpg',
        entreprise: 'Atelier Clarisse Couture', slogan: 'Vos tissus méritent le meilleur',
        bio: "Couturière et styliste depuis 15 ans. Spécialiste du wax, des tenues de cérémonie et de l'uniforme scolaire. Atelier à Godomey avec retouches express en 24h. Livraison possible sur Cotonou.",
        metierSlug: 'couturier', metierSecondaire: 'styliste',
        ville: 'Abomey-Calavi', quartier: 'Godomey', lat: 6.3833, lng: 2.3427,
        tarifHoraire: 2500, tarifDeplacement: 500, annees: 15,
        abonnement: 'STANDARD', urgences: false, weekend: true, missions: 312,
        avis: [
            { client: 0, note: 5, commentaire: 'Ma tenue de mariage était magnifique, finitions parfaites. Toute la famille veut son contact !' },
            { client: 2, note: 5, commentaire: 'Rapide et très douée. Elle a rattrapé une tenue ratée par un autre atelier.' },
            { client: 4, note: 5, commentaire: 'Uniformes des enfants livrés en avance, coutures solides. Merci !' },
        ],
    },
    {
        email: 'raoul.macon@test.bj', prenom: 'Raoul', nom: 'TOSSOU',
        photo: 'https://randomuser.me/api/portraits/men/85.jpg',
        entreprise: 'BTP Tossou & Fils', slogan: 'On construit du solide',
        bio: "Maçon chef de chantier, 18 ans de métier. Fondations, élévations, dalles, crépissage et carrelage. Équipe de 5 ouvriers disponible pour les gros chantiers. Devis gratuit sur place.",
        metierSlug: 'macon', metierSecondaire: 'carreleur',
        ville: 'Abomey-Calavi', quartier: 'Calavi centre', lat: 6.4485, lng: 2.3557,
        tarifHoraire: 3000, tarifDeplacement: 2000, annees: 18,
        abonnement: 'STANDARD', urgences: false, weekend: true, missions: 96,
        avis: [
            { client: 1, note: 5, commentaire: 'Il a coulé la dalle de ma maison à Calavi. Chantier propre, délais respectés.' },
            { client: 3, note: 4, commentaire: 'Bon carrelage dans le salon. Je referai appel à lui pour l\'étage.' },
        ],
    },
    {
        email: 'nadege.coiffeuse@test.bj', prenom: 'Nadège', nom: 'AKPOVI',
        photo: 'https://randomuser.me/api/portraits/women/26.jpg',
        entreprise: 'Nadège Beauty', slogan: 'Votre beauté, à domicile',
        bio: "Coiffeuse et esthéticienne à domicile sur Cotonou. Tresses, tissages, soins du visage et maquillage de cérémonie. Je me déplace avec tout mon matériel, 7j/7 sur rendez-vous.",
        metierSlug: 'coiffeur', metierSecondaire: 'estheticienne',
        ville: 'Cotonou', quartier: 'Cadjèhoun', lat: 6.3654, lng: 2.3912,
        tarifHoraire: 2000, tarifDeplacement: 500, annees: 7,
        abonnement: 'PREMIUM', urgences: true, weekend: true, missions: 428,
        avis: [
            { client: 0, note: 5, commentaire: 'Tresses magnifiques faites à la maison, ma fille est ravie. Très ponctuelle.' },
            { client: 2, note: 5, commentaire: 'Maquillage de mariage parfait, elle est restée pour les retouches. Top !' },
            { client: 4, note: 4, commentaire: 'Très bon tissage, bonne ambiance. Juste un peu long.' },
            { client: 5, note: 5, commentaire: 'Service impeccable pour toute la famille avant la fête.' },
        ],
    },
    {
        email: 'parfait.climaticien@test.bj', prenom: 'Parfait', nom: 'HOUNSOU',
        photo: 'https://randomuser.me/api/portraits/men/64.jpg',
        entreprise: 'FroidPro Bénin', slogan: 'La fraîcheur garantie',
        bio: "Technicien frigoriste, spécialiste climatisation split et centrale. Installation, entretien, recharge de gaz et dépannage express. Contrats d'entretien pour bureaux et commerces.",
        metierSlug: 'installateur-climatisation', metierSecondaire: 'frigoriste',
        ville: 'Cotonou', quartier: 'Ganhi', lat: 6.3550, lng: 2.4280,
        tarifHoraire: 5000, tarifDeplacement: 1500, annees: 11,
        abonnement: 'PREMIUM', urgences: true, weekend: false, missions: 203,
        avis: [
            { client: 1, note: 5, commentaire: 'Clim installée en une matinée, il a même rebouché proprement les trous. Pro.' },
            { client: 5, note: 5, commentaire: 'Dépannage express de la chambre froide de mon restaurant. Il m\'a sauvé !' },
            { client: 3, note: 4, commentaire: 'Entretien bien fait, la clim souffle comme au premier jour.' },
        ],
    },
    {
        email: 'sylvain.menuisier@test.bj', prenom: 'Sylvain', nom: 'ADJAHO',
        photo: 'https://randomuser.me/api/portraits/men/36.jpg',
        entreprise: 'Atelier Bois d\'Or', slogan: 'Le bois, notre passion',
        bio: "Menuisier ébéniste, meubles sur mesure : lits, armoires, portes, cuisines. Bois massif local (iroko, teck) travaillé dans mon atelier de Porto-Novo. Photos de réalisations disponibles.",
        metierSlug: 'menuisier-bois',
        ville: 'Porto-Novo', quartier: 'Ouando', lat: 6.4779, lng: 2.6323,
        tarifHoraire: 3000, tarifDeplacement: 2500, annees: 14,
        abonnement: 'GRATUIT', urgences: false, weekend: true, missions: 74,
        avis: [
            { client: 4, note: 5, commentaire: 'Lit en iroko massif superbe, livré et monté. Du travail d\'artiste.' },
            { client: 0, note: 4, commentaire: 'Belle armoire sur mesure. Petit retard de livraison mais qualité au rendez-vous.' },
        ],
    },
    {
        email: 'romaric.peintre@test.bj', prenom: 'Romaric', nom: 'AHOYO',
        photo: 'https://randomuser.me/api/portraits/men/18.jpg',
        entreprise: 'Couleurs & Déco', slogan: 'Des murs qui parlent',
        bio: "Peintre en bâtiment et décorateur. Peinture intérieure/extérieure, enduits décoratifs, faux plafonds. Conseils couleurs gratuits. Bâches de protection systématiques, chantier rendu propre.",
        metierSlug: 'peintre-batiment', metierSecondaire: 'decorateur-interieur',
        ville: 'Cotonou', quartier: 'Sainte-Rita', lat: 6.3830, lng: 2.4030,
        tarifHoraire: 2500, tarifDeplacement: 1000, annees: 8,
        abonnement: 'STANDARD', urgences: false, weekend: true, missions: 131,
        avis: [
            { client: 2, note: 5, commentaire: 'Salon repeint en deux jours, résultat magnifique et zéro tache. Bravo.' },
            { client: 5, note: 4, commentaire: 'Bon rapport qualité-prix pour la façade de ma boutique.' },
        ],
    },
    {
        email: 'brice.mecano@test.bj', prenom: 'Brice', nom: 'DAGBA',
        photo: 'https://randomuser.me/api/portraits/men/91.jpg',
        entreprise: 'Garage Dagba Auto', slogan: 'Votre voiture entre de bonnes mains',
        bio: "Mécanicien automobile, diagnostic électronique, entretien, freinage et embrayage. J'interviens aussi à domicile pour les pannes simples et les batteries. Pièces d'origine sur demande.",
        metierSlug: 'mecanicien-auto', metierSecondaire: 'mecanicien-moto',
        ville: 'Cotonou', quartier: 'Vossa', lat: 6.3778, lng: 2.4155,
        tarifHoraire: 4500, tarifDeplacement: 2000, annees: 13,
        abonnement: 'STANDARD', urgences: true, weekend: false, missions: 167,
        avis: [
            { client: 3, note: 5, commentaire: 'Panne au bord de la route, il est venu et a réparé sur place. Sauveur !' },
            { client: 1, note: 4, commentaire: 'Vidange et freins refaits rapidement, prix corrects.' },
        ],
    },
    {
        email: 'chantal.estheticienne@test.bj', prenom: 'Chantal', nom: 'HOUNKPATIN',
        photo: 'https://randomuser.me/api/portraits/women/57.jpg',
        entreprise: 'Institut Chantal', slogan: 'Prenez soin de vous',
        bio: "Esthéticienne diplômée : soins visage, manucure-pédicure, épilation et massages relaxants. Institut à Cotonou et prestations à domicile pour les mariées et événements.",
        metierSlug: 'estheticienne',
        ville: 'Cotonou', quartier: 'Haie Vive', lat: 6.3600, lng: 2.4000,
        tarifHoraire: 3000, tarifDeplacement: 1000, annees: 10,
        abonnement: 'GRATUIT', urgences: false, weekend: true, missions: 88,
        avis: [
            { client: 0, note: 5, commentaire: 'Massage très relaxant et institut impeccable. J\'y retourne chaque mois.' },
        ],
    },
    {
        email: 'thierry.solaire@test.bj', prenom: 'Thierry', nom: 'BONOU',
        photo: 'https://randomuser.me/api/portraits/men/55.jpg',
        entreprise: 'Soleil Énergie Bénin', slogan: 'L\'énergie qui ne coupe jamais',
        bio: "Installateur solaire certifié : kits domestiques, pompage solaire, lampadaires. Étude gratuite de vos besoins, matériel garanti 2 ans, maintenance incluse la première année.",
        metierSlug: 'installateur-solaire',
        ville: 'Abomey-Calavi', quartier: 'Togba', lat: 6.4200, lng: 2.3100,
        tarifHoraire: 6000, tarifDeplacement: 3000, annees: 6,
        abonnement: 'STANDARD', urgences: false, weekend: false, missions: 52,
        avis: [
            { client: 2, note: 5, commentaire: 'Kit solaire installé, plus de coupures ! Explications claires sur l\'entretien.' },
            { client: 4, note: 5, commentaire: 'Pompage solaire pour mon jardin maraîcher, ça marche parfaitement.' },
        ],
    },
    {
        email: 'firmin.carreleur@test.bj', prenom: 'Firmin', nom: 'YEHOUENOU',
        photo: 'https://randomuser.me/api/portraits/men/47.jpg',
        entreprise: 'Carrelage Précision', slogan: 'Au millimètre près',
        bio: "Carreleur spécialisé grands formats et faïence. Pose droite, diagonale, avec plinthe et joints époxy. Salles de bain, cuisines, terrasses. Rendu net garanti.",
        metierSlug: 'carreleur',
        ville: 'Cotonou', quartier: 'Agla', lat: 6.3900, lng: 2.3600,
        tarifHoraire: 2800, tarifDeplacement: 1500, annees: 9,
        abonnement: 'GRATUIT', urgences: false, weekend: true, missions: 61,
        avis: [
            { client: 5, note: 4, commentaire: 'Douche carrelée avec soin, joints impeccables.' },
        ],
    },
    {
        email: 'josue.jardinier@test.bj', prenom: 'Josué', nom: 'DANSOU',
        photo: 'https://randomuser.me/api/portraits/men/29.jpg',
        entreprise: 'Jardins de Josué', slogan: 'Un jardin qui respire',
        bio: "Jardinier paysagiste : entretien de jardins, taille, gazon, haies et création d'espaces verts. Abonnements mensuels pour particuliers et entreprises. Matériel professionnel fourni.",
        metierSlug: 'jardinier', metierSecondaire: 'paysagiste',
        ville: 'Cotonou', quartier: 'Fidjrossè plage', lat: 6.3450, lng: 2.3650,
        tarifHoraire: 2000, tarifDeplacement: 1000, annees: 5,
        abonnement: 'GRATUIT', urgences: false, weekend: true, missions: 47,
        avis: [
            { client: 3, note: 5, commentaire: 'Jardin transformé en un week-end. Il passe maintenant chaque mois.' },
        ],
    },
    {
        email: 'edwige.alu@test.bj', prenom: 'Edwige', nom: 'LOKONON',
        photo: 'https://randomuser.me/api/portraits/women/72.jpg',
        entreprise: 'Alu Design Bénin', slogan: 'La modernité chez vous',
        bio: "Menuiserie aluminium : fenêtres coulissantes, portes vitrées, vérandas et cloisons de bureau. Fabrication sur mesure, pose soignée, profilés de qualité garantis anti-corrosion.",
        metierSlug: 'menuisier-aluminium',
        ville: 'Porto-Novo', quartier: 'Djègan-Kpèvi', lat: 6.4900, lng: 2.6100,
        tarifHoraire: 4000, tarifDeplacement: 2500, annees: 7,
        abonnement: 'STANDARD', urgences: false, weekend: false, missions: 58,
        avis: [
            { client: 1, note: 5, commentaire: 'Fenêtres alu posées proprement, la maison a changé de standing.' },
            { client: 4, note: 4, commentaire: 'Bon travail sur la véranda, finitions correctes.' },
        ],
    },
];

// ─── Exécution ────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Seed AlloArtisan…');
    const passwordHash = await argon2.hash(PASSWORD);

    // 1. Catégories + métiers (upsert par slug)
    const metierIdBySlug = new Map<string, string>();
    for (const cat of CATEGORIES) {
        const categorie = await prisma.categorieMetier.upsert({
            where: { slug: cat.slug },
            update: { nom: cat.nom, ordreAffichage: cat.ordre, actif: true },
            create: { nom: cat.nom, slug: cat.slug, ordreAffichage: cat.ordre, actif: true },
        });
        for (const m of cat.metiers) {
            const metier = await prisma.metier.upsert({
                where: { slug: m.slug },
                update: { nom: m.nom, categorieId: categorie.id, populaire: !!m.populaire, actif: true },
                create: { nom: m.nom, slug: m.slug, categorieId: categorie.id, populaire: !!m.populaire, actif: true },
            });
            metierIdBySlug.set(m.slug, metier.id);
        }
    }
    console.log(`✅ ${CATEGORIES.length} catégories, ${metierIdBySlug.size} métiers`);

    // 2. Clients
    const clientIds: string[] = [];
    for (const c of CLIENTS) {
        const user = await prisma.user.upsert({
            where: { email: c.email },
            update: {},
            create: {
                email: c.email,
                passwordHash,
                prenom: c.prenom,
                nom: c.nom,
                photoUrl: c.photo,
                role: Role.CLIENT,
                statut: Statut.ACTIF,
                emailVerified: true,
                profilComplet: true,
                ville: c.ville,
                quartier: c.quartier,
            },
        });
        clientIds.push(user.id);
    }
    console.log(`✅ ${clientIds.length} clients (mot de passe: ${PASSWORD})`);

    // 3. Artisans + métiers + bookings terminés + avis
    let avisCount = 0;
    for (const a of ARTISANS) {
        const user = await prisma.user.upsert({
            where: { email: a.email },
            update: {},
            create: {
                email: a.email,
                passwordHash,
                prenom: a.prenom,
                nom: a.nom,
                photoUrl: a.photo,
                role: Role.ARTISAN,
                statut: Statut.ACTIF,
                emailVerified: true,
                profilComplet: true,
                ville: a.ville,
                quartier: a.quartier,
                latitude: a.lat,
                longitude: a.lng,
            },
        });

        let artisan = await prisma.artisan.findUnique({ where: { userId: user.id } });
        if (!artisan) {
            artisan = await prisma.artisan.create({
                data: {
                    userId: user.id,
                    nomEntreprise: a.entreprise,
                    slogan: a.slogan,
                    bio: a.bio,
                    photoProfilUrl: a.photo,
                    photoCouvertureUrl: `https://picsum.photos/seed/${a.metierSlug}-cover/800/400`,
                    portfolioUrls: [
                        `https://picsum.photos/seed/${a.metierSlug}-1/640/480`,
                        `https://picsum.photos/seed/${a.metierSlug}-2/640/480`,
                        `https://picsum.photos/seed/${a.metierSlug}-3/640/480`,
                        `https://picsum.photos/seed/${a.metierSlug}-4/640/480`,
                    ],
                    adresseAtelier: `${a.quartier}, ${a.ville}`,
                    latitude: a.lat,
                    longitude: a.lng,
                    villePrincipale: a.ville,
                    zoneInterventionKm: 15,
                    anneesExperience: a.annees,
                    tarifHoraire: a.tarifHoraire,
                    tarifDeplacement: a.tarifDeplacement,
                    disponible: true,
                    accepteUrgences: a.urgences,
                    accepteWeekend: a.weekend,
                    verified: true,
                    verifiedAt: new Date(),
                    abonnementType: a.abonnement,
                    abonnementExpireAt:
                        a.abonnement === 'GRATUIT'
                            ? null
                            : new Date(Date.now() + 30 * 24 * 3600 * 1000),
                    nombreMissionsCompletees: a.missions,
                    tauxCompletion: 97,
                    statut: StatutArtisan.ACTIF,
                },
            });

            const principal = metierIdBySlug.get(a.metierSlug);
            if (principal) {
                await prisma.artisanMetier.create({
                    data: { artisanId: artisan.id, metierId: principal, estPrincipal: true, anneesExperience: a.annees },
                });
            }
            if (a.metierSecondaire) {
                const secondaire = metierIdBySlug.get(a.metierSecondaire);
                if (secondaire) {
                    await prisma.artisanMetier.create({
                        data: { artisanId: artisan.id, metierId: secondaire, estPrincipal: false },
                    });
                }
            }
        }

        // Avis (via bookings TERMINEE) — seulement si l'artisan n'en a pas encore
        const existingAvis = await prisma.avis.count({ where: { artisanId: artisan.id } });
        if (existingAvis === 0) {
            const metierId = metierIdBySlug.get(a.metierSlug)!;
            for (let i = 0; i < a.avis.length; i++) {
                const av = a.avis[i];
                const clientId = clientIds[av.client];
                const finAt = new Date(Date.now() - (i + 2) * 7 * 24 * 3600 * 1000);
                const booking = await prisma.booking.create({
                    data: {
                        clientId,
                        artisanId: artisan.id,
                        metierId,
                        statut: StatutBooking.TERMINEE,
                        titre: `Intervention ${a.entreprise}`,
                        description: 'Intervention de démonstration créée par le seed pour porter un avis client réaliste.',
                        adresseIntervention: `${a.quartier}, ${a.ville}`,
                        prixFinal: a.tarifHoraire * 2,
                        finAt,
                        createdAt: new Date(finAt.getTime() - 3 * 24 * 3600 * 1000),
                    },
                });
                await prisma.avis.create({
                    data: {
                        bookingId: booking.id,
                        clientId,
                        artisanId: artisan.id,
                        note: av.note,
                        notePonctualite: Math.max(3, av.note - (i % 2)),
                        noteQualite: av.note,
                        noteCommunication: av.note,
                        commentaire: av.commentaire,
                        createdAt: finAt,
                    },
                });
                avisCount++;
            }
        }
    }
    console.log(`✅ ${ARTISANS.length} artisans, ${avisCount} nouveaux avis (notes recalculées par trigger)`);
    console.log('🌱 Seed terminé.');
}

main()
    .catch((e) => {
        console.error('❌ Erreur seed :', e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
