let map = L.map('map').setView([40.4168, -3.7038], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

let origenCoords;

navigator.geolocation.getCurrentPosition(pos => {
  origenCoords = [pos.coords.longitude, pos.coords.latitude];
  L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map)
    .bindPopup('Tu ubicación').openPopup();
  map.setView([pos.coords.latitude, pos.coords.longitude], 10);
});

async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const res = await fetch(url);
  const data = await res.json();
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
}

async function calcularRuta() {
  const destinoTexto = document.getElementById('destino').value;
  const velocidad = parseInt(document.getElementById('velocidad').value);
  const destinoCoords = await geocode(destinoTexto);

  const rutaURL = `https://router.project-osrm.org/route/v1/driving/${origenCoords.join(',')};${destinoCoords.join(',')}?overview=full&geometries=geojson`;

  const res = await fetch(rutaURL);
  const data = await res.json();

  const coordsRuta = data.routes[0].geometry;
  const tiempo = data.routes[0].duration / 3600; // horas
  const distancia = data.routes[0].distance / 1000; // km

  if (window.rutaLayer) map.removeLayer(window.rutaLayer);
  window.rutaLayer = L.geoJSON(coordsRuta, { style: { color: 'blue', weight: 4 } }).addTo(map);
  map.fitBounds(window.rutaLayer.getBounds());

  document.getElementById('infoRuta').textContent = `Distancia: ${distancia.toFixed(1)} km | Tiempo estimado: ${tiempo.toFixed(1)} h`;
}

document.getElementById('btnCalcular').addEventListener('click', calcularRuta);
