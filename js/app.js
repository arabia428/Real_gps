const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false // Quitamos los controles por defecto
});

// Añadir controles de zoom personalizados
L.control.zoom({
  position: 'bottomleft' // Mover al extremo inferior izquierdo
}).addTo(map);

// Cargar tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let rutaLayer;

navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 10);
  document.getElementById("origen").value = `${lat},${lon}`;
});

// Convertir dirección a coordenadas
async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function calcularRuta() {
  const origen = document.getElementById("origen").value;
  const destino = document.getElementById("destino").value;
  const velocidad = parseFloat(document.getElementById("velocidad").value);
  const tamaño = document.getElementById("tamano").value || 1;

  if (!origen || !destino || isNaN(velocidad)) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const [lat1, lon1] = await geocode(origen);
  const [lat2, lon2] = await geocode(destino);

  const rutaUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

  const res = await fetch(rutaUrl);
  const datos = await res.json();

  const coords = datos.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
  const distanciaKm = datos.routes[0].distance / 1000;
  const tiempoHoras = datos.routes[0].duration / 3600;

  if (rutaLayer) map.removeLayer(rutaLayer);
  rutaLayer = L.polyline(coords, { color: 'blue' }).addTo(map);
  map.fitBounds(rutaLayer.getBounds());

  const horas = Math.floor(tiempoHoras);
  const minutos = Math.round((tiempoHoras - horas) * 60);

  document.getElementById("infoRuta").innerText =
    `Distancia: ${distanciaKm.toFixed(1)} km | Tiempo estimado: ${horas}h ${minutos}min | Tamaño: ${tamaño}`;
}

document.getElementById("btnCalcular").addEventListener("click", calcularRuta);
