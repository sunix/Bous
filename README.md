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
- **Frontend direct GitHub Pages -> API officielle : techniquement possible, mais non recommandé**
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

> Mise à jour après investigation directe : les portails officiels sont maintenant joignables depuis le sandbox. Le rapport ci-dessous combine :
>
> - appels HTTP directs sur `prim.iledefrance-mobilites.fr`
> - extraction du GTFS officiel IDFM
> - inspection du catalogue RATP Open Data
> - recoupement avec `Jouca/IDFM_GTFS-RT`

### API candidate — RATP Open Data

| Champ | Valeur |
| --- | --- |
| Support live vehicle positions | **NO** |
| Auth | aucun élément concluant trouvé pour du live bus GPS |
| CORS | **YES** sur l'API catalogue OpenDataSoft |
| Frontend direct possible | **NO** pour le besoin MVP |
| Supports filtering line 46 | **NO** sur la base des éléments trouvés |
| Supports direction filtering | **NO** sur la base des éléments trouvés |
| Complexity | **2/10** |
| Notes | le catalogue `data.ratp.fr/api/explore/v2.1/catalog/datasets` renvoie 25 datasets, sans dataset de positions véhicules live détecté |

### API candidate — IDF Mobilités / PRIM

| Champ | Valeur |
| --- | --- |
| Support live vehicle positions | **PARTIAL** — temps réel stop-based confirmé, GPS véhicule brut non confirmé publiquement dans cette passe |
| Auth | **API key requise** via header `apiKey` |
| CORS | **YES** confirmé : `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: apiKey` |
| Frontend direct possible | **YES techniquement / NO recommandé** |
| Supports filtering line 46 | **YES** |
| Supports direction filtering | **YES**, mais nécessite un mapping fiable GTFS/SIRI |
| Complexity | **7/10** |
| Notes | meilleur candidat objectif pour le MVP ; la clé resterait publique dans le navigateur |

## Ce qui est objectivement confirmé

### 1) IDFM expose bien du temps réel exploitable

La page PRIM officielle `idfm-ivtr-requete_globale` documente explicitement :

- endpoint `GET /estimated-timetable`
- format SIRI Lite
- quotas nouveaux comptes : **5 req/s** et **1000 req/jour**

En appel HTTP direct sans clé, l'endpoint répond :

- `401 Unauthorized`
- `www-authenticate: Key`

Le projet `Jouca/IDFM_GTFS-RT` confirme en plus l'usage du header :

- `apiKey: ...`

Endpoint observé :

`https://prim.iledefrance-mobilites.fr/marketplace/estimated-timetable?LineRef=ALL`

Headers utiles confirmés :

- `Accept: application/json`
- `Accept-Encoding: gzip`
- `apiKey: ...`

Sources :

- `https://prim.iledefrance-mobilites.fr/en/apis/idfm-ivtr-requete_globale`
- `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/fetchers/SiriLiteFetcher.java`

Ce qui est **officiellement confirmé** dans cette passe est donc :

- du **temps réel de prochains passages**
- exploitable pour filtrer une ligne et une direction

Ce qui reste **à confirmer avec une clé PRIM** :

- un feed public donnant les **coordonnées GPS brutes** de chaque bus
- ou, à défaut, s'il faut reconstituer la position à partir des prochains arrêts

### 2) Le GTFS statique IDFM est la bonne base d'enrichissement

Le portail officiel IDFM décrit le GTFS comme :

- mis à jour **3 fois par jour**
- couvrant les **30 prochains jours**

Le ZIP GTFS officiel téléchargé pour cette vérification est :

`https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/files/a925e164271e4bca93433756d6a340d1/download/`

Sources :

- `https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/information/`
- `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/services/ScheduledTasks.java`

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

### 4) Le CORS PRIM est confirmé, mais ne suffit pas à autoriser un frontend-only

Préflight `OPTIONS` direct sur `estimated-timetable` avec :

- `Origin: https://sunix.github.io`
- `Access-Control-Request-Headers: apiKey`

Réponse observée :

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: apiKey`
- `Access-Control-Allow-Methods: GET,OPTIONS`

Conclusion :

- **le navigateur peut techniquement appeler PRIM**
- **mais la clé serait exposée**, donc ce n'est pas le bon design produit

### 5) Les bus RATP sont un cas spécial mais géré

Le bridge public ci-dessus place `RATP-SIV:*` dans une logique dédiée, ce qui montre que :

- les données RATP sont bien présentes côté PRIM
- il faut un traitement spécifique

Source : `Jouca/IDFM_GTFS-RT/src/main/java/org/jouca/idfm_gtfs_rt/generator/TripUpdateGenerator.java`

## Mapping ligne 46 — état actuel

### Identifiants

| Élément | Valeur | Statut |
| --- | --- | --- |
| line label UI | `46` | confirmé côté usage |
| route_id GTFS exact | `IDFM:C01087` | **confirmé** dans `routes.txt` |
| agency_id | `IDFM:Operator_100` | **confirmé** |
| agency_name | `RATP` | **confirmé** |
| code route externe | `100100046` (`Netex_PrivateCode`) | **confirmé** |
| code route source | `FR1:Line:C01087:` | **confirmé** |
| LineRef SIRI exact | à confirmer sur réponse live PRIM | **reste à vérifier** |
| opérateur | `RATP-SIV:*` | confirmé comme famille opérateur traitée à part |
| direction utilisateur | `Gare de l'Est` | confirmé côté besoin produit |
| headsign aller | `Gare de l'Est` | **confirmé** |
| direction_id aller | `0` | **confirmé** |
| shape_id aller | `IDFM:shp_3_1053` | **confirmé** |
| premier arrêt aller | `IDFM:427755` — `Château de Vincennes` | **confirmé** |
| terminus aller | `IDFM:492185` — `Gare de l'Est` | **confirmé** |
| headsign retour | `Château de Vincennes` | **confirmé** |
| direction_id retour | `1` | **confirmé** |
| shape_id retour | `IDFM:shp_3_4469` | **confirmé** |
| premier arrêt retour | `IDFM:474147` — `Gare de l'Est` | **confirmé** |
| terminus retour | `IDFM:21174` — `Château de Vincennes` | **confirmé** |
| mécanisme de filtrage direction | `route_id + trip_headsign + direction_id + DestinationRef` | recommandé |

### Ce qu'il reste à vérifier avec une API key PRIM

1. Lire la vraie valeur `LineRef` renvoyée par PRIM pour la ligne 46
2. Vérifier le `DestinationRef` exact pour le sens `Gare de l'Est`
3. Vérifier si l'API souhaitée livre de vraies coordonnées véhicule ou seulement du SIRI stop-based
4. Mesurer le payload réel et ajuster le cache Worker à 10-15 s

## Réponses aux 6 questions du cadrage

### 1. Peut-on récupérer les positions temps réel des bus RATP ?

**Pas encore démontré de façon complète pour du vrai GPS véhicule.**

Ce qui est confirmé :

- **oui pour du temps réel stop-based** via PRIM
- **oui pour un MVP de suivi** si l'on accepte une position dérivée / interpolée
- **GPS brut par véhicule : à confirmer** avec une vraie clé PRIM

### 2. Peut-on filtrer ligne 46 ?

**Oui.**

Par `LineRef` / `route_id` GTFS.

### 3. Peut-on filtrer direction Gare de l'Est ?

**Oui, et on a maintenant le mapping GTFS fiable pour le faire.**

Le bon filtrage est :

- `route_id = IDFM:C01087`
- `trip_headsign = Gare de l'Est`
- `direction_id = 0`
- terminal observé côté GTFS = `IDFM:492185`

### 4. Peut-on afficher ça directement depuis GitHub Pages ?

**Oui techniquement, mais non proprement pour une app publique.**

Raisons :

- CORS PRIM est OK
- mais la **clé API serait exposée**
- donc direct browser call = possible en dev, **pas acceptable en prod**

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
    "routeId": "IDFM:C01087",
    "lineRef": "to-confirm-from-prim",
    "shapeId": "IDFM:shp_3_1053",
    "directionId": 0,
    "terminalStopId": "IDFM:492185",
    "route": [[48.844097, 2.440368], [48.847347, 2.386773], [48.872639, 2.36984], [48.875843, 2.358039]]
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
- `https://prim.iledefrance-mobilites.fr/en/apis/idfm-ivtr-requete_globale`
- `https://prim.iledefrance-mobilites.fr/en/apis/idfm-ivtr-requete_ligne`
- `https://prim.iledefrance-mobilites.fr/en/apis/idfm-ivtr-requete_unitaire`
- `https://prim.iledefrance-mobilites.fr/fr/jeux-de-donnees/perimetre-des-donnees-tr-disponibles-plateforme-idfm`
- `https://data.iledefrance-mobilites.fr/explore/dataset/offre-horaires-tc-gtfs-idfm/information/`
- `https://data.ratp.fr/`
