const map = L.map('map', {
  worldCopyJump: false,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  minZoom: 2
}).setView([41.8239, -71.4128], 12);
const southWest = L.latLng(-85, -180);
const northEast = L.latLng(85, 180);
const bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);

map.getContainer().style.borderRadius = '500px';
map.getContainer().style.overflow = 'hidden';

L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB'
}).addTo(map);

let submittedMarkers = [];
let tempMarkers = [];

let squarePixelIcon = L.divIcon({
  className: 'leaflet-pixel-icon',
  iconSize: [10, 10],
  iconAnchor: [0, 0],
  html: '<div style="width: 10px; height: 10px; background-color: red;"></div>'
});

let markers = [];
let currentIconColor = 'red';
let lastClickedLatLng = null;

let currentPinData = {
  latlng: null,
  color: null,
  icon: null,
  pinType: null
};


function showRandomPinAndColor() {
  const pinOverlay = document.querySelector('.pin_overlay');
  const pinButtons = document.querySelectorAll('.choose_pin');
  const commentContainers = document.querySelectorAll('.comment_container > div');
  const addButtonElement = document.getElementById('add');

  if (!pinOverlay) {
    console.error("pinOverlay element not found");
    return null;
  }

  pinOverlay.style.display = 'block';
  addButtonElement.style.display = 'none';

  const randomIndex = Math.floor(Math.random() * pinButtons.length);
  const randomButton = pinButtons[randomIndex];

  // Hide all containers first
  commentContainers.forEach(container => {
    container.style.display = 'none';
  });

  let pinType = '';
  let pinColor = '';

  if (randomButton.classList.contains('pin1')) {
    pinType = 'pin_1';
    pinColor = '#00EF1C';
  } else if (randomButton.classList.contains('pin2')) {
    pinType = 'pin_2';
    pinColor = '#00F8EC';
  } else if (randomButton.classList.contains('pin3')) {
    pinType = 'pin_3';
    pinColor = '#ff9f04';
  } else if (randomButton.classList.contains('pin4')) {
    pinType = 'pin_4';
    pinColor = '#FFC1F6';
  }

  // Show correct comment container
  if (pinType) {
    const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
    if (selectedContainer) {
      selectedContainer.style.display = 'block';
    }
  }

  // Set overlay color
  pinOverlay.style.backgroundColor = pinColor;
  currentIconColor = pinColor;

  // Return both values
  return {
    pinColor,
    pinType
  };
}

document.querySelector('.about').addEventListener('click', () => {
  const overlay = document.querySelector('.about_overlay');
  const button = document.querySelector('.about');

  const isHidden = (overlay.style.display === 'none' || overlay.style.display === '');

  overlay.style.display = isHidden ? 'block' : 'none';
  button.textContent = isHidden ? '✕' : 'ABOUT';
});

let tempMarker = null;

map.on('click', function (e) {
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }

  const { pinColor, pinType } = showRandomPinAndColor() || {};
  const latlng = e.latlng;

  if (pinColor) {
    const icon = L.divIcon({
      className: 'leaflet-pixel-icon',
      iconSize: [10, 10],
      iconAnchor: [0, 0],
      html: `<div style="width: 10px; height: 10px; background-color: ${pinColor};"></div>`
    });

    tempMarker = L.marker(latlng, { icon }).addTo(map);

    // Update tracked pin data
    currentPinData = {
      latlng,
      color: pinColor,
      icon,
      pinType
    };
  }
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

  const imageInput = document.getElementById('imageInput');
  let selectedImage = null;

  imageInput.addEventListener('change', (e) => {
    selectedImage = e.target.files[0];
    console.log('Selected image:', selectedImage);

    const visibleContainer = document.querySelector('.comment_container > div[style*="display: block"]');
    if (visibleContainer && checkInputs(visibleContainer) && selectedImage) {
      sendCommentButton.disabled = false;
      sendCommentButton.classList.remove('disabled');
    } else {
      sendCommentButton.disabled = true;
      sendCommentButton.classList.add('disabled');
    }
  });

  mapEl.style.display = 'block';
  addButton.style.display = 'block';
  changeSpan.setAttribute('data-text', 'Hide Map');

  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      mapEl.style.display = 'block';
      addButton.style.display = 'block';
      changeSpan.setAttribute('data-text', 'Hide Map');
    } else {
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

  let randomButton = null;

  pinButtons.forEach(button => {
    button.addEventListener('click', function () {
      randomButton = this;

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

      if (tempMarker) {
        tempMarker.setIcon(squarePixelIcon);
      }
    });
  });

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
      if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
      }
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
    if (checkInputs(containerElement) && selectedImage) {
      sendCommentButton.disabled = false;
      sendCommentButton.classList.remove('disabled');
    } else {
      sendCommentButton.disabled = true;
      sendCommentButton.classList.add('disabled');
    }
  }
  

  sendCommentButton.addEventListener('click', async function () {
    const pinData = [];
  
    const visiblePinContainer = document.querySelector('.comment_container > div[style*="display: block"]');
if (!visiblePinContainer) {
  console.warn('No visible comment container found');
  return;
}

  const message = visiblePinContainer.querySelector('.q1').value.trim();
  const name = visiblePinContainer.querySelector('.q2').value.trim();
  const residence = visiblePinContainer.querySelector('.q3').value.trim();

  if (message && name && residence && currentPinData.latlng && currentPinData.color) {
    pinData.push({
      message,
      name,
      residence,
      latitude: currentPinData.latlng.lat,
      longitude: currentPinData.latlng.lng,
      iconColor: currentPinData.color
    });
  }
  
    if (pinData.length > 0) {
      try {
        const formData = new FormData();
        formData.append('latitude', pinData[0].latitude);
        formData.append('longitude', pinData[0].longitude);
        formData.append('message', pinData[0].message);
        formData.append('name', pinData[0].name);
        formData.append('residence', pinData[0].residence);
        formData.append('iconColor', pinData[0].iconColor);
  
        if (selectedImage) {
          formData.append('image', selectedImage);
        }
  
        const response = await fetch('http://localhost:3000/pins', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) {
          console.error('Failed to send data:', response.statusText);
          return;
        }
  
        const data = await response.json();
        console.log('Pin data sent successfully:', data);
  
        const submittedIcon = L.divIcon({
          className: 'leaflet-pixel-icon',
          iconSize: [10, 10],
          iconAnchor: [0, 0],
          html: `<div style="width: 10px; height: 10px; background-color: ${pinData[0].iconColor};"></div>`
        });
  
        const submittedMarker = L.marker([pinData[0].latitude, pinData[0].longitude], { icon: submittedIcon })
          .addTo(map)
          .bindPopup(`
            <b>${pinData[0].name}</b><br>
            ${pinData[0].residence}<br>
            ${pinData[0].message}
          `);
  
        // Reset UI
        pinOverlay.style.display = 'none';
        commentContainers.forEach(c => c.style.display = 'none');
        addButton.style.display = 'block';
  
        if (tempMarker) {
          map.removeLayer(tempMarker);
          tempMarker = null;
        }
  
        currentPinData = {
          latlng: null,
          color: null,
          icon: null,
          pinType: null
        };
  
      } catch (error) {
        console.error('Error sending pin data:', error);
      }
    } else {
      console.log('No valid data to send');
    }
  });
});

document.querySelectorAll('.choose_pin').forEach(button => {
  button.addEventListener('click', () => {
    let pinColor = '';
    let pinType = '';

    if (button.classList.contains('pin1')) {
      pinColor = '#00EF1C';
      pinType = 'pin_1';
    } else if (button.classList.contains('pin2')) {
      pinColor = '#00F8EC';
      pinType = 'pin_2';
    } else if (button.classList.contains('pin3')) {
      pinColor = '#ff9f04';
      pinType = 'pin_3';
    } else if (button.classList.contains('pin4')) {
      pinColor = '#FFC1F6';
      pinType = 'pin_4';
    }

    const newIcon = L.divIcon({
      className: 'leaflet-pixel-icon',
      iconSize: [10, 10],
      iconAnchor: [0, 0],
      html: `<div style="width: 10px; height: 10px; background-color: ${pinColor};"></div>`
    });

    const pinOverlayVisible = window.getComputedStyle(document.querySelector('.pin_overlay')).display !== 'none';

    if (tempMarker && pinOverlayVisible) {
      tempMarker.setIcon(newIcon);
    }

    const pinOverlay = document.querySelector('.pin_overlay');
    pinOverlay.style.backgroundColor = pinColor;

    const commentContainers = document.querySelectorAll('.comment_container > div');
    commentContainers.forEach(container => container.style.display = 'none');

    const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
    if (selectedContainer) {
      selectedContainer.style.display = 'block';
    }

    // Update current temp pin data
    currentPinData.color = pinColor;
    currentPinData.icon = newIcon;
    currentPinData.pinType = pinType;
  });
});

async function loadPins() {
  try {
    const response = await fetch('http://localhost:3000/pins');
    const pins = await response.json();

    console.log('Fetched pins:', pins);

    // Remove existing submitted markers from map
    submittedMarkers.forEach(marker => map.removeLayer(marker));
    submittedMarkers = [];

    pins.forEach((pin, index) => {
      console.log(`Adding marker for pin ${index + 1}:`, pin);
     
    const iconColor = pin.iconColor || '#000'; // move this up first
    // const textColor = getContrastY(iconColor); // optional: if using text contrast logic

      let popupContent = `
          <div class="popup-content" style="background-color: ${iconColor};">
          <p style="margin-top: 20px; margin-bottom: 25px;"> ${pin.message}</p>
          <p style="margin: 0rem;"> ${pin.name},</p>
          <p style="margin-top: 5px;"> ${pin.residence}</p>
      `;
      popupContent += `</div>`;

     
      const icon = L.divIcon({
        className: 'leaflet-pixel-icon',
        html: `<div style="width: 10px; height: 10px; background-color: ${iconColor};"></div>`,
        iconSize: [10, 10],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([pin.latitude, pin.longitude], { icon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('popupopen', () => {
        if (pin.image) {
          const bg = document.getElementById('background-container');
          bg.style.backgroundImage = `url('http://localhost:3000${pin.image}')`;
        }
      });

      markers.push(marker);
      submittedMarkers.push({ marker, iconColor }); 
    });
  } catch (error) {
    console.error('Error loading pins:', error);
    alert('There was an error loading the pins. See console for details.');
  }
}
function filterMarkersByColor(color) {
  submittedMarkers.forEach(({ marker, iconColor }) => {
    if (color === 'all' || iconColor === color) {
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    }
  });
}
document.querySelector('.pinAll_filter').addEventListener('click', () => {
  filterMarkersByColor('all');
});

document.querySelector('.pin1_filter').addEventListener('click', () => {
  filterMarkersByColor('#00EF1C'); // Place of Belonging
});

document.querySelector('.pin2_filter').addEventListener('click', () => {
  filterMarkersByColor('#00F8EC'); // Moments of Rootedness
});

document.querySelector('.pin3_filter').addEventListener('click', () => {
  filterMarkersByColor('#ff9f04'); // Sensory Anchor
});

document.querySelector('.pin4_filter').addEventListener('click', () => {
  filterMarkersByColor('#FFC1F6'); // Memory Footprints
});
window.addEventListener('DOMContentLoaded', loadPins);


