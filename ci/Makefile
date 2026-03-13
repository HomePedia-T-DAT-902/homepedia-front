.PHONY: help install lint typecheck test build spec-update generate-types types-check ci clean

help: ## Afficher cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ────────────────────────────────────────────────────────────

install: ## Installer les dépendances
	npm ci

# ─── Qualité du code ─────────────────────────────────────────────────

lint: ## Lancer le linter (ESLint)
	npx eslint src/ --max-warnings 0

format: ## Formater le code (Prettier)
	npx prettier --write src/

typecheck: ## Vérifier les types (tsc)
	npx tsc --noEmit

# ─── Tests ────────────────────────────────────────────────────────────

test: ## Lancer les tests (vitest)
	npx vitest run

build: ## Build de production
	npm run build

# ─── Contrat API ──────────────────────────────────────────────────────

generate-types: ## Générer les types TS depuis openapi.json
	npx openapi-typescript openapi.json -o src/types/api.generated.ts

spec-update: ## Récupérer le dernier openapi.json depuis le repo backend
	gh release download latest -R org/homepedia-api -p openapi.json -D . --clobber
	$(MAKE) generate-types

types-check: generate-types ## Vérifier que les types générés sont à jour
	@git diff --exit-code src/types/api.generated.ts || (echo "\n❌ Les types ne sont pas à jour. Committez api.generated.ts." && exit 1)
	@echo "✅ Les types sont à jour"

# ─── Raccourcis ───────────────────────────────────────────────────────

ci: lint typecheck test types-check build ## Lancer tous les checks CI en local
	@echo "\n✅ Tous les checks passent"

clean: ## Nettoyer les fichiers temporaires
	rm -rf dist/ node_modules/.cache/
