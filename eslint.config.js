import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
	},
	{
		// Category config module: a data table (CATEGORY_ICON, ACCENT_ACTIVE,
		// CATEGORIES) paired with the small render helpers it points to — not a
		// component file with a Fast Refresh boundary to protect.
		files: ["src/components/categories.tsx"],
		rules: {
			"react-refresh/only-export-components": "off",
		},
	},
]);
