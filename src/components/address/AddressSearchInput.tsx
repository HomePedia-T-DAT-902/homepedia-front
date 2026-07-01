import { useState } from "react";
import type { Address } from "../../types/address";

interface Props {
	query: string;
	onQueryChange: (q: string) => void;
	suggestions: Address[];
	isLoading: boolean;
	onSelect: (address: Address) => void;
}

export function AddressSearchInput({
	query,
	onQueryChange,
	suggestions,
	isLoading,
	onSelect,
}: Props) {
	const [isFocused, setIsFocused] = useState(false);
	const showDropdown = isFocused && suggestions.length > 0;

	return (
		<div className="relative">
			<input
				type="text"
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setTimeout(() => setIsFocused(false), 150)}
				placeholder="Ex : 10 rue de la Paix, Paris..."
				className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 transition-colors"
			/>
			{isLoading && (
				<span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
					...
				</span>
			)}
			{showDropdown && (
				<ul className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-xl">
					{suggestions.map((address) => (
						<li
							key={address.label}
							onClick={() => onSelect(address)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") onSelect(address);
							}}
							className="px-4 py-2.5 text-white hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700 last:border-0"
						>
							{address.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
