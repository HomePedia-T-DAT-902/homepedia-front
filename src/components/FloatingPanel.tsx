import { ACCENT_ACTIVE, CATEGORIES, type CategoryId } from "./categories";

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
