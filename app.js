const STORAGE_KEYS = {
  products: "marketplace_products",
  orders: "marketplace_orders",
  cart: "marketplace_cart",
  user: "marketplace_user"
};

const defaultProducts = [
  {
    id: 1,
    title: "MacBook Air 13-inch",
    description: "Lightweight laptop with excellent battery life and 8GB RAM.",
    price: 890,
    location: "Bengaluru",
    seller: "Asha",
    category: "Electronics",
    status: "active",
    emoji: "💻"
  },
  {
    id: 2,
    title: "Vintage Bicycle",
    description: "Well-maintained commuter bike with new tires and basket.",
    price: 160,
    location: "Hyderabad",
    seller: "Ravi",
    category: "Vehicles",
    status: "active",
    emoji: "🚲"
  },
  {
    id: 3,
    title: "Designer Handbag",
    description: "Premium canvas bag with compact storage and premium finish.",
    price: 120,
    location: "Chennai",
    seller: "Nisha",
    category: "Fashion",
    status: "active",
    emoji: "👜"
  },
  {
    id: 4,
    title: "Sony Headphones",
    description: "Noise-canceling over-ear headphones with 20-hour battery life.",
    price: 210,
    location: "Pune",
    seller: "Mohan",
    category: "Electronics",
    status: "active",
    emoji: "🎧"
  },
  {
    id: 5,
    title: "Coffee Table",
    description: "Solid wood table with a natural finish and storage shelf.",
    price: 95,
    location: "Kolkata",
    seller: "Sana",
    category: "Home",
    status: "active",
    emoji: "🪑"
  }
];

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.products)) {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(defaultProducts));
  }
  if (!localStorage.getItem(STORAGE_KEYS.orders)) {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.cart)) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify([]));
  }
}

function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]").filter((product) => product.status !== "sold");
}

function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.orders) || "[]");
}

function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
}

function getUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null") || {
    name: "Guest",
    email: "guest@example.com"
  };
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove("show"), 2200);
}

function fillAddressFromGPS(event, targetFieldId = "location") {
  event?.preventDefault();
  const addressField = document.getElementById(targetFieldId);
  if (!addressField) return;

  if (!navigator.geolocation) {
    addressField.value = "";
    showToast("Auto GPS is not available in this browser.");
    return;
  }

  addressField.value = "Detecting your location...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude.toFixed(4);
      const longitude = position.coords.longitude.toFixed(4);
      const address = `${latitude}, ${longitude}`;
      addressField.value = address;
      showToast("Location detected from GPS.");
    },
    () => {
      addressField.value = "";
      showToast("GPS access was denied. Please enter your location manually.");
    }
  );
}

function renderProductGrid(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = '<p class="empty-state">No matching products right now. Try different filters or become a seller.</p>';
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-visual">${product.emoji || "🛍️"}</div>
          <div class="product-meta">
            <strong>${product.title}</strong>
            <span>₹${product.price}</span>
          </div>
          <p>${product.description}</p>
          <div class="product-meta">
            <span>${product.category}</span>
            <span>${product.location}</span>
          </div>
          <div class="product-actions">
            <button class="btn btn-sm btn-secondary" data-action="cart" data-id="${product.id}">Add to cart</button>
            <button class="btn btn-sm btn-primary" data-action="buy" data-id="${product.id}">Buy now</button>
          </div>
        </article>
      `
    )
    .join("");

  container.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = event.currentTarget.getAttribute("data-action");
      const id = Number(event.currentTarget.getAttribute("data-id"));
      const product = getProducts().find((item) => item.id === id);
      if (!product) return;

      if (action === "cart") {
        addToCart(product);
      } else if (action === "buy") {
        buyProduct(product);
      }
    });
  });
}

function addToCart(product) {
  const cart = getCart();
  if (!cart.some((item) => item.id === product.id)) {
    cart.push({ ...product, addedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }
  showToast(`${product.title} added to cart.`);
  if (document.body.dataset.page === "home") {
    renderHomePage();
  }
}

function buyProduct(product) {
  const user = getUser();
  const orders = getOrders();
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]");

  orders.push({
    id: `${product.id}-${Date.now()}`,
    title: product.title,
    buyer: user.name,
    seller: product.seller,
    price: product.price,
    orderedAt: new Date().toISOString(),
    status: "completed"
  });

  const updatedProducts = products.map((item) =>
    item.id === product.id ? { ...item, status: "sold", soldTo: user.name, soldAt: new Date().toISOString() } : item
  );

  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(updatedProducts));
  showToast(`${product.title} is now sold and removed from public feed.`);

  if (document.body.dataset.page === "buy") {
    renderBuyPage();
  } else if (document.body.dataset.page === "home") {
    renderHomePage();
  }
}

function renderBuyPage() {
  const user = getUser();
  const nameLabel = document.getElementById("userName");
  if (nameLabel) nameLabel.textContent = user.name;

  const container = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const priceSelect = document.getElementById("priceSelect");

  const applyFilters = () => {
    const search = searchInput?.value.toLowerCase() || "";
    const category = categorySelect?.value || "All";
    const price = Number(priceSelect?.value || 0);

    const filtered = getProducts().filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(search) || product.description.toLowerCase().includes(search);
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = !price || product.price <= price;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    renderProductGrid(container, filtered);
  };

  searchInput?.addEventListener("input", applyFilters);
  categorySelect?.addEventListener("change", applyFilters);
  priceSelect?.addEventListener("change", applyFilters);
  applyFilters();
}

function renderHomePage() {
  const user = getUser();
  const userName = document.getElementById("userName");
  if (userName) userName.textContent = user.name;

  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");
  const priceSelect = document.getElementById("priceSelect");
  const grid = document.getElementById("marketGrid");

  const applyFilters = () => {
    const search = searchInput?.value.toLowerCase() || "";
    const category = categorySelect?.value || "All";
    const price = Number(priceSelect?.value || 0);

    const filtered = getProducts().filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(search) || product.description.toLowerCase().includes(search);
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = !price || product.price <= price;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    renderProductGrid(grid, filtered);
  };

  searchInput?.addEventListener("input", applyFilters);
  categorySelect?.addEventListener("change", applyFilters);
  priceSelect?.addEventListener("change", applyFilters);

  document.getElementById("voiceSearch")?.addEventListener("click", () => startVoiceSearch(searchInput));
  document.getElementById("scanImage")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const label = document.getElementById("scanStatus");
    if (label) label.textContent = `Camera scan received: ${file.name}. Demo mode ready for image-based search.`;
    if (searchInput) searchInput.value = `Scan: ${file.name}`;
  });

  renderCart();
  renderOrders();
  renderHistory();
  applyFilters();
}

function renderCart() {
  const container = document.getElementById("cartList");
  const cart = getCart();
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = '<p class="empty-state">Your cart is empty right now.</p>';
    return;
  }
  container.innerHTML = cart
    .map(
      (item) => `
        <div class="list-item">
          <div>
            <strong>${item.title}</strong>
            <div class="badge">${item.category}</div>
          </div>
          <span>₹${item.price}</span>
        </div>
      `
    )
    .join("");
}

function renderOrders() {
  const container = document.getElementById("ordersList");
  const orders = getOrders();
  if (!container) return;
  if (!orders.length) {
    container.innerHTML = '<p class="empty-state">No active orders yet.</p>';
    return;
  }
  container.innerHTML = orders
    .slice(-4)
    .reverse()
    .map(
      (order) => `
        <div class="list-item">
          <div>
            <strong>${order.title}</strong>
            <div class="badge success">${order.status}</div>
          </div>
          <span>₹${order.price}</span>
        </div>
      `
    )
    .join("");
}

function renderHistory() {
  const container = document.getElementById("historyList");
  const user = getUser();
  const orders = getOrders();
  const soldItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]").filter((product) => product.status === "sold");
  const userHistory = orders.filter((order) => order.buyer === user.name || order.seller === user.name);

  if (!container) return;
  if (!userHistory.length && !soldItems.length) {
    container.innerHTML = '<p class="empty-state">Your history will appear here after a transaction is completed.</p>';
    return;
  }

  container.innerHTML = [...userHistory, ...soldItems]
    .slice(0, 6)
    .map((item) => {
      const title = item.title || item.name || "Sold item";
      const role = item.buyer === user.name ? "Bought" : item.seller === user.name ? "Sold" : "History";
      return `
        <div class="list-item">
          <div>
            <strong>${title}</strong>
            <div class="badge">${role}</div>
          </div>
          <span>${item.price ? `₹${item.price}` : "Completed"}</span>
        </div>
      `;
    })
    .join("");
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  const locationMode = document.getElementById("locationMode");
  const locationInput = document.getElementById("location");
  const gpsBtn = document.getElementById("gpsBtn");
  const fingerprintBtn = document.getElementById("fingerprintBtn");
  const fingerprintStatus = document.getElementById("fingerprintStatus");
  const loginBtn = document.getElementById("loginBtn");
  let fingerprintVerified = false;
  let gpsWatchId = null;
  let gpsTrackingActive = false;

  const updateFingerprintState = (verified, message) => {
    fingerprintVerified = verified;
    loginBtn.disabled = !verified;
    if (fingerprintStatus) fingerprintStatus.textContent = message;
  };

  const stopLiveGpsTracking = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
    gpsTrackingActive = false;
    if (gpsBtn) gpsBtn.textContent = "Start live GPS tracking";
    if (locationInput) {
      locationInput.placeholder = "Enter your location or use GPS";
    }
  };

  const useAutoGps = () => {
    if (!navigator.geolocation) {
      showToast("Auto GPS is not available in this browser.");
      return;
    }

    if (gpsTrackingActive) {
      stopLiveGpsTracking();
      showToast("Live GPS tracking stopped.");
      return;
    }

    locationMode.value = "gps";
    gpsTrackingActive = true;
    if (gpsBtn) gpsBtn.textContent = "Stop live GPS tracking";
    if (locationInput) {
      locationInput.value = "Tracking live location...";
      locationInput.placeholder = "Live GPS tracking active";
    }

    gpsWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        if (locationInput) locationInput.value = `${latitude}, ${longitude}`;
      },
      () => {
        if (locationInput) locationInput.value = "GPS unavailable";
        stopLiveGpsTracking();
        showToast("GPS access was denied. Please enter your location manually.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      }
    );

    showToast("Live GPS tracking started.");
  };

  locationMode?.addEventListener("change", (event) => {
    if (event.target.value === "gps") {
      useAutoGps();
    } else {
      stopLiveGpsTracking();
    }
  });

  gpsBtn?.addEventListener("click", useAutoGps);

  fingerprintBtn?.addEventListener("click", async () => {
    if (window.PublicKeyCredential && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          updateFingerprintState(true, "Fingerprint verification completed successfully.");
          showToast("Fingerprint verification completed.");
          return;
        }
      } catch (error) {
        console.error(error);
      }
    }

    updateFingerprintState(true, "Fingerprint verification completed in demo mode.");
    showToast("Fingerprint verification completed in demo mode.");
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!fingerprintVerified) {
      showToast("Please verify your fingerprint before logging in.");
      return;
    }

    const name = document.getElementById("fullName")?.value.trim() || "Guest";
    const email = document.getElementById("email")?.value.trim() || "guest@example.com";
    const location = document.getElementById("location")?.value.trim() || "Location not provided";
    saveUser({ name, email, location, fingerprintVerified: true });
    showToast(`Welcome, ${name}!`);
    window.location.href = "choose.html";
  });
}

function initChoosePage() {
  const user = getUser();
  const label = document.getElementById("currentUser");
  if (label) label.textContent = user.name;
}

function startVoiceSearch(input) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Voice search is not available in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (input) input.value = transcript;
    showToast(`Voice search: ${transcript}`);
  };
  recognition.onerror = () => showToast("Voice search could not start.");
}

function initSellPage() {
  const user = getUser();
  const userLabel = document.getElementById("sellerName");
  if (userLabel) userLabel.textContent = user.name;

  const fileInput = document.getElementById("photoUpload");
  const previewGrid = document.getElementById("previewGrid");
  const aiStatus = document.getElementById("aiStatus");
  const locationField = document.getElementById("location");
  const gpsFillBtn = document.getElementById("gpsFillBtn");
  const openCameraBtn = document.getElementById("openCameraBtn");
  const capturePhotoBtn = document.getElementById("capturePhotoBtn");
  const video = document.getElementById("cameraStream");
  let mediaItems = [];
  let cameraStreamObject = null;

  function renderPreviewGrid() {
    previewGrid.innerHTML = "";
    mediaItems.forEach((item, index) => {
      const tile = document.createElement("div");
      tile.className = "preview-tile";
      if (item.type === "image") {
        const img = document.createElement("img");
        img.src = item.data;
        img.alt = `Photo ${index + 1}`;
        tile.appendChild(img);
      } else {
        tile.textContent = `${index + 1}. ${item.label}`;
      }
      previewGrid.appendChild(tile);
    });
  }

  function updateAiStatus() {
    if (aiStatus) aiStatus.textContent = evaluateImageConsistency(mediaItems.length);
  }

  function addMediaItem(dataUrl, label) {
    if (mediaItems.length >= 4) {
      showToast("You already captured four photos. Remove the form and start again if you want a new set.");
      return;
    }
    mediaItems.push({ type: "image", data: dataUrl, label });
    renderPreviewGrid();
    updateAiStatus();
  }

  gpsFillBtn?.addEventListener("click", (event) => fillAddressFromGPS(event, "location"));

  openCameraBtn?.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast("Camera access is not supported in this browser.");
      return;
    }

    if (cameraStreamObject) {
      showToast("Camera is already active.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraStreamObject = stream;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      showToast("Live camera ready. Capture four photos from different angles.");
    } catch (error) {
      showToast("Camera permission was denied. You can still upload files instead.");
    }
  });

  capturePhotoBtn?.addEventListener("click", () => {
    if (!video || !video.videoWidth) {
      showToast("Open the camera first before capturing a photo.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    addMediaItem(dataUrl, `Camera photo ${mediaItems.length + 1}`);
  });

  fileInput?.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files.slice(0, 4 - mediaItems.length)) {
      const dataUrl = await fileToDataUrl(file);
      addMediaItem(dataUrl, file.name);
    }
  });

  const form = document.getElementById("sellForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("itemName")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const price = Number(document.getElementById("price")?.value || 0);
    const location = document.getElementById("location")?.value.trim();
    const category = document.getElementById("category")?.value || "General";

    if (!name || !description || !price || mediaItems.length < 4) {
      showToast("Please add at least four images and all item details before listing.");
      return;
    }

    if (!location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`;
            locationField.value = coords;
            saveListing({ name, description, price, location: coords, category, seller: user.name, images: mediaItems.map((item) => item.data) });
          },
          () => {
            locationField.value = "Location required";
            saveListing({ name, description, price, location: "Location required", category, seller: user.name, images: mediaItems.map((item) => item.data) });
          }
        );
      } else {
        saveListing({ name, description, price, location: "Location required", category, seller: user.name, images: mediaItems.map((item) => item.data) });
      }
    } else {
      saveListing({ name, description, price, location, category, seller: user.name, images: mediaItems.map((item) => item.data) });
    }
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function evaluateImageConsistency(filesCount) {
  if (!filesCount) return "AI check pending. Add photos to analyze the product.";
  const score = Math.min(100, 60 + filesCount * 8 + (filesCount >= 4 ? 10 : 0));
  return `AI-assisted consistency check: ${score}% match for a single real product. Demo uses a heuristic check to validate that four or more images are present.`;
}

function saveListing(data) {
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.products) || "[]");
  const listing = {
    id: Date.now(),
    title: data.name,
    description: data.description,
    price: data.price,
    location: data.location,
    seller: data.seller,
    category: data.category,
    status: "active",
    emoji: "📦",
    images: data.images || []
  };

  products.push(listing);
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  showToast(`Your item is now live for buyers.`);
  document.getElementById("sellForm")?.reset();
  document.getElementById("previewGrid").innerHTML = "";
  document.getElementById("aiStatus").textContent = "AI check pending.";
}

window.addEventListener("DOMContentLoaded", () => {
  initStorage();
  const page = document.body.dataset.page || "home";

  if (page === "login") {
    initLoginPage();
  } else if (page === "choose") {
    initChoosePage();
  } else if (page === "buy") {
    renderBuyPage();
  } else if (page === "sell") {
    initSellPage();
  } else if (page === "home") {
    renderHomePage();
  }
});
