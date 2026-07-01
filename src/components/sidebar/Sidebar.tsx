import type { Poi } from "../../types/poi";
import { CATEGORIES, type CategoryId } from "../FloatingPanel";

interface Props {
	activeCategory: CategoryId | null;
	onClose: () => void;
	pois?: Poi[];
	isLoading?: boolean;
	extraData?: unknown;
	isExtraLoading?: boolean;
	selectedPoiId?: string | null;
	onPoiSelect?: (poi: Poi) => void;
}

export function Sidebar({
	activeCategory,
	onClose,
	pois,
	isLoading,
	extraData,
	isExtraLoading,
	selectedPoiId,
	onPoiSelect,
}: Props) {
	const activeData = CATEGORIES.find((c) => c.id === activeCategory);

	return (
		<div
			className={`absolute left-[3.75rem] top-4 w-80 z-10 transition-transform duration-300 ease-out ${
				activeData ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			<div className="glass border border-white/10 flex flex-col shadow-2xl rounded-2xl overflow-hidden max-h-[calc(100vh-2rem)]">
				{/* Header */}
				<div className="pt-4 px-4 pb-3 flex items-center justify-between shrink-0">
					{activeData && (
						<>
							<h3 className={`font-semibold text-xl text-white`}>
								{activeData.label}
							</h3>
							<button
								type="button"
								onClick={onClose}
								className="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
								aria-label="Fermer"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									className="w-4 h-4"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18 18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</>
					)}
				</div>

				{/* Panel content */}
				<div className="flex-1 overflow-y-auto py-4 px-4 scrollbar-dark">
					{activeData?.renderCustomPanel
						? activeData.renderCustomPanel(extraData, isExtraLoading)
						: activeData?.renderPanel(
								pois,
								isLoading,
								selectedPoiId,
								onPoiSelect,
							)}
				</div>
			</div>
		</div>
	);
}
