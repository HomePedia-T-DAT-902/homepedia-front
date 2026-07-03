import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Bus,
  Clock,
  Euro,
  GraduationCap,
  Heart,
  ShoppingBag,
  TreePine,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import type { CityData } from "../types/city";
import type { CommuneEquipements } from "../types/equipements";
import type { EducationAnnee } from "../types/education";
import type { GeorisquesData } from "../types/georisques";
import type { Poi } from "../types/poi";
import type {
  PrixColumnFeatureCollection,
  PrixHeatFeatureCollection,
} from "../types/prix";
import type { CommuneQualiteAir } from "../types/qualiteAir";
import type { CommuneRisques } from "../types/risques";
import type { SecuriteAnnee } from "../types/securite";
import type { WordCloudEntry } from "../types/reviews";

export type CategoryId =
  | "schools"
  | "shops"
  | "transport"
  | "health"
  | "parks"
  | "risks"
  | "isochrone"
  | "city"
  | "prix";

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
  prix: Euro,
};

const AIR_QUALITY_DAYS: {
  key: keyof CommuneQualiteAir;
  label: string;
  color: string;
}[] = [
  { key: "nb_jours_bon", label: "Bon", color: "bg-sky-400" },
  { key: "nb_jours_moyen", label: "Moyen", color: "bg-amber-300" },
  { key: "nb_jours_degrade", label: "Dégradé", color: "bg-amber-500" },
  { key: "nb_jours_mauvais", label: "Mauvais", color: "bg-red-400" },
  { key: "nb_jours_tres_mauvais", label: "Très mauvais", color: "bg-red-600" },
  {
    key: "nb_jours_extremement_mauvais",
    label: "Extrêmement mauvais",
    color: "bg-red-800",
  },
];

function AirQualitySection({ data }: { data: CommuneQualiteAir }) {
  const days = AIR_QUALITY_DAYS.map((d) => ({
    ...d,
    value: data[d.key] as number | null,
  })).filter((d) => d.value != null);
  const totalDays = days.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        Qualité de l'air{data.annee ? ` · ${data.annee}` : ""}
      </p>
      {data.indice_atmo != null && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <div className="text-3xl font-bold text-sky-400">
            {data.indice_atmo}
          </div>
          <div>
            <p className="text-sky-300 font-semibold text-sm">
              Indice ATMO moyen
            </p>
            <p className="text-sky-400/70 text-xs">
              Moyenne annuelle{data.annee ? ` ${data.annee}` : ""}
            </p>
          </div>
        </div>
      )}
      {totalDays > 0 &&
        days.map((d) => (
          <div key={d.key} className="flex items-center gap-3">
            <span className="text-slate-300 text-xs w-36 shrink-0">
              {d.label}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${d.color}`}
                style={{ width: `${((d.value ?? 0) / totalDays) * 100}%` }}
              />
            </div>
            <span className="text-slate-400 text-xs w-12 text-right shrink-0">
              {d.value} j
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

const RISK_LABELS: {
  key: keyof Omit<CommuneRisques, "code_commune" | "source_annee">;
  label: string;
}[] = [
  { key: "inondation", label: "Inondation" },
  { key: "seisme", label: "Séisme" },
  { key: "mouvement_terrain", label: "Mouvement de terrain" },
  {
    key: "retrait_gonflement_argile",
    label: "Retrait-gonflement des argiles",
  },
  { key: "radon", label: "Radon" },
  { key: "feu_foret", label: "Feu de forêt" },
  { key: "icpe", label: "Risque industriel (ICPE)" },
];

function RisksPanel({
  data,
  isLoading,
}: {
  data?: GeorisquesData;
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

  if (!data || (!data.risques && !data.qualiteAir)) {
    return (
      <p className="text-slate-500 text-sm text-center py-6">
        Aucune donnée disponible
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.qualiteAir && <AirQualitySection data={data.qualiteAir} />}

      {data.risques && (
        <div className="flex flex-col gap-3">
          <p className="text-slate-400 text-xs uppercase tracking-widest">
            Risques recensés
          </p>
          {RISK_LABELS.map(({ key, label }) => {
            const value = data.risques?.[key];
            const colors =
              value === true
                ? {
                    bg: "bg-red-500/10 border-red-500/20",
                    text: "text-red-400",
                    dot: "bg-red-400",
                  }
                : value === false
                  ? {
                      bg: "bg-slate-500/10 border-slate-500/20",
                      text: "text-slate-400",
                      dot: "bg-slate-400",
                    }
                  : {
                      bg: "bg-slate-500/5 border-slate-500/10",
                      text: "text-slate-600",
                      dot: "bg-slate-600",
                    };
            const status =
              value === true
                ? "Présent"
                : value === false
                  ? "Absent"
                  : "Inconnu";

            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border w-full ${colors.bg}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`}
                  />
                  <span className="text-slate-200 text-sm truncate">
                    {label}
                  </span>
                </div>
                <span className={`text-xs font-medium shrink-0 ${colors.text}`}>
                  {status}
                </span>
              </div>
            );
          })}
          <p className="text-slate-600 text-xs leading-relaxed">
            {data.risques.source_annee
              ? `Données ${data.risques.source_annee}. `
              : ""}
            Consulter georisques.gouv.fr avant toute décision.
          </p>
        </div>
      )}
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

function WordCloudSection({ words }: { words: WordCloudEntry[] }) {
  if (words.length === 0) return null;

  const top = [...words].sort((a, b) => b.frequence - a.frequence).slice(0, 30);
  const freqs = top.map((w) => w.frequence);
  const min = Math.min(...freqs);
  const max = Math.max(...freqs);
  const fontSize = (f: number) =>
    max === min ? 16 : 11 + ((f - min) / (max - min)) * 11;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        Ce qu'en disent les habitants
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {top.map((w) => (
          <span
            key={w.mot}
            className="text-slate-200 leading-none"
            style={{ fontSize: `${fontSize(w.frequence)}px` }}
          >
            {w.mot}
          </span>
        ))}
      </div>
    </div>
  );
}

const EQUIPEMENT_LABELS: {
  key: keyof Omit<CommuneEquipements, "code_commune" | "nb_equipements_total">;
  label: string;
}[] = [
  { key: "nb_maternelles", label: "Maternelles" },
  { key: "nb_primaires", label: "Primaires" },
  { key: "nb_creches", label: "Crèches" },
  { key: "nb_colleges", label: "Collèges" },
  { key: "nb_lycees", label: "Lycées" },
  { key: "nb_medecins", label: "Médecins" },
  { key: "nb_pharmacies", label: "Pharmacies" },
  { key: "nb_urgences", label: "Urgences" },
  { key: "nb_supermarches", label: "Supermarchés" },
  { key: "nb_hypermarches", label: "Hypermarchés" },
  { key: "nb_gares", label: "Gares" },
];

function EquipementsSection({ data }: { data: CommuneEquipements }) {
  const items = EQUIPEMENT_LABELS.map((e) => ({
    ...e,
    value: data[e.key],
  })).filter((e) => e.value != null && e.value > 0);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        Équipements
        {data.nb_equipements_total != null
          ? ` · ${data.nb_equipements_total} au total`
          : ""}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40"
          >
            <p className="text-slate-400 text-xs mb-1">{item.label}</p>
            <p className="text-white text-base font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const SECURITE_LABELS: {
  key: keyof Omit<SecuriteAnnee, "annee">;
  label: string;
}[] = [
  { key: "cambriolages_pour_mille", label: "Cambriolages" },
  { key: "violences_pour_mille", label: "Violences" },
  { key: "vols_pour_mille", label: "Vols" },
  { key: "stups_pour_mille", label: "Stupéfiants" },
  { key: "destructions_pour_mille", label: "Dégradations" },
];

function SecuriteSection({ data }: { data: SecuriteAnnee }) {
  const items = SECURITE_LABELS.map((s) => ({
    ...s,
    value: data[s.key],
  })).filter(
    (s): s is { key: typeof s.key; label: string; value: number } =>
      s.value != null,
  );
  if (items.length === 0) return null;
  const maxValue = Math.max(...items.map((i) => i.value), 0.01);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        Sécurité{data.annee ? ` · ${data.annee}` : ""}
        <span className="normal-case text-slate-600"> (‰ habitants)</span>
      </p>
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="text-slate-300 text-xs w-28 shrink-0">
            {item.label}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-slate-400 text-xs w-10 text-right shrink-0">
            {item.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EducationSection({ data }: { data: EducationAnnee }) {
  if (data.bac_taux_reussite == null && data.bac_presents == null) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        Éducation{data.annee ? ` · bac ${data.annee}` : ""}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {data.bac_taux_reussite != null && (
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <p className="text-slate-400 text-xs mb-1">Taux de réussite</p>
            <p className="text-white text-base font-bold">
              {data.bac_taux_reussite}%
            </p>
          </div>
        )}
        {data.bac_presents != null && (
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <p className="text-slate-400 text-xs mb-1">Candidats</p>
            <p className="text-white text-base font-bold">
              {data.bac_presents}
            </p>
          </div>
        )}
      </div>
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
        {(data.codePostal || data.nomDepartement) && (
          <p className="text-slate-400 text-xs">
            {data.codePostal}
            {data.codePostal && data.nomDepartement ? " · " : ""}
            {data.nomDepartement}
            {data.codeDepartement ? ` (${data.codeDepartement})` : ""}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {data.population != null && (
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <p className="text-slate-400 text-xs mb-1">Population</p>
            <p className="text-white text-base font-bold">
              {data.population.toLocaleString("fr-FR")}
            </p>
            <p className="text-slate-500 text-xs">habitants</p>
          </div>
        )}
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

      {data.nomRegion && (
        <p className="text-slate-500 text-xs">
          Région : {data.nomRegion}
          {data.codeRegion ? ` (${data.codeRegion})` : ""}
        </p>
      )}

      {data.wordCloud && data.wordCloud.length > 0 && (
        <WordCloudSection words={data.wordCloud} />
      )}
      {data.equipements && <EquipementsSection data={data.equipements} />}
      {data.securite && <SecuriteSection data={data.securite} />}
      {data.education && <EducationSection data={data.education} />}
    </div>
  );
}

export type PrixViewMode = "points" | "choropleth";

export interface PrixPanelData {
  columnsGeoJson?: PrixColumnFeatureCollection;
  heatmapGeoJson?: PrixHeatFeatureCollection;
  minPrice?: number;
  maxPrice?: number;
  nbPoints?: number;
  nbTransactionsTotal?: number;
  viewMode: PrixViewMode;
  onViewModeChange: (mode: PrixViewMode) => void;
}

function PrixPanel({
  data,
  isLoading,
}: {
  data?: PrixPanelData;
  isLoading?: boolean;
}) {
  if (!data) return null;
  const {
    viewMode,
    onViewModeChange,
    minPrice,
    maxPrice,
    nbPoints,
    nbTransactionsTotal,
  } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-lg glass border border-white/10 p-1 gap-1">
        {(
          [
            { mode: "points", label: "Points" },
            { mode: "choropleth", label: "Dégradé" },
          ] as const
        ).map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={`flex-1 cursor-pointer rounded-md py-1.5 text-xs font-medium transition-colors ${
              viewMode === mode
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      ) : !nbPoints ? (
        <p className="text-slate-500 text-sm text-center py-6">
          Aucune transaction trouvée dans ce rayon
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <p className="text-slate-400 text-xs mb-1">Points</p>
              <p className="text-white text-base font-bold">{nbPoints}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40">
              <p className="text-slate-400 text-xs mb-1">Transactions</p>
              <p className="text-white text-base font-bold">
                {nbTransactionsTotal}
              </p>
            </div>
          </div>

          {minPrice != null && maxPrice != null && (
            <div className="flex flex-col gap-1.5">
              <p className="text-slate-400 text-xs uppercase tracking-widest">
                Prix / m²
              </p>
              <div
                className="h-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, #22c55e, #f59e0b, #ef4444)",
                }}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{Math.round(minPrice).toLocaleString("fr-FR")} €</span>
                <span>{Math.round(maxPrice).toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          )}

          <p className="text-slate-600 text-xs leading-relaxed">
            {viewMode === "points"
              ? "Hauteur = nombre de transactions au point · couleur = prix/m² moyen (vert = abordable, rouge = cher)."
              : "Fondu lissé à partir des points DVF · couleur = prix/m² moyen (vert = abordable, rouge = cher)."}
          </p>
        </>
      )}
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
  prix: ACCENT_STYLE,
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
      <RisksPanel data={data as GeorisquesData} isLoading={isLoading} />
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
  {
    id: "prix",
    label: "Prix",
    icon: <Euro size={20} />,
    accent: "text-white",
    renderPanel: () => null,
    renderCustomPanel: (data, isLoading) => (
      <PrixPanel data={data as PrixPanelData} isLoading={isLoading} />
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
