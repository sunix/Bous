const apiCandidates = [
  {
    name: 'RATP Open Data',
    live: 'NO',
    auth: 'aucun flux live bus confirmé',
    cors: 'YES',
    frontend: 'NO',
    line46: 'NO',
    direction: 'NO',
    complexity: '2/10',
  },
  {
    name: 'IDF Mobilités / PRIM',
    live: 'temps réel oui / GPS à confirmer',
    auth: 'API key via header apiKey',
    cors: 'YES',
    frontend: 'techniquement oui',
    line46: 'YES',
    direction: 'YES',
    complexity: '7/10',
  },
];

const identifiers = [
  {
    label: 'route_id GTFS exact',
    value: 'IDFM:C01087',
    status: 'confirmed',
  },
  {
    label: 'headsign + direction',
    value: "Gare de l'Est / direction_id 0",
    status: 'confirmed',
  },
  {
    label: 'terminus aller',
    value: "IDFM:492185 -> Gare de l'Est",
    status: 'confirmed',
  },
  {
    label: 'famille opérateur',
    value: 'RATP-SIV:*',
    status: 'confirmed',
  },
  {
    label: 'code route externe',
    value: '100100046',
    status: 'confirmed',
  },
  {
    label: 'LineRef live PRIM',
    value: 'à confirmer avec une vraie réponse API',
    status: 'inferred',
  },
];

const architectureSteps = [
  {
    title: '1. GitHub Pages',
    copy: 'frontend statique, UI carte, possibilité technique de fetch navigateur car CORS PRIM est ouvert.',
  },
  {
    title: '2. Worker serverless',
    copy: 'injecte la clé PRIM, filtre la ligne 46, cache 10-15 s, retourne un JSON simple.',
  },
  {
    title: '3. PRIM + GTFS',
    copy: 'temps réel côté PRIM, enrichissement côté GTFS statique IDFM pour la destination et le tracé.',
  },
];

const productDecisions = [
  {
    title: 'Frontend only idéal : non',
    copy: 'Les tests directs montrent que CORS passe, mais une clé PRIM publique dans GitHub Pages reste un mauvais choix produit.',
  },
  {
    title: 'Workaround minimal : oui',
    copy: 'Un Cloudflare Worker suffit pour ce MVP et reste compatible GitHub Pages.',
  },
  {
    title: 'Stack recommandée',
    copy: 'React + Vite + Leaflet côté frontend, Worker côté proxy, GTFS IDFM pour le shape et le headsign.',
  },
];

const verificationFindings = [
  {
    title: 'PRIM global query confirmé',
    copy: "La doc officielle expose GET /estimated-timetable et l'endpoint réel répond bien 401 + www-authenticate: Key sans clé.",
  },
  {
    title: 'CORS PRIM confirmé',
    copy: 'Le préflight répond Access-Control-Allow-Origin: * et Access-Control-Allow-Headers: apiKey.',
  },
  {
    title: 'Quotas confirmés',
    copy: 'La doc PRIM affiche 5 req/s et 1000 req/jour pour les nouveaux comptes sur la global query.',
  },
  {
    title: 'Mapping exact ligne 46',
    copy: "Le GTFS IDFM confirme route_id IDFM:C01087, shape aller IDFM:shp_3_1053, terminus aller IDFM:492185 (Gare de l'Est).",
  },
  {
    title: 'Point encore ouvert',
    copy: 'Les pages API publiques confirment le temps réel stop-based ; le feed GPS brut par véhicule reste à confirmer avec une clé PRIM.',
  },
];

const demoFeed = {
  source: 'demo-static',
  refreshSeconds: 15,
  line: {
    label: '46',
    direction: "Gare de l'Est",
    routeId: 'IDFM:C01087',
    lineRef: 'à confirmer via PRIM',
    shapeId: 'IDFM:shp_3_1053',
    directionId: 0,
    terminalStopId: 'IDFM:492185',
    route: [
      [48.844097, 2.440368],
      [48.840515, 2.435347],
      [48.834618, 2.418704],
      [48.835091, 2.408263],
      [48.839188, 2.396657],
      [48.847347, 2.386773],
      [48.857639, 2.380206],
      [48.862251, 2.376771],
      [48.872639, 2.36984],
      [48.878365, 2.370566],
      [48.875801, 2.360263],
      [48.875843, 2.358039],
    ],
    stops: [
      { name: 'Château de Vincennes', lat: 48.844146, lon: 2.440378 },
      { name: 'Porte Dorée', lat: 48.835328, lon: 2.407844 },
      { name: 'Daumesnil - Félix Éboué', lat: 48.839052, lon: 2.397107 },
      { name: 'Reuilly - Diderot', lat: 48.847068, lon: 2.38708 },
      { name: 'Voltaire - Léon Blum', lat: 48.858329, lon: 2.380228 },
      { name: 'Goncourt', lat: 48.870323, lon: 2.370911 },
      { name: 'Louis Blanc', lat: 48.880839, lon: 2.364702 },
      { name: "Gare de l'Est", lat: 48.875759, lon: 2.358165 },
    ],
  },
  vehicles: [
    {
      id: 'demo-46-1',
      lat: 48.847347,
      lon: 2.386773,
      timestamp: '2026-05-19T05:55:00Z',
      direction: "Gare de l'Est",
      nextStopName: 'Reuilly - Diderot',
      delayMinutes: 1,
    },
    {
      id: 'demo-46-2',
      lat: 48.862251,
      lon: 2.376771,
      timestamp: '2026-05-19T05:55:08Z',
      direction: "Gare de l'Est",
      nextStopName: 'Parmentier - République',
      delayMinutes: 0,
    },
    {
      id: 'demo-46-3',
      lat: 48.875801,
      lon: 2.360263,
      timestamp: '2026-05-19T05:55:12Z',
      direction: "Gare de l'Est",
      nextStopName: "Gare de l'Est",
      delayMinutes: 0,
    },
  ],
};

const mapBounds = {
  minLat: 48.832,
  maxLat: 48.883,
  minLon: 2.338,
  maxLon: 2.442,
  width: 800,
  height: 560,
  padding: 46,
};

const els = {
  comparison: document.querySelector('#api-comparison'),
  identifiers: document.querySelector('#identifier-grid'),
  architecture: document.querySelector('#architecture-cards'),
  decisions: document.querySelector('#decisions'),
  verifications: document.querySelector('#verification-list'),
  feedForm: document.querySelector('#feed-form'),
  feedInput: document.querySelector('#feed-url'),
  resetFeed: document.querySelector('#reset-feed'),
  dataSource: document.querySelector('#data-source'),
  refreshRate: document.querySelector('#refresh-rate'),
  proxyNote: document.querySelector('#proxy-note'),
  modeBadge: document.querySelector('#mode-badge'),
  vehicleCount: document.querySelector('#vehicle-count'),
  lastUpdated: document.querySelector('#last-updated'),
  activeDirection: document.querySelector('#active-direction'),
  vehicleDetails: document.querySelector('#vehicle-details'),
  routeLayer: document.querySelector('#route-layer'),
  stopLayer: document.querySelector('#stop-layer'),
  vehicleLayer: document.querySelector('#vehicle-layer'),
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let activeFeedUrl = '';
let currentFeed = clone(demoFeed);
let refreshTimer = null;
let selectedVehicleId = null;

function renderStaticContent() {
  els.comparison.innerHTML = apiCandidates
    .map(
      (candidate) => `
        <tr>
          <td><strong>${candidate.name}</strong></td>
          <td>${candidate.live}</td>
          <td>${candidate.auth}</td>
          <td>${candidate.cors}</td>
          <td>${candidate.frontend}</td>
          <td>${candidate.line46}</td>
          <td>${candidate.direction}</td>
          <td>${candidate.complexity}</td>
        </tr>`,
    )
    .join('');

  els.verifications.innerHTML = verificationFindings
    .map(
      (item) => `
        <div class="decision-item">
          <strong>${item.title}</strong>
          <p>${item.copy}</p>
        </div>`,
    )
    .join('');

  els.identifiers.innerHTML = identifiers
    .map(
      (item) => `
        <div class="pill-card">
          <strong>${item.label}</strong>
          <span>${item.value}</span>
          <span class="status-chip status-${item.status}">
            ${item.status === 'confirmed' ? 'confirmé' : 'à vérifier'}
          </span>
        </div>`,
    )
    .join('');

  els.architecture.innerHTML = architectureSteps
    .map(
      (item) => `
        <div class="architecture-card">
          <strong>${item.title}</strong>
          <span>${item.copy}</span>
        </div>`,
    )
    .join('');

  els.decisions.innerHTML = productDecisions
    .map(
      (item) => `
        <div class="decision-item">
          <strong>${item.title}</strong>
          <p>${item.copy}</p>
        </div>`,
    )
    .join('');
}

function projectPoint(lat, lon) {
  const x =
    mapBounds.padding +
    ((lon - mapBounds.minLon) / (mapBounds.maxLon - mapBounds.minLon)) *
      (mapBounds.width - mapBounds.padding * 2);
  const y =
    mapBounds.height -
    mapBounds.padding -
    ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) *
      (mapBounds.height - mapBounds.padding * 2);

  return { x, y };
}

function createSvgNode(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function renderMap(feed) {
  els.routeLayer.innerHTML = '';
  els.stopLayer.innerHTML = '';
  els.vehicleLayer.innerHTML = '';

  const routePoints = (feed.line.route || []).map(([lat, lon]) => projectPoint(lat, lon));
  const routePath = routePoints.map(({ x, y }) => `${x},${y}`).join(' ');

  if (routePath) {
    els.routeLayer.appendChild(
      createSvgNode('polyline', {
        class: 'route-shadow',
        points: routePath,
      }),
    );
    els.routeLayer.appendChild(
      createSvgNode('polyline', {
        class: 'route-path',
        points: routePath,
      }),
    );
  }

  (feed.line.stops || []).forEach((stop) => {
    const point = projectPoint(stop.lat, stop.lon);
    els.stopLayer.appendChild(
      createSvgNode('circle', {
        class: 'stop-dot',
        cx: point.x,
        cy: point.y,
        r: 6,
      }),
    );
    const label = createSvgNode('text', {
      class: 'map-label',
      x: point.x + 10,
      y: point.y - 10,
    });
    label.textContent = stop.name;
    els.stopLayer.appendChild(label);
  });

  feed.vehicles.forEach((vehicle) => {
    const point = projectPoint(vehicle.lat, vehicle.lon);
    const group = createSvgNode('g', { class: 'vehicle-node', tabindex: '0' });
    group.dataset.vehicleId = vehicle.id;

    const marker = createSvgNode('circle', {
      class: `vehicle-marker${vehicle.id === selectedVehicleId ? ' active' : ''}`,
      cx: point.x,
      cy: point.y,
      r: 15,
    });

    const label = createSvgNode('text', {
      class: 'vehicle-label',
      x: point.x - 7.5,
      y: point.y + 6,
    });
    label.textContent = '🚌';

    group.append(marker, label);
    group.addEventListener('click', () => selectVehicle(vehicle.id));
    group.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectVehicle(vehicle.id);
      }
    });
    els.vehicleLayer.appendChild(group);
  });
}

function selectVehicle(vehicleId) {
  selectedVehicleId = vehicleId;
  renderMap(currentFeed);
  const vehicle = currentFeed.vehicles.find((item) => item.id === vehicleId);

  if (!vehicle) {
    els.vehicleDetails.textContent = 'Aucun détail disponible.';
    return;
  }

  const dateLabel = formatDate(vehicle.timestamp);
  els.vehicleDetails.innerHTML = `
    <strong>Bus ${currentFeed.line.label} -> ${vehicle.direction || currentFeed.line.direction}</strong><br>
    id véhicule : <code>${vehicle.id}</code><br>
    prochaine étape : <strong>${vehicle.nextStopName || 'n/a'}</strong><br>
    retard estimé : <strong>${vehicle.delayMinutes ?? 0} min</strong><br>
    horodatage : <strong>${dateLabel}</strong>
  `;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

function normalizeFeed(payload) {
  const line = payload.line || {};
  const vehicles = Array.isArray(payload.vehicles) ? payload.vehicles : [];

  return {
    source: payload.source || 'custom-feed',
    refreshSeconds: payload.refreshSeconds || 15,
    line: {
      label: line.label || '46',
      direction: line.direction || "Gare de l'Est",
        routeId: line.routeId || 'IDFM:C01087',
        lineRef: line.lineRef || 'à confirmer via PRIM',
        route: Array.isArray(line.route) ? line.route : demoFeed.line.route,
        stops: Array.isArray(line.stops) ? line.stops : demoFeed.line.stops,
      },
    vehicles: vehicles
      .filter((vehicle) => Number.isFinite(vehicle.lat) && Number.isFinite(vehicle.lon))
      .map((vehicle) => ({
        id: vehicle.id || `vehicle-${Math.random().toString(36).slice(2, 8)}`,
        lat: vehicle.lat,
        lon: vehicle.lon,
        timestamp: vehicle.timestamp || new Date().toISOString(),
        direction: vehicle.direction || line.direction || "Gare de l'Est",
        nextStopName: vehicle.nextStopName || null,
        delayMinutes: vehicle.delayMinutes ?? 0,
      })),
  };
}

async function loadFeed() {
  if (!activeFeedUrl) {
    currentFeed = clone(demoFeed);
    updateUiFromFeed();
    return;
  }

  try {
    const response = await fetch(activeFeedUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    currentFeed = normalizeFeed(payload);
    els.modeBadge.textContent = 'mode proxy';
    els.dataSource.textContent = `Source : ${currentFeed.source}`;
    updateUiFromFeed();
  } catch (error) {
    currentFeed = clone(demoFeed);
    els.modeBadge.textContent = 'fallback démo';
    els.dataSource.textContent = `Source : fallback démo (${error.message})`;
    updateUiFromFeed();
  }
}

function updateUiFromFeed() {
  const lastTimestamp = currentFeed.vehicles
    .map((vehicle) => vehicle.timestamp)
    .sort()
    .at(-1);

  els.vehicleCount.textContent = String(currentFeed.vehicles.length);
  els.lastUpdated.textContent = formatDate(lastTimestamp);
  els.activeDirection.textContent = currentFeed.line.direction;
  els.refreshRate.textContent = `Refresh : ${currentFeed.refreshSeconds} s`;
  els.proxyNote.textContent = activeFeedUrl
    ? 'Proxy JSON branché'
    : 'Proxy officiel recommandé pour PRIM';

  if (!selectedVehicleId && currentFeed.vehicles[0]) {
    selectedVehicleId = currentFeed.vehicles[0].id;
  }

  renderMap(currentFeed);
  if (selectedVehicleId) {
    selectVehicle(selectedVehicleId);
  }
}

function scheduleRefresh() {
  window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(loadFeed, currentFeed.refreshSeconds * 1000);
}

function setFeedUrl(nextUrl) {
  activeFeedUrl = nextUrl || '';
  if (activeFeedUrl) {
    localStorage.setItem('bous.feedUrl', activeFeedUrl);
  } else {
    localStorage.removeItem('bous.feedUrl');
  }
  els.feedInput.value = activeFeedUrl;
  loadFeed().then(scheduleRefresh);
}

function bindEvents() {
  els.feedForm.addEventListener('submit', (event) => {
    event.preventDefault();
    setFeedUrl(els.feedInput.value.trim());
  });

  els.resetFeed.addEventListener('click', () => {
    setFeedUrl('');
  });
}

function bootstrap() {
  renderStaticContent();
  bindEvents();

  const queryFeed = new URLSearchParams(window.location.search).get('feed');
  const storedFeed = localStorage.getItem('bous.feedUrl');
  const initialFeed = queryFeed || storedFeed || '';
  setFeedUrl(initialFeed);
}

bootstrap();
