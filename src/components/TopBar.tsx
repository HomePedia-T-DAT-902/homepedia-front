import { Check, Link, LocateFixed, MapPin, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAddressAutocomplete } from "../hooks/useAddressAutocomplete";
import type { Address } from "../types/address";

interface Props {
	selectedAddress: Address | null;
	onAddressSelected: (address: Address) => void;
	radius: number;
	onRadiusChange: (r: number) => void;
	onRecenter: () => void;
}

export function TopBar({
	selectedAddress,
	onAddressSelected,
	radius,
	onRadiusChange,
	onRecenter,
}: Props) {
	const [isEditing, setIsEditing] = useState(!selectedAddress);
	const [copied, setCopied] = useState(false);
	const {
		query,
		setQuery,
		results,
		isLoading,
		showDropdown,
		handleFocus,
		handleBlur,
		closeDropdown,
	} = useAddressAutocomplete(selectedAddress?.label ?? "");
	const inputRef = useRef<HTMLInputElement>(null);
	const showInput = isEditing || !selectedAddress;

	useEffect(() => {
		if (showInput) inputRef.current?.focus();
	}, [showInput]);

	function handleSelect(address: Address) {
		setQuery(address.label);
		closeDropdown();
		onAddressSelected(address);
		setIsEditing(false);
	}

	async function handleShare() {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const trackPct = ((radius - 1) / 29) * 100;

	return (
		<div className="absolute top-4 right-4 z-20 flex items-center gap-2">
			{/* Address chip */}
			<div className="relative">
				{showInput ? (
					<div className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 shadow-xl focus-within:border-accent/60 transition-colors w-56">
						<MapPin size={15} className="text-slate-400 shrink-0" />
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onFocus={handleFocus}
							onBlur={handleBlur}
							placeholder="Rechercher une adresse..."
							className="flex-1 min-w-0 bg-transparent text-white text-xs placeholder-slate-500 outline-none"
						/>
						{isLoading && (
							<span className="text-slate-500 text-xs shrink-0">…</span>
						)}
						{selectedAddress && (
							<button
								type="button"
								onClick={() => setIsEditing(false)}
								className="cursor-pointer text-slate-500 hover:text-slate-300 shrink-0 transition-colors"
								aria-label="Annuler"
							>
								<X size={12} />
							</button>
						)}
					</div>
				) : (
					<button
						type="button"
						onClick={() => {
							setQuery(selectedAddress.label);
							setIsEditing(true);
						}}
						className="cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 hover:border-slate-500/60 shadow-xl transition-all w-56 text-left"
					>
						<MapPin size={15} className="text-blue-400 shrink-0" />
						<span className="flex-1 min-w-0">
							<span className="block text-white text-xs font-medium truncate leading-tight">
								{selectedAddress.label.split(",")[0]}
							</span>
							<span className="block text-slate-400 text-xs truncate leading-tight mt-0.5">
								{selectedAddress.label.split(",").slice(1).join(",").trim()}
							</span>
						</span>
						<Pencil
							size={11}
							className="text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors"
						/>
					</button>
				)}

				{showDropdown && (
					<ul
						className="absolute z-50 right-0 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
						style={{ animation: "slideInDown 0.15s ease-out" }}
					>
						{results.map((address) => (
							<li
								key={address.label}
								onClick={() => handleSelect(address)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSelect(address);
								}}
								className="px-3 py-2.5 text-white hover:bg-slate-800 cursor-pointer text-xs border-b border-slate-700/40 last:border-0 truncate"
							>
								{address.label}
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Recenter button */}
			{selectedAddress && (
				<button
					type="button"
					onClick={onRecenter}
					title="Recentrer sur l'adresse"
					aria-label="Recentrer sur l'adresse"
					className="cursor-pointer flex items-center justify-center w-9 h-9 rounded-xl glass border border-white/10 text-slate-300 hover:border-slate-500/60 hover:text-white shadow-xl transition-all shrink-0"
				>
					<LocateFixed size={15} />
				</button>
			)}

			{/* Radius slider */}
			<div className="flex items-center gap-2.5 px-3 py-2 rounded-xl glass border border-white/10 shadow-xl">
				<span className="text-slate-400 text-xs shrink-0">Rayon</span>
				<input
					type="range"
					min={1}
					max={30}
					step={1}
					value={radius}
					onChange={(e) => onRadiusChange(Number(e.target.value))}
					className="w-28 h-1.5 rounded-full appearance-none cursor-pointer"
					style={{
						background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${trackPct}%, #334155 ${trackPct}%, #334155 100%)`,
					}}
				/>
				<span className="text-white text-xs font-semibold tabular-nums w-9 shrink-0">
					{radius} km
				</span>
			</div>

			{/* Share button */}
			<button
				type="button"
				onClick={handleShare}
				className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border shadow-xl text-xs font-medium transition-all ${
					copied
						? "bg-green-500/15 border-green-500/40 text-green-300 backdrop-blur-md"
						: "glass border-white/10 text-slate-300 hover:border-slate-500/60 hover:text-white"
				}`}
			>
				{copied ? <Check size={13} /> : <Link size={13} />}
				{copied ? "Copié !" : "Partager"}
			</button>
		</div>
	);
}
