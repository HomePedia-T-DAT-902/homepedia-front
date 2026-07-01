import type { LucideIcon } from "lucide-react";
import {
	Building2,
	Bus,
	Clock,
	GraduationCap,
	Heart,
	ShoppingBag,
	TreePine,
	TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import type { CityData } from "../types/city";
import type {
	AirQualityData,
	GeorisquesData,
	RiskLevel,
} from "../types/georisques";
import type { Poi } from "../types/poi";

export type CategoryId =
	| "schools"
	| "shops"
	| "transport"
	| "health"
	| "parks"
	| "risks"
	| "isochrone"
	| "city";

export interface Category {
	id: CategoryId;
	label: string;
	icon: ReactNode;
	accent: string;
	renderPanel: (
		pois?: Poi[],
		isLoading?: boolean,
		selectedPoiId?: string | null,
		onPoiSelect?: (poi: Poi) => void,
	) => ReactNode;
	renderCustomPanel?: (data: unknown, isLoading?: boolean) => ReactNode;
}

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
	schools: GraduationCap,
	shops: ShoppingBag,
	transport: Bus,
	health: Heart,
	parks: TreePine,
	risks: TriangleAlert,
	isochrone: Clock,
	city: Building2,
};

function AirQualitySection({ data }: { data: AirQualityData }) {
	const indexColor =
		data.indice <= 50
			? "text-sky-400"
			: data.indice <= 100
				? "text-amber-400"
				: "text-red-400";

	return (
		<div className="flex flex-col gap-3">
			<p className="text-slate-400 text-xs uppercase tracking-widest">
				Qualité de l'air
			</p>
			<div className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
				<div className={`text-3xl font-bold ${indexColor}`}>{data.indice}</div>
				<div>
					<p className="text-sky-300 font-semibold text-sm">
						Indice de qualité
					</p>
					<p className="text-sky-400/70 text-xs">{data.label}</p>
				</div>
			</div>
			{data.pollutants.map((p) => (
				<div key={p.name} className="flex items-center gap-3">
					<span className="text-slate-300 text-sm font-mono w-10 shrink-0">
						{p.name}
					</span>
					<div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
						<div
							className="h-full rounded-full bg-sky-400"
							style={{ width: `${Math.min((p.value / p.max) * 100, 100)}%` }}
						/>
					</div>
					<span className="text-slate-400 text-xs w-16 text-right shrink-0">
						{p.value} {p.unit}
					</span>
				</div>
			))}
		</div>
	);
}

function PoiSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			{[1, 2, 3, 4].map((i) => (
				<div
					key={i}
					className="h-14 rounded-lg bg-slate-800/60 animate-pulse"
				/>
			))}
		</div>
	);
}

function PoiList({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
	icon: Icon,
	emptyLabel,
	subtitle = "À proximité · cliquez pour tracer l'itinéraire",
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
	icon: LucideIcon;
	emptyLabel: string;
	subtitle?: string;
}) {
	if (isLoading) return <PoiSkeleton />;

	if (!pois || pois.length === 0) {
		return (
			<p className="text-slate-500 text-sm text-center py-6">{emptyLabel}</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
				{subtitle}
			</p>
			{pois.map((s) => (
				<button
					key={s.id}
					type="button"
					onClick={() => onPoiSelect?.(s)}
					className={`cursor-pointer flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
						s.id === selectedPoiId ? "bg-white/5" : "hover:bg-white/5"
					}`}
				>
					<div className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center shrink-0 text-white">
						<Icon size={16} />
					</div>
					<div className="min-w-0">
						<p className="text-slate-200 text-sm font-medium truncate">
							{s.name}
						</p>
						<div className="flex items-center gap-2 mt-0.5">
							<span className="text-slate-400 text-xs">{s.type}</span>
							<span className="text-slate-600">·</span>
							<span className="text-slate-500 text-xs">{s.distance}</span>
						</div>
					</div>
				</button>
			))}
		</div>
	);
}

function SchoolsPanel({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}) {
	return (
		<PoiList
			pois={pois}
			isLoading={isLoading}
			selectedPoiId={selectedPoiId}
			onPoiSelect={onPoiSelect}
			icon={GraduationCap}
			emptyLabel="Aucun établissement trouvé"
		/>
	);
}

function ShopsPanel({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}) {
	return (
		<PoiList
			pois={pois}
			isLoading={isLoading}
			selectedPoiId={selectedPoiId}
			onPoiSelect={onPoiSelect}
			icon={ShoppingBag}
			emptyLabel="Aucun commerce trouvé"
		/>
	);
}

function TransportPanel({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}) {
	return (
		<PoiList
			pois={pois}
			isLoading={isLoading}
			selectedPoiId={selectedPoiId}
			onPoiSelect={onPoiSelect}
			icon={Bus}
			emptyLabel="Aucun arrêt trouvé"
			subtitle="Arrêts proches · cliquez pour tracer l'itinéraire"
		/>
	);
}

function HealthPanel({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}) {
	return (
		<PoiList
			pois={pois}
			isLoading={isLoading}
			selectedPoiId={selectedPoiId}
			onPoiSelect={onPoiSelect}
			icon={Heart}
			emptyLabel="Aucun établissement de santé trouvé"
		/>
	);
}

function ParksPanel({
	pois,
	isLoading,
	selectedPoiId,
	onPoiSelect,
}: {
	pois?: Poi[];
	isLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}) {
	return (
		<PoiList
			pois={pois}
			isLoading={isLoading}
			selectedPoiId={selectedPoiId}
			onPoiSelect={onPoiSelect}
			icon={TreePine}
			emptyLabel="Aucun espace vert trouvé"
		/>
	);
}

const RISK_COLORS: Record<
	RiskLevel,
	{ bg: string; text: string; dot: string }
> = {
	Nul: {
		bg: "bg-slate-500/10 border-slate-500/20",
		text: "text-slate-400",
		dot: "bg-slate-400",
	},
	Faible: {
		bg: "bg-green-500/10 border-green-500/20",
		text: "text-green-400",
		dot: "bg-green-400",
	},
	Modéré: {
		bg: "bg-amber-500/10 border-amber-500/20",
		text: "text-amber-400",
		dot: "bg-amber-400",
	},
	Fort: {
		bg: "bg-red-500/10 border-red-500/20",
		text: "text-red-400",
		dot: "bg-red-400",
	},
	"Très fort": {
		bg: "bg-red-700/15 border-red-600/30",
		text: "text-red-300",
		dot: "bg-red-300",
	},
};

interface RisksExtraData extends GeorisquesData {
	activeRisks: string[] | null;
	onToggleRisk: (label: string) => void;
}

function RisksPanel({
	data,
	isLoading,
}: {
	data?: unknown;
	isLoading?: boolean;
}) {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{[1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="h-10 rounded-lg bg-slate-800/60 animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (!data) {
		return (
			<p className="text-slate-500 text-sm text-center py-6">
				Aucune donnée disponible
			</p>
		);
	}

	const d = data as RisksExtraData;

	return (
		<div className="flex flex-col gap-5">
			<AirQualitySection data={d.airQuality} />

			<div className="flex flex-col gap-3">
				<p className="text-slate-400 text-xs uppercase tracking-widest">
					Risques recensés
				</p>
				{d.risks.map((risk) => {
					const colors = RISK_COLORS[risk.niveau];
					const isToggleable = risk.niveau !== "Nul";
					const isActive =
						!isToggleable ||
						d.activeRisks === null ||
						d.activeRisks.includes(risk.libelle);

					const sharedClass = `flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border w-full text-left ${colors.bg} transition-all duration-200`;

					const inner = (
						<>
							<div className="flex items-center gap-2 min-w-0">
								<span
									className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 transition-all ${
										isActive
											? `${colors.dot} border-transparent`
											: "border-slate-500 bg-transparent"
									}`}
								/>
								<span className="text-slate-200 text-sm truncate">
									{risk.libelle}
								</span>
							</div>
							<span className={`text-xs font-medium shrink-0 ${colors.text}`}>
								{risk.niveau}
							</span>
						</>
					);

					return isToggleable ? (
						<button
							key={risk.libelle}
							type="button"
							onClick={() => d.onToggleRisk(risk.libelle)}
							className={`cursor-pointer ${sharedClass}`}
						>
							{inner}
						</button>
					) : (
						<div key={risk.libelle} className={sharedClass}>
							{inner}
						</div>
					);
				})}
				<p className="text-slate-600 text-xs leading-relaxed">
					Données indicatives. Consulter georisques.gouv.fr avant toute
					décision.
				</p>
			</div>
		</div>
	);
}

function IsochronePanel() {
	const bands = [
		{ minutes: 5, color: "rgba(34,211,238,0.6)", label: "5 min à pied" },
		{ minutes: 10, color: "rgba(34,211,238,0.4)", label: "10 min à pied" },
		{ minutes: 15, color: "rgba(34,211,238,0.2)", label: "15 min à pied" },
	];

	return (
		<div className="flex flex-col gap-4">
			<p className="text-slate-400 text-xs uppercase tracking-widest">
				Zones accessibles à pied
			</p>
			<div className="flex flex-col gap-2">
				{bands.map(({ minutes, color, label }) => (
					<div key={minutes} className="flex items-center gap-3">
						<span
							className="w-4 h-4 rounded shrink-0 border border-cyan-400/30"
							style={{ backgroundColor: color }}
						/>
						<span className="text-slate-200 text-sm">{label}</span>
						<span className="text-slate-500 text-xs ml-auto">
							≈{Math.round(minutes * 83)} m
						</span>
					</div>
				))}
			</div>
			<p className="text-slate-500 text-xs leading-relaxed">
				Les zones sont calculées en marche à pied depuis l'adresse sélectionnée.
			</p>
		</div>
	);
}

function CityPanel({
	data,
	isLoading,
}: {
	data?: CityData;
	isLoading?: boolean;
}) {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="h-16 rounded-lg bg-slate-800/60 animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (!data) {
		return (
			<p className="text-slate-500 text-sm text-center py-6">
				Informations non disponibles
			</p>
		);
	}

	const density =
		data.superficie && data.population
			? Math.round(data.population / data.superficie)
			: null;

	const noteColor =
		data.noteGlobale == null
			? "text-slate-400"
			: data.noteGlobale >= 7
				? "text-green-400"
				: data.noteGlobale >= 5
					? "text-amber-400"
					: "text-red-400";

	return (
		<div className="flex flex-col gap-4">
			{/* City header */}
			<div className="p-3 rounded-xl glass border border-white/10">
				<p className="text-slate-300 text-xs font-medium mb-0.5">Commune</p>
				<p className="text-white text-lg font-bold">{data.nom}</p>
				<p className="text-slate-400 text-xs">
					{data.codePostal} · {data.nomDepartement} ({data.codeDepartement})
				</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-2">
				<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
					<p className="text-slate-400 text-xs mb-1">Population</p>
					<p className="text-white text-base font-bold">
						{data.population.toLocaleString("fr-FR")}
					</p>
					<p className="text-slate-500 text-xs">habitants</p>
				</div>
				{density && (
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
						<p className="text-slate-400 text-xs mb-1">Densité</p>
						<p className="text-white text-base font-bold">
							{density.toLocaleString("fr-FR")}
						</p>
						<p className="text-slate-500 text-xs">hab/km²</p>
					</div>
				)}
				{data.superficie && (
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
						<p className="text-slate-400 text-xs mb-1">Superficie</p>
						<p className="text-white text-base font-bold">{data.superficie}</p>
						<p className="text-slate-500 text-xs">km²</p>
					</div>
				)}
				{data.noteGlobale != null && (
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
						<p className="text-slate-400 text-xs mb-1">Note globale</p>
						<p className={`text-base font-bold ${noteColor}`}>
							{data.noteGlobale}/10
						</p>
						<p className="text-slate-500 text-xs">qualité de vie</p>
					</div>
				)}
			</div>

			<p className="text-slate-500 text-xs">
				Région : {data.nomRegion} ({data.codeRegion})
			</p>
		</div>
	);
}

const ACCENT_STYLE =
	"glass border border-white/10 text-white ring-1 ring-white/25";

export const ACCENT_ACTIVE: Record<CategoryId, string> = {
	schools: ACCENT_STYLE,
	shops: ACCENT_STYLE,
	transport: ACCENT_STYLE,
	health: ACCENT_STYLE,
	parks: ACCENT_STYLE,
	risks: ACCENT_STYLE,
	isochrone: ACCENT_STYLE,
	city: ACCENT_STYLE,
};

export const PANEL_TITLE_COLOR: Record<CategoryId, string> = {
	schools: "text-white",
	shops: "text-white",
	transport: "text-white",
	health: "text-white",
	parks: "text-white",
	risks: "text-white",
	isochrone: "text-white",
	city: "text-white",
};

export const CATEGORIES: Category[] = [
	{
		id: "schools",
		label: "Écoles",
		icon: <GraduationCap size={20} />,
		accent: "text-white",
		renderPanel: (pois, isLoading, selectedPoiId, onPoiSelect) => (
			<SchoolsPanel
				pois={pois}
				isLoading={isLoading}
				selectedPoiId={selectedPoiId}
				onPoiSelect={onPoiSelect}
			/>
		),
	},
	{
		id: "shops",
		label: "Commerces",
		icon: <ShoppingBag size={20} />,
		accent: "text-white",
		renderPanel: (pois, isLoading, selectedPoiId, onPoiSelect) => (
			<ShopsPanel
				pois={pois}
				isLoading={isLoading}
				selectedPoiId={selectedPoiId}
				onPoiSelect={onPoiSelect}
			/>
		),
	},
	{
		id: "transport",
		label: "Transports",
		icon: <Bus size={20} />,
		accent: "text-white",
		renderPanel: (pois, isLoading, selectedPoiId, onPoiSelect) => (
			<TransportPanel
				pois={pois}
				isLoading={isLoading}
				selectedPoiId={selectedPoiId}
				onPoiSelect={onPoiSelect}
			/>
		),
	},
	{
		id: "health",
		label: "Santé",
		icon: <Heart size={20} />,
		accent: "text-white",
		renderPanel: (pois, isLoading, selectedPoiId, onPoiSelect) => (
			<HealthPanel
				pois={pois}
				isLoading={isLoading}
				selectedPoiId={selectedPoiId}
				onPoiSelect={onPoiSelect}
			/>
		),
	},
	{
		id: "parks",
		label: "Espaces verts",
		icon: <TreePine size={20} />,
		accent: "text-white",
		renderPanel: (pois, isLoading, selectedPoiId, onPoiSelect) => (
			<ParksPanel
				pois={pois}
				isLoading={isLoading}
				selectedPoiId={selectedPoiId}
				onPoiSelect={onPoiSelect}
			/>
		),
	},
	{
		id: "risks",
		label: "Risques & Air",
		icon: <TriangleAlert size={20} />,
		accent: "text-white",
		renderPanel: () => null,
		renderCustomPanel: (data, isLoading) => (
			<RisksPanel data={data} isLoading={isLoading} />
		),
	},
	{
		id: "isochrone",
		label: "Accessibilité",
		icon: <Clock size={20} />,
		accent: "text-white",
		renderPanel: () => <IsochronePanel />,
	},
	{
		id: "city",
		label: "Ville",
		icon: <Building2 size={20} />,
		accent: "text-white",
		renderPanel: () => null,
		renderCustomPanel: (data, isLoading) => (
			<CityPanel data={data as CityData} isLoading={isLoading} />
		),
	},
];

interface FloatingPanelProps {
	activeCategory: CategoryId | null;
	onCategoryChange: (id: CategoryId | null) => void;
}

export function FloatingPanel({
	activeCategory,
	onCategoryChange,
}: FloatingPanelProps) {
	function handleCategoryClick(id: CategoryId) {
		onCategoryChange(activeCategory === id ? null : id);
	}

	return (
		<div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
			{CATEGORIES.map((cat) => {
				const isActive = activeCategory === cat.id;
				return (
					<button
						key={cat.id}
						type="button"
						title={cat.label}
						onClick={() => handleCategoryClick(cat.id)}
						className={`cursor-pointer w-9 h-9 rounded-xl border border-white/10 shadow-lg transition-all flex items-center justify-center glass ${
							isActive
								? `${ACCENT_ACTIVE[cat.id]}`
								: "text-slate-400 hover:text-slate-200"
						}`}
					>
						{cat.icon}
					</button>
				);
			})}
		</div>
	);
}
