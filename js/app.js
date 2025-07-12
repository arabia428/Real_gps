
let rutaLayer;

// Inicializar mapa
const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Obtener ubicación y ponerla como origen automáticamente
navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 12);
  document.getElementById('origen').value = `${lat}, ${lon}`;
}, () => {
  alert("No se pudo obtener tu ubicación.");
});

async function geocode(texto) {
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(texto.trim())) {
    const [lat, lon] = texto.split(',').map(Number);
    return [lat, lon];
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function calcularRuta() {
  const origenTexto = document.getElementById('origen').value;
  const destinoTexto = document.getElementById('destino').value;
  const velocidad = parseInt(document.getElementById('velocidad').value);

  if (!destinoTexto) {
    alert("Por favor, introduce un destino.");
    return;
  }

  try {
    const [lat1, lon1] = await geocode(origenTexto);
    const [lat2, lon2] = await geocode(destinoTexto);

    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No se pudo calcular la ruta.");
    }

    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    if (rutaLayer) map.removeLayer(rutaLayer);
    rutaLayer = L.polyline(coords, { color: "blue", weight: 5 }).addTo(map);
    map.fitBounds(rutaLayer.getBounds());

    const distancia = route.distance / 1000;
    const tiempo = distancia / velocidad;

    alert(`Distancia: ${distancia.toFixed(2)} km\nTiempo estimado: ${tiempo.toFixed(2)} h`);
  } catch (err) {
    console.error(err);
    alert("Error al calcular la ruta.");
  }
}

document.getElementById('btnCalcular').addEventListener('click', e => {
  e.preventDefault();
  calcularRuta();
});
