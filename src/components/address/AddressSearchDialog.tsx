import { useEffect, useState } from "react";
import { useAddressSearch } from "../../hooks/useAddressSearch";
import type { Address } from "../../types/address";
import { AddressSearchInput } from "./AddressSearchInput";

const RENNES_DEFAULT: Address = {
	label: "Place du Parlement de Bretagne, 35000 Rennes",
	coordinates: [-1.6778, 48.1117],
};

interface Props {
	onAddressSelected: (address: Address) => void;
	onClose: () => void;
}

export function AddressSearchDialog({ onAddressSelected, onClose }: Props) {
	const [query, setQuery] = useState("");
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
	const { results, isLoading } = useAddressSearch(query);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	function handleSelect(address: Address) {
		setQuery(address.label);
		setSelectedAddress(address);
	}

	function handleDefault() {
		setQuery(RENNES_DEFAULT.label);
		setSelectedAddress(RENNES_DEFAULT);
	}

	function handleConfirm() {
		if (!selectedAddress) return;
		onAddressSelected(selectedAddress);
		onClose();
	}

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 z-40 bg-black/60 cursor-default"
				onClick={onClose}
				aria-label="Fermer le dialog"
			/>

			{/* Dialog panel */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="dialog-title"
				className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
			>
				<div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[480px] shadow-2xl flex flex-col gap-4 pointer-events-auto">
					<div className="flex items-center justify-between">
						<h2 id="dialog-title" className="text-white font-semibold text-lg">
							Rechercher une adresse
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer text-slate-400 hover:text-white transition-colors text-2xl leading-none"
						>
							×
						</button>
					</div>

					<AddressSearchInput
						query={query}
						onQueryChange={(q) => {
							setQuery(q);
							setSelectedAddress(null);
						}}
						suggestions={results}
						isLoading={isLoading}
						onSelect={handleSelect}
					/>

					<button
						type="button"
						onClick={handleDefault}
						className="text-slate-400 hover:text-blue-400 text-sm transition-colors text-left"
					>
						Utiliser l'adresse de Rennes par défaut
					</button>

					<button
						type="button"
						onClick={handleConfirm}
						disabled={!selectedAddress}
						className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-medium transition-colors"
					>
						Confirmer
					</button>
				</div>
			</div>
		</>
	);
}
