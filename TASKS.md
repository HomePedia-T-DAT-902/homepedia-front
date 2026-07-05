# Homepedia Frontend — Suivi des tâches

> **Projet** : T-DAT-902 — Plateforme d'analyse du marché immobilier français
> **Repo** : `homepedia-front` (React 19 + Vite + TypeScript)

L'app est une **single-page centrée sur une adresse** : on choisit une adresse,
puis on explore son voisinage via des catégories (carte Mapbox + panneau latéral).

---

## Setup & Infrastructure

- [x] Repo Git + `.gitignore`
- [x] Dépendances (react-map-gl, mapbox-gl, @tanstack/react-query, tailwindcss, lucide-react)
- [x] `README.md` (installation, lancement, sources de données, architecture)
- [x] Arborescence `src/` (api, repositories, hooks, components, types, utils)
- [x] Dockerfile multi-stage (Node build → Nginx) + `Dockerfile.dev` (Vite)
- [x] `docker-compose.yml` (profils dev / prod) + `nginx.conf`
- [x] `.env.example` (`VITE_API_URL`, `VITE_MAPBOX_ACCESS_TOKEN`)
- [x] Config Vite : proxy `/api` → FastAPI + plugin Tailwind
- [x] Makefile (`make dev` / `up` / `prod` / `ci`)
- [x] CI GitHub Actions (lint + typecheck + build) + Husky (pre-commit / pre-push)

---

## Accès aux données

- [x] `api/httpClient.ts` — client fetch typé (query string + AbortSignal)
- [x] `repositories/` — un repository par domaine (`createCommuneRepository`)
- [x] Recherche d'adresse (BAN) — `useAddressSearch` / `useAddressAutocomplete`
- [x] POI Mapbox Search Box — `usePoisQuery`
- [x] Itinéraires & durées Mapbox — `useRouteQuery` / `useRouteDurationsQuery`
- [x] Isochrones Mapbox — `useIsochroneQuery`
- [x] Prix DVF à proximité — `usePrixPointsQuery`
- [x] Risques + points de risque + qualité de l'air — `useGeorisquesQuery` / `useRiskPointsQuery`
- [x] Fiche « Ville » agrégée — `useCityQuery`
- [x] Synchronisation de l'état dans l'URL — `useUrlState`

---

## Interface

- [x] `App.tsx` — état global (adresse, catégorie, rayon, POI, mode prix)
- [x] `AddressDialog` — sélection d'adresse au premier chargement
- [x] `TopBar` — recherche d'adresse, slider de rayon, recentrage
- [x] `FloatingPanel` — colonne d'icônes de catégories
- [x] `map/MapView` — carte Mapbox (POI, risques, prix, isochrones, itinéraire)
- [x] `sidebar/Sidebar` + `categories.tsx` — panneaux contextuels par catégorie
- [x] Catégories : Écoles, Commerces, Transports, Santé, Espaces verts,
      Risques & Air, Accessibilité, Ville, Prix

---

## À faire / améliorations

- [ ] Tests frontend (aucun test ni framework de test pour l'instant)
- [ ] Optimisation perfs (lazy loading, memoization, bundle splitting)
- [ ] Accessibilité (a11y) et responsive mobile
