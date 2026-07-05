# Homepedia Frontend

Interface web de la plateforme d'analyse du marché immobilier français.
Application **single-page** centrée sur une **adresse** : on choisit un point sur
la carte, puis on explore ce qu'il y a autour (prix, risques, commerces,
transports, accessibilité à pied…).

## Stack

- **React 19** (Vite + TypeScript)
- **react-map-gl** + **Mapbox GL JS** — cartographie
- **@tanstack/react-query** — data fetching / cache
- **Tailwind CSS 4** — styles
- **lucide-react** — icônes
- Outillage : ESLint, Husky + lint-staged (pas de Prettier, pas de tests)

## Prérequis

- Node.js 20+
- Un **token Mapbox** (gratuit) : https://account.mapbox.com/access-tokens/
- L'API backend `homepedia-api` qui tourne sur `http://localhost:8000` (optionnel :
  la carte, la recherche d'adresse et les POI fonctionnent sans le backend)

## Installation

```bash
git clone <repo-url>
cd homepedia-front

npm install

cp .env.example .env
# Renseigner VITE_MAPBOX_ACCESS_TOKEN (obligatoire) et VITE_API_URL
```

### Variables d'environnement

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `VITE_MAPBOX_ACCESS_TOKEN` | Token Mapbox (carte, POI, itinéraires, isochrones) | — (obligatoire) |
| `VITE_API_URL` | URL de l'API backend | vide → appels relatifs `/api/...` (proxy Vite) |

## Lancement

Tout se lance via le **Makefile** (`make help` pour la liste) :

```bash
make dev      # serveur Vite en local → http://localhost:3000
make up       # stack Docker (dev, hot reload)
make prod     # build de production servi par Nginx → http://localhost
```

Sans Make :

```bash
npm run dev        # http://localhost:3000
npm run build      # build de prod dans dist/
npm run preview    # prévisualise le build
```

En dev, le proxy Vite redirige `/api/*` vers `http://localhost:8000` (voir
[vite.config.ts](vite.config.ts)). Si `VITE_API_URL` est défini, les repositories
l'utilisent directement à la place du proxy.

## Sources de données

Le frontend appelle **trois familles de sources** (détail :
[docs/api-contrat.md](docs/api-contrat.md)) :

| Source | Usage | Auth |
| --- | --- | --- |
| **API `homepedia-api`** (`/api/v1/*`) | prix DVF, risques, qualité de l'air, avis, équipements, sécurité, éducation, détail commune | via `VITE_API_URL` |
| **Base Adresse Nationale** (`api-adresse.data.gouv.fr`) | recherche / autocomplétion d'adresse | aucune |
| **APIs Mapbox** | fond de carte, POI (Search Box), temps de trajet, itinéraire, isochrones | `VITE_MAPBOX_ACCESS_TOKEN` |

## Architecture

```
src/
  api/            # httpClient générique (fetch typé)
  repositories/   # accès aux endpoints backend (1 par domaine)
  hooks/          # hooks react-query (POI, prix, risques, adresse, isochrone…)
  components/     # UI : MapView, TopBar, Sidebar, FloatingPanel, AddressDialog…
  types/          # types TypeScript par domaine
  utils/          # helpers (géo, colonnes de prix)
  App.tsx         # composition de l'app
```

Fonctionnement (détail : [docs/frontend.md](docs/frontend.md)) :

1. L'utilisateur choisit une **adresse** (`AddressDialog` / `TopBar`, données BAN).
2. Il active une **catégorie** dans le `FloatingPanel` : Écoles, Commerces,
   Transports, Santé, Espaces verts, Risques & Air, Accessibilité, Ville, Prix.
3. La `MapView` affiche les données autour de l'adresse (dans un rayon réglable)
   et la `Sidebar` détaille la catégorie active.
4. L'état (adresse, catégorie, rayon) est synchronisé dans l'URL (partage direct).

## Docker

Le [docker-compose.yml](docker-compose.yml) expose deux profils :

- `dev` : image [Dockerfile.dev](Dockerfile.dev), serveur Vite (hot reload)
- `prod` : image [Dockerfile](Dockerfile) multi-stage (build Node → Nginx, port 80)

Les conteneurs partagent le réseau Docker externe `homepedia-network` (partagé
avec `homepedia-api`). `make up` / `make prod` le créent au besoin.

## Qualité

```bash
make lint        # ESLint
make typecheck   # tsc -b
make build       # tsc -b && vite build
make ci          # les 3 checks de la CI GitHub d'un coup
```

Husky : `pre-commit` lance lint-staged (ESLint --fix + `tsc -b`), `pre-push` lance
le build. La CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) rejoue lint
+ typecheck + build.
