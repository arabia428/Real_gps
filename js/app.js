// js/app.js

const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false,
});

L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let rutaLayer;

// Localiza al usuario y actualiza campo origen
navigator.geolocation.getCurrentPosition(async pos => {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await response.json();
  const direccion = data.display_name;
  document.getElementById('origen').value = direccion;
  L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
  map.setView([lat, lon], 10);
});

async function geocode(texto) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}`;
  const response = await fetch(url);
  const data = await response.json();
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

function calcularTiempo(distanciaKm, velocidadKmH) {
  const tiempoHoras = distanciaKm / velocidadKmH;
  const horas = Math.floor(tiempoHoras);
  const minutos = Math.round((tiempoHoras - horas) * 60);
  return `${horas} h ${minutos} min`;
}

async function calcularRuta() {
  const origenTexto = document.getElementById('origen').value;
  const destinoTexto = document.getElementById('destino').value;
  const velocidad = parseInt(document.getElementById('velocidad').value);

  const altura = parseFloat(document.getElementById('altura')?.value) || null;
  const anchura = parseFloat(document.getElementById('anchura')?.value) || null;
  const largo = parseFloat(document.getElementById('largo')?.value) || null;
  const peso = parseFloat(document.getElementById('peso')?.value) || null;

  const coordsInicio = await geocode(origenTexto);
  const coordsFin = await geocode(destinoTexto);

  const body = {
    coordinates: [coordsInicio.reverse(), coordsFin.reverse()],
    profile: "driving-hgv",
    format: "geojson"
  };

  if (altura || anchura || largo || peso) {
    body.extra_info = ["weight", "height", "width", "length"];
    body.options = { vehicle_type: "hgv" };
    if (peso) body.options.weight = peso;
    if (altura) body.options.height = altura;
    if (anchura) body.options.width = anchura;
    if (largo) body.options.length = largo;
  }

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "5b3ce3597851110001cf6248"  // API Key pública de demo
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    alert("Error al calcular ruta:\n" + errorText);
    return;
  }

  const ruta = await response.json();

  if (rutaLayer) map.removeLayer(rutaLayer);
  rutaLayer = L.geoJSON(ruta, {
    style: { color: "blue", weight: 5 }
  }).addTo(map);
  map.fitBounds(rutaLayer.getBounds());

  const distancia = ruta.features[0].properties.summary.distance / 1000;
  const estimado = calcularTiempo(distancia, velocidad);

  document.getElementById('infoRuta').innerHTML = `
    <strong>Distancia:</strong> ${distancia.toFixed(2)} km<br>
    <strong>Tiempo estimado:</strong> ${estimado}
  `;
}

document.getElementById('btnCalcular').addEventListener('click', e => {
  e.preventDefault();
  calcularRuta();
});
