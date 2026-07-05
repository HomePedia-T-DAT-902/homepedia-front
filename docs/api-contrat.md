# Sources de données consommées par le frontend

> Ce document liste **ce que le frontend appelle réellement** : l'API
> `homepedia-api`, la Base Adresse Nationale et les APIs Mapbox.
> La source de vérité des types de réponse est [`src/types/`](../src/types/).

---

## 1. API backend `homepedia-api`

- **Base URL** : `import.meta.env.VITE_API_URL` (vide → appels relatifs `/api/...`,
  routés par le proxy Vite en dev ou Nginx en prod).
- **Préfixe** : tous les endpoints sont sous `/api/v1`.
- **Format** : JSON.
- Client : [`src/api/httpClient.ts`](../src/api/httpClient.ts) — accès via les
  [repositories](../src/repositories/).

| Endpoint | Réponse (type TS) | Repository | Consommé par |
| --- | --- | --- | --- |
| `GET /api/v1/communes/{code}` | `CommuneDetail` | `communeRepository` | `useCityQuery` |
| `GET /api/v1/reviews/{code}` | `ReviewSummary` | `reviewRepository` | `useCityQuery` |
| `GET /api/v1/equipements/{code}` | `CommuneEquipements` | `equipementRepository` | `useCityQuery` |
| `GET /api/v1/securite/{code}` | `CommuneSecurite` | `securiteRepository` | `useCityQuery` |
| `GET /api/v1/education/{code}` | `CommuneEducation` | `educationRepository` | `useCityQuery` |
| `GET /api/v1/risques/{code}` | `CommuneRisques` | `risqueRepository` | `useGeorisquesQuery` |
| `GET /api/v1/qualite-air/{code}` | `CommuneQualiteAir` | `qualiteAirRepository` | `useGeorisquesQuery` |
| `GET /api/v1/risques/geopoints?bbox={minLon,minLat,maxLon,maxLat}&limit=5000` | `RisqueGeopoint[]` | `risqueRepository` | `useRiskPointsQuery` |
| `GET /api/v1/prix/points?bbox={minLon,minLat,maxLon,maxLat}&limit={n}` | `TransactionPoint[]` | `prixRepository` | `usePrixPointsQuery` |

`{code}` = `code_commune` INSEE (5 caractères), issu de l'adresse BAN
(`citycode`).

### Formes de réponse (champs effectivement lus)

```typescript
// types/commune.ts — seuls ces champs sont consommés (useCityQuery)
interface CommuneDetail {
  nom: string;
  code_postal: string | null;
  population: number | null;
  superficie: number | null;
  code_departement: string | null;
  nom_departement: string | null;
  code_region: string | null;
  nom_region: string | null;
}

// types/reviews.ts
interface WordCloudEntry { mot: string; frequence: number; }
interface ReviewSummary {
  note_globale: number | null;
  word_cloud: WordCloudEntry[];
}

// types/equipements.ts — comptages par type
interface CommuneEquipements {
  code_commune: string;
  nb_equipements_total: number | null;
  nb_maternelles: number | null; nb_primaires: number | null; nb_creches: number | null;
  nb_colleges: number | null; nb_lycees: number | null;
  nb_medecins: number | null; nb_pharmacies: number | null; nb_urgences: number | null;
  nb_supermarches: number | null; nb_hypermarches: number | null; nb_gares: number | null;
}

// types/securite.ts — série annuelle (le front lit la dernière année)
interface SecuriteAnnee {
  annee: number;
  cambriolages_pour_mille: number | null; violences_pour_mille: number | null;
  vols_pour_mille: number | null; stups_pour_mille: number | null;
  destructions_pour_mille: number | null;
}
interface CommuneSecurite { historique: SecuriteAnnee[]; }

// types/education.ts — série annuelle (le front lit la dernière année)
interface EducationAnnee {
  annee: number;
  bac_taux_reussite: number | null;
  bac_presents: number | null;
}
interface CommuneEducation { historique: EducationAnnee[]; }

// types/risques.ts — présence de chaque risque (true / false / null)
interface CommuneRisques {
  code_commune: string;
  source_annee: number | null;
  inondation: boolean | null; seisme: boolean | null;
  mouvement_terrain: boolean | null; retrait_gonflement_argile: boolean | null;
  radon: boolean | null; feu_foret: boolean | null; icpe: boolean | null;
}

// types/qualiteAir.ts
interface CommuneQualiteAir {
  annee: number | null; indice_atmo: number | null;
  nb_jours_bon: number | null; nb_jours_moyen: number | null;
  nb_jours_degrade: number | null; nb_jours_mauvais: number | null;
  nb_jours_tres_mauvais: number | null; nb_jours_extremement_mauvais: number | null;
}
```

`RisqueGeopoint` (points de risque cartographiés) et `TransactionPoint` (points DVF,
transformés en colonnes 3D / dégradé par `usePrixPointsQuery`) : voir
[`types/risques.ts`](../src/types/risques.ts) et [`types/prix.ts`](../src/types/prix.ts).

---

## 2. Base Adresse Nationale (BAN)

- **Base URL** : `https://api-adresse.data.gouv.fr` — pas d'authentification.
- Recherche / autocomplétion d'adresse.

| Endpoint | Réponse | Consommé par |
| --- | --- | --- |
| `GET /search/?q={query}&limit=5` | GeoJSON `FeatureCollection` (`BanFeatureCollection`) | `useAddressSearch` |

Le front extrait de chaque feature : `properties.label`, `geometry.coordinates`
(`[lon, lat]`) et `properties.citycode` (le `code_commune`).

---

## 3. APIs Mapbox

Toutes authentifiées par `access_token=VITE_MAPBOX_ACCESS_TOKEN`.

| API | Endpoint | Consommé par |
| --- | --- | --- |
| Search Box (catégories) | `GET /search/searchbox/v1/category/{category}?proximity={lng,lat}&bbox={bbox}&limit=20&language=fr` | `usePoisQuery` |
| Directions Matrix | `GET /directions-matrix/v1/mapbox/{profile}/{coords}?sources=0` | `useRouteDurationsQuery` |
| Directions (marche) | `GET /directions/v5/mapbox/walking/{oLng,oLat};{dLng,dLat}?geometries=geojson` | `useRouteQuery` |
| Isochrone (marche) | `GET /isochrone/v1/mapbox/walking/{lng,lat}?contours_minutes=5,10,15&polygons=true` | `useIsochroneQuery` |

Le fond de carte est rendu par **Mapbox GL JS** via `react-map-gl` (même token).

---

## Gestion d'erreurs

`FetchHttpClient` lève une `Error` (`HTTP {status}: {statusText}`) sur toute réponse
non-`ok`. Les hooks react-query gèrent le `retry` au cas par cas (désactivé pour les
endpoints optionnels : équipements, sécurité, éducation, risques, qualité de l'air).
