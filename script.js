const API_URL = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000'
  : 'https://place-attachment.onrender.com';

  console.log('Using API URL:', API_URL);
  
  console.log('Hostname:', location.hostname);
  const map = L.map('map', {
  worldCopyJump: false,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  minZoom: 2
}).setView([41.8239, -71.4128], 14);
const southWest = L.latLng(-85, -180);
const northEast = L.latLng(85, 180);
const bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);

map.getContainer().style.borderRadius = '500px';
map.getContainer().style.overflow = 'hidden';

L.control.zoom({ position: 'topright' }).addTo(map);

// L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
//   attribution: '&copy; OpenStreetMap & CartoDB'
// }).addTo(map);

L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token=Djw7VojsCBi6l9JnaakNi5Z6F4HzJPwlavPfTjigdUF4DtdKLlDTbY4I0eIi2f2h', {
  attribution: '<a href="https://www.jawg.io?utm_medium=map&utm_source=attribution" target="_blank">&copy; Jawg</a> - <a href="https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg" target="_blank">&copy; OpenStreetMap</a> contributors'
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
let outsidePopup;  // Declare it globally
let toggleBtn;
let mapVisible = true; // Global scope
let currentFilterColor = 'all';

function activateFilterFromColor(color) {
  console.log('activateFilterFromColor called with:', color);
  if (!color || !mapVisible) return;

  const filterMap = {
    'all': '.pinAll_filter',
    '#00EF1C': '.pin1_filter',
    '#00F8EC': '.pin2_filter',
    '#ff9f04': '.pin3_filter',
    '#FFC1F6': '.pin4_filter',
  };

  const selector = filterMap[color] || filterMap['all'];
  const button = document.querySelector(selector);
  setActiveButton(button);
}
function resetFilterVisuals() {
  document.querySelectorAll('.button_filter').forEach(btn => {
    btn.classList.remove('active');
    btn.style.opacity = '0.75';
  });
}
map.on('popupclose', function () {
  if (mapVisible) {
    console.log('Popup closed - reactivating filter:', currentFilterColor);
    activateFilterFromColor(currentFilterColor); // This just updates visuals
  }
});
function filterMarkersByColor(color) {
  submittedMarkers.forEach(({ marker, iconColor }) => {
    if (color === 'all' || iconColor === color) {
      map.addLayer(marker);
    } else {
      map.removeLayer(marker);
    }
  });
}
const filterButtons = document.querySelectorAll('.button_filter');

function setActiveButton(button) {
  document.querySelectorAll('.button_filter').forEach(btn => {
    btn.classList.remove('active');
    btn.style.opacity = '0.75';
    btn.style.backgroundColor = '#d3d3d3';
  });

  if (button) {
    button.classList.add('active');
    button.style.opacity = '1';

    const originalColor = button.getAttribute('data-color');
    button.style.backgroundColor = originalColor;
  }
}

function setActiveButtonAndUpdateState(button) {
  setActiveButton(button);

  if (button && button.classList.contains('button_filter')) {
    const originalColor = button.getAttribute('data-color') || 'all';
    currentFilterColor = originalColor;
    console.log('currentFilterColor set to:', currentFilterColor);
  }
}

function activateFilterByIconColor(iconColor) {
  // Apply the filter
  filterMarkersByColor(iconColor);

  // Map icon colors to their corresponding button selectors
  const colorToButtonClass = {
    '#00EF1C': '.pin1_filter', // Place of Belonging
    '#00F8EC': '.pin2_filter', // Moments of Rootedness
    '#ff9f04': '.pin3_filter', // Sensory Anchor
    '#FFC1F6': '.pin4_filter'  // Memory Footprints
  };

  // Get the selector for the target button or default to '.pinAll_filter'
  const buttonSelector = colorToButtonClass[iconColor] || '.pinAll_filter';
  const targetButton = document.querySelector(buttonSelector);

  // Visually activate the button if found
  if (targetButton) {
    setActiveButton(targetButton);
  }
}
function updateChoosePinButtonsVisuals() {
  const visibleContainer = [...document.querySelectorAll('.comment_container > div')]
    .find(div => getComputedStyle(div).display !== 'none');

  document.querySelectorAll('.choose_pin').forEach(button => {
    const pinColor = button.getAttribute('data-color');
    let pinType = '';

    if (button.classList.contains('pin1')) pinType = 'pin_1';
    if (button.classList.contains('pin2')) pinType = 'pin_2';
    if (button.classList.contains('pin3')) pinType = 'pin_3';
    if (button.classList.contains('pin4')) pinType = 'pin_4';

    // Check if this button matches the visible comment container
    const isActive = visibleContainer?.classList.contains(pinType);

    if (isActive) {
      button.classList.add('active');
      button.style.backgroundColor = pinColor;
      button.style.opacity = '1';
    } else {
      button.classList.remove('active');
      button.style.backgroundColor = '#d3d3d3';
    }
  });
}

let defaultBackgroundColor = '#2b0a95';  // Default background color
let currentPinData = {
  latlng: null,
  color: null,
  icon: null,
  pinType: null
};

let shuffledImages = [];
let currentImageIndex = 0;

document.getElementById('background-container').style.backgroundColor = defaultBackgroundColor;
function shuffleImages(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

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

  updateChoosePinButtonsVisuals();

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

function updateSendButtonState(containerElement) {
  const textarea = containerElement.querySelector('textarea');
  const input1 = containerElement.querySelector('input.q2');
  const input2 = containerElement.querySelector('input.q3');
  const imageInput = containerElement.querySelector('.imageInput');
  const sendCommentButton = document.querySelector('.send_comment');

  if (
    textarea && input1 && input2 && imageInput &&
    textarea.value.trim() !== '' &&
    input1.value.trim() !== '' &&
    input2.value.trim() !== '' &&
    imageInput.files.length > 0
  ) {
    sendCommentButton.disabled = false;
    sendCommentButton.classList.remove('disabled');
  } else {
    sendCommentButton.disabled = true;
    sendCommentButton.classList.add('disabled');
  }
  console.log({
    textarea: textarea?.value,
    name: input1?.value,
    residence: input2?.value,
    image: imageInput?.files.length
  });
}
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


function resetPopupPosition(popup) {
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
}

function displayPopupOutsideMap(pin) {
  outsidePopup = document.getElementById('popup-outside-map');  // Assign the element to the global variable
  outsidePopup.innerHTML = `
    <div class="popup-content" style="background-color: ${pin.iconColor}; padding: 1rem 2rem; border-radius: 3px; 
    box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;">
    <img src="./assets/drag_brown.svg" class="drag-icon" title="Drag" 
      style="position: absolute; top: 10px; left: 10px; width: 12px; height: 12px; cursor: move;" />
      <p style="margin-top: 20px; margin-bottom: 25px;">${pin.message}</p>
      <p style="margin: 0rem; font-size: 14px;">${pin.name},</p>
      <p style="margin-top: 3px; font-size: 14px;">${pin.residence}</p>
    </div>
  `;
  outsidePopup.style.display = 'block';
  resetPopupPosition(outsidePopup);
  makeDraggable(outsidePopup);
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.button_filter').forEach(btn => {
    const color = btn.getAttribute('data-color');
  
    // Hover - mouseenter
    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active') && mapVisible) {
        btn.style.backgroundColor = color;
      }
    });
  
    // Hover - mouseleave
    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active') && mapVisible) {
        btn.style.backgroundColor = '#d3d3d3'; // your inactive bg color
      }
    });
  
    // Click
    btn.addEventListener('click', () => {
    const color = btn.getAttribute('data-filter') || 'all';
    currentFilterColor = filter;
    setActiveButtonAndUpdateState(btn);
    });
  });
  const addButton = document.getElementById('add');
  const pinOverlay = document.querySelector('.pin_overlay');
  const instructions = document.querySelector('.instructions');
  const closeButton = document.querySelector('.close_pin_overlay');
  const pinButtons = document.querySelectorAll('.choose_pin');
  const commentContainers = document.querySelectorAll('.comment_container > div');
  const sendCommentButton = document.querySelector('.send_comment');

  toggleBtn = document.getElementById('toggle-map-btn');
  const mapEl = document.getElementById('map');

  toggleBtn.style.display = 'none';

  // Set initial visibility
  mapEl.style.display = 'block';
  addButton.style.display = 'block';
  toggleBtn.textContent = 'Hide Map';

  toggleBtn.addEventListener('click', () => {
    mapVisible = !mapVisible;

    if (mapVisible) {
      mapEl.style.display = 'block';
      addButton.style.display = 'block';
      toggleBtn.textContent = 'Hide Map';
      if (outsidePopup) {
        resetPopupPosition(outsidePopup);
      }
    } else {
      mapEl.style.display = 'none';
      addButton.style.display = 'none';
      toggleBtn.textContent = 'Show Map';
    }
});
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
          const imageInput = selectedContainer.querySelector('.imageInput'); // Get image input

          textarea.addEventListener('input', () => updateSendButtonState(selectedContainer));
          input1.addEventListener('input', () => updateSendButtonState(selectedContainer));
          input2.addEventListener('input', () => updateSendButtonState(selectedContainer));
          imageInput.addEventListener('change', () => updateSendButtonState(selectedContainer)); //listen for changes
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
    const imageInput = container.querySelector('.imageInput');
    return textarea.value.trim() !== '' && input1.value.trim() !== '' && input2.value.trim() !== '' && imageInput.files.length > 0;
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
    const imageInput = visiblePinContainer.querySelector('.imageInput');
    const selectedImage = imageInput.files[0];

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

        const response = await fetch(`${API_URL}/pins`, {
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
  document.querySelectorAll('.imageInput').forEach((input) => {
    input.addEventListener('change', () => {
      const container = input.closest('.pin_1, .pin_2, .pin_3, .pin_4');
      const imageLabel = container.querySelector('.image-upload-button');
  
      // ✅ Immediately update the label if an image is chosen
      if (input.files.length > 0) {
        imageLabel.textContent = 'Image Uploaded!';
      } else {
        imageLabel.textContent = 'Add an Image';
      }
  
      // ✅ Then run full validation logic
      updateSendButtonState(container);
    });
  });
});

// document.querySelectorAll('.choose_pin').forEach(button => {
//   button.addEventListener('click', () => {
//     let pinColor = '';
//     let pinType = '';

//     if (button.classList.contains('pin1')) {
//       pinColor = '#00EF1C';
//       pinType = 'pin_1';
//     } else if (button.classList.contains('pin2')) {
//       pinColor = '#00F8EC';
//       pinType = 'pin_2';
//     } else if (button.classList.contains('pin3')) {
//       pinColor = '#ff9f04';
//       pinType = 'pin_3';
//     } else if (button.classList.contains('pin4')) {
//       pinColor = '#FFC1F6';
//       pinType = 'pin_4';
//     }

//     const newIcon = L.divIcon({
//       className: 'leaflet-pixel-icon',
//       iconSize: [10, 10],
//       iconAnchor: [0, 0],
//       html: `<div style="width: 10px; height: 10px; background-color: ${pinColor};"></div>`
//     });

//     const pinOverlayVisible = window.getComputedStyle(document.querySelector('.pin_overlay')).display !== 'none';

//     if (tempMarker && pinOverlayVisible) {
//       tempMarker.setIcon(newIcon);
//     }

//     const pinOverlay = document.querySelector('.pin_overlay');
//     pinOverlay.style.backgroundColor = pinColor;

//     const commentContainers = document.querySelectorAll('.comment_container > div');
//     commentContainers.forEach(container => container.style.display = 'none');

//     const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
//     if (selectedContainer) {
//       selectedContainer.style.display = 'block';
//     }

//     // Update current temp pin data
//     currentPinData.color = pinColor;
//     currentPinData.icon = newIcon;
//     currentPinData.pinType = pinType;
//   });
// });
document.querySelectorAll('.choose_pin').forEach(button => {
  const pinColor = button.getAttribute('data-color');

  // Hover effects (only when not active)
  button.addEventListener('mouseenter', () => {
    if (!button.classList.contains('active')) {
      button.style.backgroundColor = pinColor;
    }
  });

  button.addEventListener('mouseleave', () => {
    if (!button.classList.contains('active')) {
      button.style.backgroundColor = '#d3d3d3';
    }
  });

  // Click logic (same as before)
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

    document.querySelector('.pin_overlay').style.backgroundColor = pinColor;

    document.querySelectorAll('.comment_container > div').forEach(container => {
      container.style.display = 'none';
    });

    const selectedContainer = document.querySelector(`.comment_container .${pinType}`);
    if (selectedContainer) {
      selectedContainer.style.display = 'block';
    }

    currentPinData.color = pinColor;
    currentPinData.icon = newIcon;
    currentPinData.pinType = pinType;

    // ✅ Sync visuals based on visible container
    updateChoosePinButtonsVisuals();
  });
});

async function loadPins() {

  try {
    const response = await fetch(`${API_URL}/pins`);
    const pins = await response.json();

    console.log('Fetched pins:', pins);

    // Clear previous markers
    submittedMarkers.forEach(({ marker }) => map.removeLayer(marker));
    submittedMarkers = [];
    backgroundImages = [];

    pins.forEach((pin, index) => {
      // console.log(`Adding marker for pin ${index + 1}:`, pin);

      const iconColor = pin.iconColor || '#000';

      // Create popup content
      let popupContent = `
        <div class="popup-content" style="background-color: ${iconColor}; border-radius: 3px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;">
          <p style="margin-top: 20px; margin-bottom: 25px; font-size: 1rem;">${pin.message}</p>
          <p style="margin: 0rem; font-size: 13px;">${pin.name},</p>
          <p style="margin-top: 2px; font-size: 13px;">${pin.residence}</p>
        </div>`;

      // Create marker icon
      const icon = L.divIcon({
        className: 'leaflet-pixel-icon',
        html: `<div style="width: 10px; height: 10px; background-color: ${iconColor};"></div>`,
        iconSize: [10, 10],
        iconAnchor: [0, 0]
      });

      // Create and place marker
      const popup = L.popup({ autoPan: false }).setContent(popupContent);
      const marker = L.marker([pin.latitude, pin.longitude], { icon })
        .addTo(map)
        .bindPopup(popup);

      // Set the map's view and open the popup with a slight delay to ensure content renders
      // map.setView([pin.latitude, pin.longitude], map.getZoom(), { animate: true });

      setTimeout(() => {
        marker.openPopup(); // Open popup after a slight delay
      }, 100); // Delay of 100ms (adjust if needed)
      // Background update on popup open
      marker.on('click', () => {
        if (pin.image) {
          const bg = document.getElementById('background-container');
          bg.style.backgroundImage = `url('http://localhost:3000${pin.image}')`;

          toggleBtn.style.display = 'block';
          toggleBtn.textContent = 'Hide Map';
          mapVisible = true; // ✅ ensure status is correct
        }
        if (mapVisible && iconColor) {
          activateFilterFromColor(iconColor);
        }
        displayPopupOutsideMap(pin);      
      });

      // Store for filtering
      submittedMarkers.push({ marker, iconColor });

      // Store for background shuffling
      if (pin.image) {
        backgroundImages.push({
          image: `http://localhost:3000${pin.image}`,
          lat: pin.latitude,
          lng: pin.longitude,
          marker: marker,
          message: pin.message,
          name: pin.name,
          residence: pin.residence,
          iconColor: iconColor
        });
      }
    });

    // Shuffle backgrounds
    shuffledImages = shuffleImages(backgroundImages);
    currentImageIndex = 0;

  } catch (error) {
    console.error('Error loading pins:', error);
    alert('There was an error loading the pins. See console for details.');
  }
}
const toggle = document.getElementById('toggle-map');
// const changeSpan = document.querySelector('.change');
const mapEl = document.getElementById('map');
const addButton = document.getElementById('add');
document.querySelector('.background_location_image').addEventListener('click', () => {
  if (shuffledImages.length === 0) return;

  const current = shuffledImages[currentImageIndex];
  console.log('Current shuffled image:', current);
  if (!current) return;
  
  // Set background image
  const bg = document.getElementById('background-container');
  bg.style.backgroundImage = `url('${current.image}')`;

  // Fly to marker, open popup, and center on screen
  if (current.marker) {
    map.setView([current.lat, current.lng], map.getZoom(), { animate: true });
    map.once('moveend', () => {
      current.marker.openPopup();
      console.log('Popup open after:', current.marker.isPopupOpen());
    });
  
    displayPopupOutsideMap(current);
    
    if (current.iconColor) {
      console.log('Activating filter for:', current.iconColor);
      currentFilterColor = current.iconColor; // ✅ keep track of the color
      activateFilterByIconColor(current.iconColor);
    }
  }
  // Advance index
  currentImageIndex++;
  if (currentImageIndex >= shuffledImages.length) {
    currentImageIndex = 0;
  }

  // Hide the map
  mapEl.style.display = 'none';
  addButton.style.display = 'none';
  toggleBtn.style.display = 'block'; 
  toggleBtn.textContent = 'Show Map';
  mapVisible = false; // 🔁 Keep status accurate
});

document.querySelector('.pinAll_filter').addEventListener('click', (e) => {
  filterMarkersByColor('all');
  currentFilterColor = 'all';
  setActiveButton(e.currentTarget);
});

document.querySelector('.pin1_filter').addEventListener('click', (e) => {
  filterMarkersByColor('#00EF1C'); // Place of Belonging
  currentFilterColor = '#00EF1C';
  setActiveButton(e.currentTarget);
});

document.querySelector('.pin2_filter').addEventListener('click', (e) => {
  filterMarkersByColor('#00F8EC'); // Moments of Rootedness
  currentFilterColor = '#00F8EC';
  setActiveButton(e.currentTarget);
});

document.querySelector('.pin3_filter').addEventListener('click', (e) => {
  filterMarkersByColor('#ff9f04'); // Sensory Anchor
  currentFilterColor = '#ff9f04';
  setActiveButton(e.currentTarget);
});

document.querySelector('.pin4_filter').addEventListener('click', (e) => {
  filterMarkersByColor('#FFC1F6'); // Memory Footprints
  currentFilterColor = '#FFC1F6';
  setActiveButton(e.currentTarget);
});
document.querySelectorAll('.imageInput').forEach((input) => {
  input.addEventListener('change', () => {
    const container = input.closest('.pin_1, .pin_2, .pin_3, .pin_4');
    updateSendButtonState(container);
  });
});
window.addEventListener('DOMContentLoaded', loadPins);
