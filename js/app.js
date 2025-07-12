const map = L.map('map', { zoomControl: false }).setView([40.4168, -3.7038], 6);
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let rutaLayer;

// Detectar ubicación y autocompletar origen
navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 10);

  // Obtener dirección
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  document.getElementById("origen").value = data.display_name;
});

async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

function calcularTiempo(distanciaKm, velocidadKmh) {
  const horas = distanciaKm / velocidadKmh;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h} h ${m} min`;
}

document.getElementById('btnCalcular').addEventListener('click', async () => {
  const origenTexto = document.getElementById('origen').value;
  const destinoTexto = document.getElementById('destino').value;
  const velocidad = parseFloat(document.getElementById('velocidad').value);

  if (!origenTexto || !destinoTexto || isNaN(velocidad)) return;

  const [lat1, lon1] = await geocode(origenTexto);
  const [lat2, lon2] = await geocode(destinoTexto);

  if (rutaLayer) map.removeLayer(rutaLayer);

  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`);
  const data = await response.json();

  const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
  const distanciaKm = data.routes[0].distance / 1000;

  rutaLayer = L.polyline(coords, { color: 'blue' }).addTo(map);
  map.fitBounds(rutaLayer.getBounds());

  const tiempo = calcularTiempo(distanciaKm, velocidad);
  document.getElementById("infoRuta").innerHTML = `Distancia: ${distanciaKm.toFixed(1)} km | Tiempo estimado: ${tiempo}`;
});
