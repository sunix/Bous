# Bous

Exploration technique MVP pour `https://sunix.github.io/bous` :

> afficher sur une carte la position en temps réel des bus de la ligne 46 en direction Gare de l'Est.

## Livrable de cette branche

- une **synthèse technique concrète** sur les APIs RATP / IDF Mobilités
- une **page statique GitHub Pages** (`index.html`) avec :
  - verdict produit
  - tableau comparatif des APIs
  - mapping ligne 46 / direction
  - mini prototype de carte **live-ready**
  - mode démo local sans backend

## Résumé exécutif

### Verdict final

- **Source recommandée pour le MVP : IDF Mobilités / PRIM**
- **RATP Open Data : non retenu** pour des positions véhicules live exploitables
- **Frontend direct GitHub Pages -> API officielle : non recommandé**
- **Architecture MVP recommandée : GitHub Pages + proxy serverless léger**

### Pourquoi

1. Le flux PRIM / IDFM nécessite une **API key**.
2. Exposer cette clé dans le frontend GitHub Pages n'est **pas acceptable**.
3. Le mapping "ligne 46 -> sens Gare de l'Est" demande un **enrichissement GTFS statique**.
4. Le proxy minimal peut :
   - injecter la clé
   - filtrer la ligne 46
   - résoudre la direction
   - normaliser la réponse en JSON simple
   - cacher 10-15 s

## Rapport concret

> Note de méthode : les endpoints officiels `prim.iledefrance-mobilites.fr` et `data.ratp.fr` n'étaient pas résolvables depuis ce sandbox au moment de cette session. Les conclusions ci-dessous s'appuient donc sur des sources publiques vérifiables :
>
> - le projet public `Jouca/IDFM_GTFS-RT`
> - sa configuration d'accès à PRIM
> - son mapping SIRI/GTFS
> - l'URL publique GTFS IDFM référencée dans son code
> - la documentation et les conventions GTFS rappelées dans `ossef/Solution_Factory_IT`

### API candidate — RATP Open Data

| Champ | Valeur |
| --- | --- |
| Support live vehicle positions | **NO** |
| Auth | aucun élément concluant trouvé pour du live bus GPS |
| CORS | non vérifié dans ce sandbox |
| Frontend direct possible | **NO** pour le besoin MVP |
| Supports filtering line 46 | **NO** sur la base des éléments trouvés |
| Supports direction filtering | **NO** sur la base des éléments trouvés |
| Complexity | **2/10** |
| Notes | portail utile surtout pour de la donnée statique / open data, pas comme source retenue pour les positions live des bus RATP |

### API candidate — IDF Mobilités / PRIM

| Champ | Valeur |
| --- | --- |
| Support live vehicle positions | **YES**, via PRIM / SIRI temps réel et documentation GTFS-RT |
| Auth | **API key requise** via header `apiKey` |
| CORS | **non confirmé** depuis ce sandbox |
| Frontend direct possible | **NO** en pratique, car la clé serait exposée côté navigateur |
| Supports filtering line 46 | **YES** |
| Supports direction filtering | **YES**, mais nécessite un mapping fiable GTFS/SIRI |
| Complexity | **7/10** |
| Notes | meilleur candidat objectif pour le MVP |

## Ce qui est objectivement confirmé

### 1) IDFM expose bien du temps réel exploitable

Dans `Jouca/IDFM_GTFS-RT`, le fetcher SIRI-Lite appelle :

`https://prim.iledefrance-mobilites.fr/marketplace/estimated-timetable?LineRef=ALL`

avec les headers :

- `Accept: application/json`
- `Accept-Encoding: gzip`
- `apiKey: ...`

Source : `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/fetchers/SiriLiteFetcher.java`

### 2) Le GTFS statique IDFM est la bonne base d'enrichissement

Le même projet référence le ZIP GTFS IDFM :

`https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/files/a925e164271e4bca93433756d6a340d1/download/`

Source : `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/services/ScheduledTasks.java`

### 3) Le sens utilisateur ne doit pas être déduit naïvement d'un simple label

Le bridge PRIM -> GTFS :

- calcule une direction logique via `DirectionRef`
- retombe sinon sur `DirectionName`
- résout aussi `DestinationRef`

Source : `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/generator/TripUpdateGenerator.java`

Conclusion : pour **"vers Gare de l'Est"**, le mécanisme le plus fiable est :

1. ligne 46
2. `DestinationRef` / `trip_headsign`
3. fallback éventuel `direction_id`

Autrement dit, on est plutôt dans le **cas B (trip-based)** avec enrichissement GTFS, plus robuste qu'un simple filtre textuel brut.

### 4) Les bus RATP sont un cas spécial mais géré

Le bridge public ci-dessus place `RATP-SIV:*` dans une logique dédiée, ce qui montre que :

- les données RATP sont bien présentes côté PRIM
- il faut un traitement spécifique

Source : `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/generator/TripUpdateGenerator.java`

## Mapping ligne 46 — état actuel

### Identifiants

| Élément | Valeur | Statut |
| --- | --- | --- |
| line label UI | `46` | confirmé côté usage |
| route_id GTFS probable | `IDFM:C01046` | **à vérifier** sur `routes.txt` |
| LineRef SIRI probable | `RATP:Line::C01046:LOC` | **à vérifier** sur réponse live |
| opérateur | `RATP-SIV:*` | confirmé comme famille opérateur traitée à part |
| direction utilisateur | `Gare de l'Est` | confirmé côté besoin produit |
| mécanisme de filtrage direction | `DestinationRef -> stop_id -> stop_name/headsign` | recommandé |

### Ce qu'il reste à vérifier en 5 minutes dès qu'une API key PRIM est disponible

1. Télécharger le GTFS IDFM
2. Trouver dans `routes.txt` la ligne dont `route_short_name = 46`
3. Confirmer le `route_id`
4. Trouver dans `trips.txt` le `trip_headsign = Gare de l'Est`
5. Lire `direction_id`
6. Vérifier la vraie valeur `LineRef` renvoyée par PRIM
7. Vérifier le `DestinationRef` terminal côté live

## Réponses aux 6 questions du cadrage

### 1. Peut-on récupérer les positions temps réel des bus RATP ?

**Oui, via IDF Mobilités / PRIM.**

### 2. Peut-on filtrer ligne 46 ?

**Oui.**

Par `LineRef` / `route_id` GTFS.

### 3. Peut-on filtrer direction Gare de l'Est ?

**Oui, mais pas de façon fiable avec une simple string frontend-only.**

Le bon filtrage est :

- ligne 46
- destination / headsign terminal
- éventuellement `direction_id`

### 4. Peut-on afficher ça directement depuis GitHub Pages ?

**Pas proprement avec l'API officielle.**

Raison principale : **API key exposée**.

### 5. Sinon, quel workaround minimal ?

**Cloudflare Worker** ou **Vercel Function** :

- injecte `apiKey`
- appelle PRIM
- enrichit avec GTFS statique pré-calculé
- retourne un JSON minimal
- cache 10-15 secondes

### 6. Quelle stack recommander ?

### Recommandation MVP

- **Frontend** : React + Vite + Leaflet
- **Map** : OpenStreetMap / Leaflet
- **Backend minimal** : Cloudflare Worker
- **Data** :
  - PRIM temps réel
  - GTFS statique IDFM pour routes / trips / headsigns / shapes

## Architecture recommandée

```txt
GitHub Pages (React/Vite/Leaflet)
        |
        v
Cloudflare Worker
  - injecte API key PRIM
  - met en cache 15 s
  - filtre ligne 46
  - résout "Gare de l'Est"
  - renvoie JSON simple
        |
        v
IDF Mobilités PRIM + GTFS statique IDFM
```

## Contrat JSON recommandé pour le proxy

```json
{
  "source": "idfm-proxy",
  "refreshSeconds": 15,
  "line": {
    "label": "46",
    "direction": "Gare de l'Est",
    "routeId": "IDFM:C01046",
    "lineRef": "RATP:Line::C01046:LOC",
    "route": [[48.8442, 2.4341], [48.8481, 2.4092], [48.8471, 2.3962], [48.8674, 2.3638], [48.8768, 2.3592]]
  },
  "vehicles": [
    {
      "id": "RATP:VehicleJourney:example",
      "lat": 48.8569,
      "lon": 2.3854,
      "timestamp": "2026-05-19T05:55:00Z",
      "direction": "Gare de l'Est",
      "nextStopName": "Nation"
    }
  ]
}
```

## Rafraîchissement recommandé

- cible MVP : **15 s**
- acceptable : **10-30 s**
- éviter **5 s** tant que quotas et charge réelle ne sont pas validés

## Prototype livré ici

La page `index.html` de cette branche :

- fonctionne en **mode démo** sans dépendance backend
- permet de brancher un **endpoint JSON proxy** via le champ d'URL
- affiche :
  - carte schématique de Paris Est
  - tracé approximatif de la ligne 46
  - bus direction Gare de l'Est
  - dernière mise à jour
  - verdict architecture

## Sources publiques utilisées

- `https://github.com/Jouca/IDFM_GTFS-RT`
- `https://github.com/ossef/Solution_Factory_IT`
- `https://prim.iledefrance-mobilites.fr/`
- `https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/information/`
- `https://data.ratp.fr/`
