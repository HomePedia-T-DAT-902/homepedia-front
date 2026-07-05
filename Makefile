.PHONY: help install dev up prod down logs lint typecheck build preview ci clean

COMPOSE := docker compose
NETWORK := homepedia-network

help: ## Afficher cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ─── Local ────────────────────────────────────────────────────────────

install: ## Installer les dépendances
	npm install

dev: ## Lancer le serveur Vite en local (http://localhost:3000)
	npm run dev

# ─── Docker ───────────────────────────────────────────────────────────

network: ## Créer le réseau Docker partagé si besoin
	@docker network inspect $(NETWORK) >/dev/null 2>&1 || docker network create $(NETWORK)

up: network ## Tout lancer en Docker (dev, hot reload)
	$(COMPOSE) --profile dev up --build

prod: network ## Build de prod servi par Nginx (http://localhost)
	$(COMPOSE) --profile prod up --build

down: ## Arrêter les conteneurs
	$(COMPOSE) --profile dev --profile prod down

logs: ## Suivre les logs des conteneurs
	$(COMPOSE) logs -f

# ─── Qualité du code ─────────────────────────────────────────────────

lint: ## Lancer le linter (ESLint)
	npm run lint

typecheck: ## Vérifier les types (tsc -b)
	npm run typecheck

build: ## Build de production (tsc -b && vite build)
	npm run build

preview: ## Prévisualiser le build de production
	npm run preview

# ─── Raccourcis ───────────────────────────────────────────────────────

ci: lint typecheck build ## Rejouer les checks de la CI GitHub en local
	@echo "\n✅ Tous les checks passent"

clean: ## Nettoyer les fichiers temporaires
	rm -rf dist/ node_modules/.cache/
