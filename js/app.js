// js/app.js

const map = L.map('map', {
  center: [40.4168, -3.7038],
  zoom: 6,
  zoomControl: false,
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

  const altura = parseFloat(document.getElementById('altura')?.value) || undefined;
  const anchura = parseFloat(document.getElementById('anchura')?.value) || undefined;
  const largo = parseFloat(document.getElementById('largo')?.value) || undefined;
  const peso = parseFloat(document.getElementById('peso')?.value) || undefined;

  const coordsInicio = await geocode(origenTexto);
  const coordsFin = await geocode(destinoTexto);

  const body = {
    coordinates: [coordsInicio.reverse(), coordsFin.reverse()],
    profile: "driving-hgv",
    format: "geojson",
    ...(altura || anchura || largo || peso ? {
      extra_info: ["weight", "height", "width", "length"],
      options: {
        vehicle_type: "hgv",
        weight: peso,
        height: altura,
        width: anchura,
        length: largo,
        avoid_features: ["ferries", "tollways", "fords"],
      }
    } : {})
  };

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "5b3ce3597851110001cf6248"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    document.getElementById('infoRuta').innerHTML = `Error al calcular ruta: ${errorText}`;
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

  document.getElementById('infoRuta').innerHTML = `Distancia: ${distancia.toFixed(2)} km<br>Tiempo estimado: ${estimado}`;
}

document.getElementById('btnCalcular').addEventListener('click', e => {
  e.preventDefault();
  calcularRuta();
});
