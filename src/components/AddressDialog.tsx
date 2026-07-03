import { ArrowRight, MapPin, Search, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAddressAutocomplete } from "../hooks/useAddressAutocomplete";
import type { Address } from "../types/address";

const DEFAULT_ADDRESS: Address = {
	label: "10 Place de la République, 35000 Rennes",
	coordinates: [-1.6794, 48.1126],
	citycode: "35238",
};

interface AddressDialogProps {
	onAddressSelected: (address: Address) => void;
}

export function AddressDialog({ onAddressSelected }: AddressDialogProps) {
	const {
		query,
		setQuery,
		results,
		isLoading,
		showDropdown,
		handleFocus,
		handleBlur,
	} = useAddressAutocomplete();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

			{/* Dialog card */}
			<div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
				{/* Header */}
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<MapPin size={20} className="text-blue-400 shrink-0" />
						<h2 className="text-white font-semibold text-base">
							Choisir une adresse
						</h2>
					</div>
					<p className="text-slate-400 text-sm ml-7">
						Sélectionnez un bien pour afficher ses informations.
					</p>
				</div>

				{/* Search input */}
				<div className="relative">
					<div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600/60 focus-within:border-blue-500/60 transition-colors">
						<Search size={16} className="text-slate-400 shrink-0" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onFocus={handleFocus}
							onBlur={handleBlur}
							placeholder="Rechercher une adresse..."
							className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
						/>
						{isLoading && (
							<span className="text-slate-500 text-xs shrink-0">…</span>
						)}
					</div>

					{showDropdown && (
						<ul className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl">
							{results.map((address) => (
								<li
									key={address.label}
									onClick={() => onAddressSelected(address)}
									onKeyDown={(e) => {
										if (e.key === "Enter") onAddressSelected(address);
									}}
									className="px-3 py-2.5 text-white hover:bg-slate-800 cursor-pointer text-sm border-b border-slate-700/40 last:border-0 truncate"
								>
									{address.label}
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Divider */}
				<div className="flex items-center gap-3">
					<div className="flex-1 h-px bg-slate-700/60" />
					<span className="text-slate-500 text-xs">ou</span>
					<div className="flex-1 h-px bg-slate-700/60" />
				</div>

				{/* Default address */}
				<button
					type="button"
					onClick={() => onAddressSelected(DEFAULT_ADDRESS)}
					className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/15 transition-all text-left group"
				>
					<div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 mt-0.5">
						<Sparkles size={16} />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-blue-300 text-xs font-medium mb-0.5">
							Adresse de démonstration
						</p>
						<p className="text-white text-sm font-medium truncate">
							{DEFAULT_ADDRESS.label.split(",")[0]}
						</p>
						<p className="text-slate-400 text-xs truncate">
							{DEFAULT_ADDRESS.label.split(",").slice(1).join(",").trim()}
						</p>
					</div>
					<ArrowRight
						size={16}
						className="text-blue-400/50 group-hover:text-blue-400 shrink-0 mt-2 transition-colors"
					/>
				</button>
			</div>
		</div>
	);
}
