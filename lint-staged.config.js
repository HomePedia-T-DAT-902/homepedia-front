// lint-staged runs only on the files staged for commit, mirroring the CI gates
// (ESLint + tsc) without being stricter or looser than `.github/workflows/ci.yml`.
export default {
	// CI runs `eslint .` — here we lint the staged TS/TSX with the same ESLint and
	// flat config, adding --fix to auto-correct what can be fixed. Unfixable errors
	// abort the commit, exactly like CI fails on them. No --max-warnings, because CI
	// doesn't use it either (staying in parity with the pipeline).
	"*.{ts,tsx}": [
		"eslint --fix",
		// Type-check the whole project once when any TS/TSX is staged (we ignore the
		// staged file list because type errors are cross-file). We use `tsc -b`, the
		// same command the CI `build` job runs — `tsc --noEmit` against the root
		// tsconfig is a no-op here (files: [] + project references), so it would catch
		// nothing. `tsc -b` follows the references and is incremental, so it stays fast.
		() => "tsc -b",
	],
};
