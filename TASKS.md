# HOMEPEDIA FRONTEND -- Suivi des tâches

> **Projet** : T-DAT-902 | Plateforme d'analyse du marché immobilier français
> **Repo** : `homepedia-front` (React + Vite + TypeScript)
> **Légende taille** : S = Small (~2h) | M = Medium (~4h) | L = Large (~1j) | XL = Extra Large (~2j+)
> **Légende priorité** : P0 = Critique (bloquant) | P1 = Important | P2 = Secondaire

---

## Setup & Infrastructure

- [x] **P0-1** `S` `P0` -- Initialiser repo Git + `.gitignore`
- [x] **P0-2** `S` `P0` -- Installer dépendances npm (react-map-gl, mapbox-gl, recharts, @tanstack/react-query, tailwindcss)
- [x] **P0-8** `S` `P1` -- Écrire `README.md` (installation, lancement, architecture)
- [x] **P0-9** `S` `P0` -- Créer l'arborescence front (src/components, src/views, src/hooks, src/api, src/types)
- [x] **F-1** `S` `P0` -- Dockerfile multi-stage (Node build → Nginx) + Dockerfile.dev (Vite hot reload)
- [x] **F-2** `S` `P0` -- docker-compose.yml (profiles dev/prod) + nginx.conf
- [x] **F-3** `S` `P0` -- .env.example (VITE_API_URL, VITE_MAPBOX_TOKEN)
- [x] **F-4** `S` `P0` -- Config Vite : proxy `/api` → FastAPI + plugin Tailwind

---

## Composants réutilisables

- [ ] **P5-1** `M` `P0` -- `src/components/Layout.tsx`
  - Navbar (logo, barre de recherche autocomplete, filtres), footer
  - Structure responsive : carte à gauche, panneau latéral à droite
- [ ] **P5-2** `L` `P0` -- `src/components/MapView.tsx`
  - Carte choropleth (react-map-gl + Mapbox GL JS) -- coloration par indicateur via fill layers
  - Carte bubble map -- cercles proportionnels via circle layers
  - Gestion du zoom animé lors des transitions de viewLevel
  - `onFeatureClick` → déclenche la navigation (navigateTo)
  - Composant réutilisable paramétrable (indicateur, niveau géo, palette)
- [ ] **P5-3** `L` `P0` -- `src/components/Charts.tsx`
  - LineChart (tendances temporelles)
  - BarChart (comparaisons, distributions)
  - RadarChart (profil multi-critères)
  - BoxPlot (distribution des prix via customisation Recharts)
  - Tous via Recharts, paramétrables
- [ ] **P5-4** `M` `P0` -- `src/components/SidePanel.tsx`
  - Panneau latéral contextuel qui s'adapte au viewLevel :
    - national → KPIs nationaux, top/flop, tendance
    - region → KPIs régionaux, comparaison départements
    - departement → classement communes, tendances départementales
    - commune → fiche détaillée avec onglets (Prix, DPE, Équipements, Revenus, Criminalité, Avis)
  - **Dépendance** : P5-3
- [ ] **P5-5** `M` `P1` -- `src/components/Filters.tsx` + `Breadcrumb.tsx`
  - Barre de filtres horizontale : indicateur choroplèthe, type de bien, période (slider)
  - Breadcrumb cliquable (France > Région > Département > Commune)
  - Gestion d'état via React Context (FilterProvider)
- [ ] **P5-6** `S` `P1` -- `src/assets/` + Tailwind config
  - Thème Tailwind custom (couleurs, typographie, espacements)
  - Responsive design

---

## Application & Hooks

- [ ] **P5-7** `M` `P0` -- `src/App.tsx` + Providers
  - FilterProvider (filtres globaux : indicateur, type bien, période)
  - MapNavigationProvider (viewLevel, selectedCode, zoom, breadcrumb)
  - Layout global avec carte + panneau latéral
  - **Dépendance** : P5-1
- [ ] **P5-8** `M` `P0` -- `src/hooks/useMapNavigation.ts`
  - Context pour la navigation carte (viewLevel, selectedCode, parentCodes)
  - Fonctions : navigateTo(level, code), goBack(), goToNational()
  - Transitions animées (zoom) lors du changement de viewLevel
  - **Dépendance** : P5-7
- [ ] **P5-9** `M` `P0` -- `src/hooks/` + `src/api/`
  - Custom hooks pour le data fetching (useCommune, usePrices, useStats, useGeo, useReviews)
  - Client API centralisé (fetchApi, fetchGeoJson)
  - useFilters (FilterProvider)
  - **Dépendance** : P5-7

---

## Intégration viewLevels (dépend de l'API backend)

- [ ] **P5-10** `L` `P0` -- Intégration viewLevel national + region
  - Choroplèthe départements colorée par indicateur
  - SidePanel national : KPIs, top/flop, tendance
  - SidePanel region : comparaison départements, tendances
  - Clic département → zoom + transition vers region/departement
  - **Dépendance** : API geo, P5-2, P5-3, P5-4, P5-8
- [ ] **P5-11** `L` `P0` -- Intégration viewLevel departement
  - Carte communes (bubble map ou choroplèthe)
  - SidePanel : classement communes triable, tendances départementales
  - Clic commune → zoom + transition vers commune
  - **Dépendance** : API geo, P5-2, P5-3, P5-4, P5-8
- [ ] **P5-12** `XL` `P0` -- Intégration viewLevel commune (fiche détaillée)
  - SidePanel avec onglets :
    - Prix immobilier (historique + tendance + distribution)
    - DPE (distribution des classes énergétiques)
    - Équipements et services (nombre par catégorie)
    - Revenus et emploi
    - Criminalité
    - Avis habitants (notes + word cloud basique)
  - **Dépendance** : API communes/prices/stats/reviews, P5-3, P5-4, P5-8

---

## Vues spécialisées

- [ ] **P5-13** `M` `P1` -- `src/components/WordCloud.tsx`
  - Word cloud basique (fréquence de mots, pas de sentiment)
  - Intégré dans l'onglet "Avis" du SidePanel commune
  - **Dépendance** : P5-12
- [ ] **P5-14** `M` `P1` -- `src/views/TendancesView.tsx`
  - Mode tendances (viewMode=tendances via navbar)
  - Comparaison multi-communes : sélection 2-5 communes, LineChart multi-séries
  - **Dépendance** : P5-3, P5-8, P5-9
- [ ] **P5-15** `M` `P1` -- `src/views/ComparaisonView.tsx`
  - Mode comparaison (viewMode=comparaison via navbar)
  - Sélection 2-4 communes, RadarChart multi-critères, table side-by-side
  - **Dépendance** : P5-3, P5-8, P5-9
- [ ] **P5-16** `M` `P1` -- `src/views/EnergieView.tsx`
  - Mode énergie (viewMode=energie via navbar)
  - Carte heatmap DPE par département, distribution classes A-G, évolution temporelle
  - **Dépendance** : P5-2, P5-3, P5-8
- [ ] **P5-17** `M` `P1` -- `src/views/AvisView.tsx`
  - Mode avis (viewMode=avis via navbar)
  - Recherche commune, WordCloud, RadarChart 8 critères, choropleth note globale
  - **Dépendance** : P5-8, P5-13

---

## Finalisation

- [ ] **F-5** `L` `P1` -- Tests frontend (composants + hooks)
- [ ] **F-6** `L` `P1` -- Optimisation performances (lazy loading, memoization, bundle splitting)
- [ ] **F-7** `M` `P0` -- Docker final : intégration dans le docker-compose global du projet

---

## Bonus

- [ ] **B-5** `S` `P2` -- Visite guidée de l'application
