// ==== app.js ====
const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false
});
L.control.zoom({
  position: 'bottomleft'
}).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let rutaLayer;

navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const marker = L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 13);
  const origenInput = document.getElementById('origen');

  // Geocodificar para mostrar calle + número + ciudad
  const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await fetch(geocodeUrl);
  const data = await response.json();
  origenInput.value = data.display_name;
});

async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

function formatTiempo(horas) {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h} h ${m} min`;
}

document.getElementById('btnCalcular').addEventListener('click', async e => {
  e.preventDefault();
  const origen = document.getElementById('origen').value;
  const destino = document.getElementById('destino').value;
  const velocidad = parseFloat(document.getElementById('velocidad').value) || 90;
  const altura = parseFloat(document.getElementById('altura')?.value);
  const ancho = parseFloat(document.getElementById('ancho')?.value);
  const largo = parseFloat(document.getElementById('largo')?.value);
  const peso = parseFloat(document.getElementById('peso')?.value);

  if (!origen || !destino) return alert("Falta origen o destino");

  const coordsInicio = await geocode(origen);
  const coordsFin = await geocode(destino);

  const rutaUrl = `https://router.project-osrm.org/route/v1/driving/${coordsInicio[1]},${coordsInicio[0]};${coordsFin[1]},${coordsFin[0]}?overview=full&geometries=geojson`;
  const rutaResp = await fetch(rutaUrl);
  const ruta = await rutaResp.json();

  if (!ruta.routes.length) return alert("No se encontró una ruta.");

  const line = L.geoJSON(ruta.routes[0].geometry, { color: 'blue' });
  if (rutaLayer) map.removeLayer(rutaLayer);
  rutaLayer = line.addTo(map);
  map.fitBounds(line.getBounds());

  const distancia = ruta.routes[0].distance / 1000;
  const tiempo = distancia / velocidad;

  document.getElementById('infoRuta').innerText = `Distancia: ${distancia.toFixed(1)} km\nTiempo estimado: ${formatTiempo(tiempo)}`;
});
