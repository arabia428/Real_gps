let rutaLayer;
let distanciaTotal = 0;
let tiempoTotal = 0;
let map;

// Función para inicializar el mapa
function initMap() {
  try {
    // Inicializar mapa
    map = L.map('map', {
      center: [40.4168, -3.7038],
      zoom: 6
    });
    
    // Agregar tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    console.log('Mapa inicializado correctamente');
    
    // Detectar ubicación después de que el mapa esté inicializado
    detectarUbicacion();
    
  } catch (error) {
    console.error('Error al inicializar el mapa:', error);
  }
}

// Función para detectar ubicación
function detectarUbicacion() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      // Agregar marcador de ubicación actual
      L.marker([lat, lon])
        .addTo(map)
        .bindPopup("Tu ubicación actual")
        .openPopup();
      
      // Centrar el mapa en la ubicación
      map.setView([lat, lon], 12);
      
      // Opcional: llenar el campo origen con coordenadas
      document.getElementById('origen').value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      
      console.log('Ubicación detectada:', lat, lon);
    }, (error) => {
      console.log('Error al obtener ubicación:', error.message);
      alert("No se pudo obtener tu ubicación. Puedes ingresar las direcciones manualmente.");
    });
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

// Convertir texto en coordenadas
async function geocode(texto) {
  try {
    // Si ya son coordenadas, las usamos directamente
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(texto.trim())) {
      const [lat, lon] = texto.split(',').map(Number);
      return [lat, lon];
    }
    
    // Buscar dirección usando Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.length === 0) {
      throw new Error('Dirección no encontrada');
    }
    
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (error) {
    console.error('Error en geocodificación:', error);
    throw error;
  }
}

// Calcular ruta con OSRM
async function calcularRuta() {
  const origenTexto = document.getElementById('origen').value.trim();
  const destinoTexto = document.getElementById('destino').value.trim();
  const velocidad = parseInt(document.getElementById('velocidad').value) || 90;

  if (!origenTexto || !destinoTexto) {
    alert("Por favor, introduce tanto el origen como el destino.");
    return;
  }

  try {
    console.log('Calculando ruta...');
    
    // Geocodificar origen y destino
    const [lat1, lon1] = await geocode(origenTexto);
    const [lat2, lon2] = await geocode(destinoTexto);
    
    console.log('Origen:', lat1, lon1);
    console.log('Destino:', lat2, lon2);

    // Solicitar ruta a OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No se encontró una ruta entre los puntos especificados.");
    }

    const route = data.routes[0];
    
    // Convertir coordenadas para Leaflet (intercambiar lon/lat)
    const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);

    // Limpiar ruta anterior
    if (rutaLayer) {
      map.removeLayer(rutaLayer);
    }
    
    // Dibujar nueva ruta
    rutaLayer = L.polyline(coords, { 
      color: "blue", 
      weight: 5,
      opacity: 0.7
    }).addTo(map);
    
    // Ajustar vista para mostrar toda la ruta
    map.fitBounds(rutaLayer.getBounds());

    // Calcular distancia y tiempo
    distanciaTotal = route.distance / 1000; // convertir a km
    tiempoTotal = distanciaTotal / (velocidad * 0.85); // factor de realismo

    // Mostrar información
    document.getElementById('infoRuta').innerHTML = 
      `<strong>Distancia:</strong> ${distanciaTotal.toFixed(1)} km<br>
       <strong>Tiempo estimado:</strong> ${tiempoTotal.toFixed(1)} horas<br>
       <strong>A velocidad:</strong> ${velocidad} km/h`;
    document.getElementById('infoRuta').style.display = 'block';
    
    console.log('Ruta calculada exitosamente');
    
  } catch (error) {
    console.error('Error al calcular ruta:', error);
    alert(`Error al calcular la ruta: ${error.message}`);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar el mapa cuando el DOM esté listo
  initMap();
  
  // Agregar event listener al botón
  document.getElementById('btnCalcular').addEventListener('click', function(e) {
    e.preventDefault();
    calcularRuta();
  });
  
  // Permitir calcular ruta presionando Enter en el campo destino
  document.getElementById('destino').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      calcularRuta();
    }
  });
});

// También inicializar cuando la ventana se cargue completamente
window.addEventListener('load', function() {
  if (!map) {
    initMap();
  }
});
