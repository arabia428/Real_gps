
const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI4YjE4ZmFmNjZiNjQ1YmViODg4ZjkzYzE2NTNmNDcxIiwiaCI6Im11cm11cjY0In0=";

let userLocation = null;
let rutaLayer;

// Inicializar mapa
const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Obtener ubicación y rellenar origen automáticamente
navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  userLocation = [lon, lat];  // OpenRouteService espera [lon, lat]
  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 10);
  document.getElementById('origen').value = `${lat}, ${lon}`;
}, () => {
  alert("No se pudo obtener tu ubicación.");
});

async function geocode(texto) {
  // Detectar si es coordenada
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(texto.trim())) {
    const [lat, lon] = texto.split(',').map(Number);
    return [lon, lat]; // convertir a [lon, lat]
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
}

async function calcularRuta() {
  const origenTexto = document.getElementById('origen').value;
  const destinoTexto = document.getElementById('destino').value;
  const peso = parseInt(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  const velocidad = parseInt(document.getElementById('velocidad').value);

  if (!destinoTexto) {
    alert("Por favor, introduce un destino.");
    return;
  }

  try {
    const coordsInicio = await geocode(origenTexto);
    const coordsFin = await geocode(destinoTexto);

    const body = {
      coordinates: [coordsInicio, coordsFin],
      profile: "driving-hgv",
      format: "geojson",
      preferences: {
        weight: peso,
        height: altura
      }
    };

    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify(body)
    });

    const ruta = await response.json();

    if (!ruta || !ruta.features || ruta.features.length === 0) {
      throw new Error("No se pudo calcular la ruta. Verifica los datos ingresados.");
    }

    if (rutaLayer) map.removeLayer(rutaLayer);
    rutaLayer = L.geoJSON(ruta, {
      style: { color: "blue", weight: 5 }
    }).addTo(map);
    map.fitBounds(rutaLayer.getBounds());

    const distancia = ruta.features[0].properties.summary.distance / 1000;
    const estimado = distancia / velocidad;
    alert(`Distancia: ${distancia.toFixed(2)} km\nTiempo estimado (teórico): ${(estimado).toFixed(2)} h`);
  } catch (err) {
    console.error("Error al calcular la ruta:", err);
    alert("Error al calcular la ruta. Consulta la consola para más detalles.");
  }
}

document.getElementById('btnCalcular').addEventListener('click', e => {
  e.preventDefault();
  calcularRuta();
});
