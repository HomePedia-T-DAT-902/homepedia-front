# Homepedia Frontend

Interface web pour la plateforme d'analyse du marché immobilier français.

## Stack

- **React** (Vite + TypeScript)
- **react-map-gl** + Mapbox GL JS (cartographie)
- **Recharts** (graphiques)
- **@tanstack/react-query** (data fetching)
- **Tailwind CSS** (styles)

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd homepedia-front

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Renseigner VITE_MAPBOX_TOKEN et VITE_API_URL
```

## Développement

```bash
npm run dev
```

L'app est accessible sur `http://localhost:5173`.

Le proxy Vite redirige `/api/*` vers `http://localhost:8000` (FastAPI).

## Build production

```bash
npm run build
npm run preview
```

## Docker

```bash
# Dev (hot reload)
docker compose --profile dev up

# Production (Nginx)
docker compose --profile prod up --build
```

## Architecture

```
src/
  components/    # Composants réutilisables (MapView, Charts, SidePanel...)
  views/         # Vues contextuelles (Tendances, Comparaison, Energie, Avis)
  hooks/         # Custom React hooks (useMapNavigation, useFilters...)
  api/           # Client API centralisé (fetch vers FastAPI)
  types/         # Types TypeScript partagés
```

Navigation single-page par `useMapNavigation` :
`national → region → departement → commune`
