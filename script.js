const map = L.map('map', {
  zoomControl: false,
  minZoom: 2
}).setView([41.8239, -71.4128], 12);

map.getContainer().style.borderRadius = '500px';
map.getContainer().style.overflow = 'hidden';

L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);

let squarePixelIcon = L.divIcon({
  className: 'leaflet-pixel-icon',
  iconSize: [10, 10],
  iconAnchor: [0, 0],
  html: '<div style="width: 10px; height: 10px; background-color: red;"></div>'
});

let markers = [];
let currentIconColor = 'red';
let lastClickedLatLng = null;

function showRandomPinAndColor() {
  const pinOverlay = document.querySelector('.pin_overlay');
  const pinButtons = document.querySelectorAll('.choose_pin');
  const commentContainers = document.querySelectorAll('.comment_container > div');
  const addButtonElement = document.getElementById('add');

  if (!pinOverlay) {
    console.error("pinOverlay element not found");
    return;
  }

  pinOverlay.style.display = 'block';
  addButtonElement.style.display = 'none';

  const randomIndex = Math.floor(Math.random() * pinButtons.length);
  const randomButton = pinButtons[randomIndex];

  commentContainers.forEach(container => {
    container.style.display = 'none';
  });

  const pinType = randomButton.classList.contains('pin1') ? 'pin_1' :
    randomButton.classList.contains('pin2') ? 'pin_2' :
    randomButton.classList.contains('pin3') ? 'pin_3' :
    randomButton.classList.contains('pin4') ? 'pin_4' : '';

  if (pinType) {
    const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
    if (selectedContainer) {
      selectedContainer.style.display = 'block';
    }
  }

  if (randomButton.classList.contains('pin1')) {
    pinOverlay.style.backgroundColor = '#00EF1C';
    currentIconColor = '#00EF1C';
  } else if (randomButton.classList.contains('pin2')) {
    pinOverlay.style.backgroundColor = '#00F8EC';
    currentIconColor = '#00F8EC';
  } else if (randomButton.classList.contains('pin3')) {
    pinOverlay.style.backgroundColor = '#ff9f04';
    currentIconColor = '#ff9f04';
  } else if (randomButton.classList.contains('pin4')) {
    pinOverlay.style.backgroundColor = '#FFC1F6';
    currentIconColor = '#FFC1F6';
  }

  squarePixelIcon = L.divIcon({
    className: 'leaflet-pixel-icon',
    iconSize: [10, 10],
    iconAnchor: [0, 0],
    html: `<div style="width: 10px; height: 10px; background-color: ${currentIconColor};"></div>`
  });
}
document.querySelector('.about').addEventListener('click', () => {
  const overlay = document.querySelector('.about_overlay');
  const button = document.querySelector('.about');

  const isHidden = (overlay.style.display === 'none' || overlay.style.display === '');

  overlay.style.display = isHidden ? 'block' : 'none';
  button.textContent = isHidden ? '✕' : 'ABOUT';
});


map.on('click', function (e) {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  lastClickedLatLng = e.latlng;
  showRandomPinAndColor();

  const newMarker = L.marker(e.latlng, { icon: squarePixelIcon }).addTo(map);
  markers.push(newMarker);
});

document.addEventListener('DOMContentLoaded', function () {
  const addButton = document.getElementById('add');
  const pinOverlay = document.querySelector('.pin_overlay');
  const closeButton = document.querySelector('.close_pin_overlay');
  const pinButtons = document.querySelectorAll('.choose_pin');
  const commentContainers = document.querySelectorAll('.comment_container > div');
  const sendCommentButton = document.querySelector('.send_comment');

  const toggle = document.getElementById('toggle-map');
const changeSpan = document.querySelector('.change');
const mapEl = document.getElementById('map');

  // Start with map visible
  mapEl.style.display = 'block';
  addButton.style.display = 'block';
  changeSpan.setAttribute('data-text', 'Hide Map');

  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      // Show map, update label
      mapEl.style.display = 'block';
      addButton.style.display = 'block';
      changeSpan.setAttribute('data-text', 'Hide Map');
    } else {
      // Hide map, update label
      mapEl.style.display = 'none';
      addButton.style.display = 'none';
      changeSpan.setAttribute('data-text', 'Show Map');
    }
  });

  function makeDraggable(el) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
  
    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      document.body.style.userSelect = 'none';
    });
  
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top = (e.clientY - offsetY) + 'px';
      }
    });
  
    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.userSelect = 'auto';
    });
  }
  
  if (pinOverlay) {
    makeDraggable(pinOverlay);
  }

  sendCommentButton.disabled = true;
  sendCommentButton.classList.add('disabled');

  if (addButton && pinOverlay) {
    addButton.addEventListener('click', showRandomPinAndColor);
  }

  if (closeButton) {
    closeButton.addEventListener('click', function () {
      pinOverlay.style.display = 'none';
      commentContainers.forEach(container => {
        container.style.display = 'none';
      });
      addButton.style.display = 'block';
      markers.forEach(marker => map.removeLayer(marker));
      markers = [];
      lastClickedLatLng = null;
    });
  }

  function checkInputs(container) {
    const textarea = container.querySelector('textarea');
    const input1 = container.querySelector('input[type="text"]');
    const input2 = container.querySelector('.q3');
    return textarea.value.trim() !== '' && input1.value.trim() !== '' && input2.value.trim() !== '';
  }

  function updateSendButtonState(containerElement) {
    if (checkInputs(containerElement)) {
      sendCommentButton.disabled = false;
      sendCommentButton.classList.remove('disabled');
    } else {
      sendCommentButton.disabled = true;
      sendCommentButton.classList.add('disabled');
    }
  }

  pinButtons.forEach(button => {
    button.addEventListener('click', function () {
      const pinType = this.classList.contains('pin1') ? 'pin_1' :
        this.classList.contains('pin2') ? 'pin_2' :
        this.classList.contains('pin3') ? 'pin_3' :
        this.classList.contains('pin4') ? 'pin_4' : '';

      commentContainers.forEach(container => {
        container.style.display = 'none';
      });

      if (pinType) {
        const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
        if (selectedContainer) {
          selectedContainer.style.display = 'block';
          updateSendButtonState(selectedContainer);

          const textarea = selectedContainer.querySelector('textarea');
          const input1 = selectedContainer.querySelector('input[type="text"]');
          const input2 = selectedContainer.querySelector('.q3');

          textarea.addEventListener('input', () => updateSendButtonState(selectedContainer));
          input1.addEventListener('input', () => updateSendButtonState(selectedContainer));
          input2.addEventListener('input', () => updateSendButtonState(selectedContainer));
        }
      }

      if (this.classList.contains('pin1')) {
        pinOverlay.style.backgroundColor = '#00EF1C';
        currentIconColor = '#00EF1C';
      } else if (this.classList.contains('pin2')) {
        pinOverlay.style.backgroundColor = '#00F8EC';
        currentIconColor = '#00F8EC';
      } else if (this.classList.contains('pin3')) {
        pinOverlay.style.backgroundColor = '#ff9f04';
        currentIconColor = '#ff9f04';
      } else if (this.classList.contains('pin4')) {
        pinOverlay.style.backgroundColor = '#FFC1F6';
        currentIconColor = '#FFC1F6';
      }

      squarePixelIcon = L.divIcon({
        className: 'leaflet-pixel-icon',
        iconSize: [10, 10],
        iconAnchor: [0, 0],
        html: `<div style="width: 10px; height: 10px; background-color: ${currentIconColor};"></div>`
      });

      markers.forEach(marker => {
        marker.setIcon(squarePixelIcon);
      });
    });
  });

  sendCommentButton.addEventListener('click', async function () {
    const pinData = [];

    document.querySelectorAll('.pin_1, .pin_2, .pin_3, .pin_4').forEach(pin => {
      const message = pin.querySelector('.q1').value.trim();
      const name = pin.querySelector('.q2').value.trim();
      const residence = pin.querySelector('.q3').value.trim();

      if (message && name && residence && lastClickedLatLng) {
        pinData.push({
          message,
          name,
          residence,
          latitude: lastClickedLatLng.lat,
          longitude: lastClickedLatLng.lng
        });
      }
    });

    if (pinData.length > 0) {
      try {
        const response = await fetch('http://localhost:3000/pins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pinData[0])
        });

        if (!response.ok) {
          console.error('Failed to send data:', response.statusText);
          return;
        }

        const data = await response.json();
        console.log('Pin data sent successfully:', data);

        pinOverlay.style.display = 'none';
        commentContainers.forEach(c => c.style.display = 'none');
        addButton.style.display = 'block';
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        lastClickedLatLng = null;
      } catch (error) {
        console.error('Error sending pin data:', error);
      }
    } else {
      console.log('No valid data to send');
    }
  });
});

async function loadPins() {
  try {
    const response = await fetch('http://localhost:3000/pins');
    const pins = await response.json();

    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    pins.forEach(pin => {
      const marker = L.marker([pin.latitude, pin.longitude]).addTo(map)
        .bindPopup(`
          <b>Message:</b> ${pin.message}<br>
          <b>Name:</b> ${pin.name}<br>
          <b>Residence:</b> ${pin.residence}
        `);
      markers.push(marker);
    });
  } catch (error) {
    console.error('Error loading pins:', error);
    alert('There was an error loading the pins.');
  }
}