const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI4YjE4ZmFmNjZiNjQ1YmViODg4ZjkzYzE2NTNmNDcxIiwiaCI6Im11cm11cjY0In0=";

const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let rutaLayer;

navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 10);
});

async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function calcularRuta() {
  const origenTexto = document.getElementById('origen').value;
  const destinoTexto = document.getElementById('destino').value;
  const peso = parseInt(document.getElementById('peso').value);
  const altura = parseFloat(document.getElementById('altura').value);
  const velocidad = parseInt(document.getElementById('velocidad').value);

  const coordsInicio = await geocode(origenTexto);
  const coordsFin = await geocode(destinoTexto);

  const body = {
    coordinates: [coordsInicio.reverse(), coordsFin.reverse()],
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

  if (rutaLayer) map.removeLayer(rutaLayer);
  rutaLayer = L.geoJSON(ruta, {
    style: { color: "blue", weight: 5 }
  }).addTo(map);
  map.fitBounds(rutaLayer.getBounds());

  const distancia = ruta.features[0].properties.summary.distance / 1000;
  const estimado = distancia / velocidad;
  alert(`Distancia: ${distancia.toFixed(2)} km\nTiempo estimado (teórico): ${(estimado).toFixed(2)} h`);
}

document.getElementById('btnCalcular').addEventListener('click', e => {
  e.preventDefault();
  calcularRuta();
});
