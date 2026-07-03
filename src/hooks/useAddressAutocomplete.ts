import { useState } from "react";
import { useAddressSearch } from "./useAddressSearch";

/** Shared query/focus wiring behind the address search dropdowns (TopBar, AddressDialog):
 * debounced results plus the blur-timeout hack needed so a click on a suggestion
 * registers before the input's blur hides the dropdown. */
export function useAddressAutocomplete(initialQuery = "") {
	const [query, setQuery] = useState(initialQuery);
	const [isFocused, setIsFocused] = useState(false);
	const { results, isLoading } = useAddressSearch(query);

	function handleFocus() {
		setIsFocused(true);
	}

	function handleBlur() {
		setTimeout(() => setIsFocused(false), 150);
	}

	return {
		query,
		setQuery,
		results,
		isLoading,
		showDropdown: isFocused && results.length > 0,
		handleFocus,
		handleBlur,
		closeDropdown: () => setIsFocused(false),
	};
}
