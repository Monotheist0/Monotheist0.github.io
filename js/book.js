// ============================================
// Book Portfolio - Production-Ready JavaScript
// Optimized for Performance & Accessibility
// ============================================

// Configuration Constants
const FLIP_THRESHOLD = window.innerWidth < 768 ? 70 : 100; // Adaptive for devices
const FLIP_MULTIPLIER = 3; // Horizontal must be 3x vertical
const TOTAL_PAGES = 7;
const GITHUB_USERNAME = "Monotheist0";
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// State Management
let currentPage = 1;
let isAnimating = false;
let projectsLoaded = false;
let soundEnabled = false;
let audioContext = null;

// Backup Projects (Fallback)
const backupProjects = [
  {
    name: "Islamic Text Dataset",
    description:
      "OCR'd 50+ Islamic books, tafsirs, and collected text versions of Quran and Hadith to feed AI models for Islamic studies and research.",
    language: "Python",
    stargazers_count: 0,
    forks_count: 0,
    html_url: "https://github.com/Monotheist0",
  },
];

// ============================================
// Audio Functions
// ============================================

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn("Web Audio API not supported");
  }
}

function playFlipSound() {
  if (!soundEnabled || !audioContext) return;

  const duration = 0.3;
  const sampleRate = audioContext.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.Q.setValueAtTime(0.5, audioContext.currentTime);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  noiseSource.start(audioContext.currentTime);
  noiseSource.stop(audioContext.currentTime + duration);

  // Optional: Haptic feedback on mobile
  if ("vibrate" in navigator) {
    navigator.vibrate(30);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.querySelector(".sound-icon");
  if (icon) {
    icon.textContent = soundEnabled ? "🔊" : "🔇";
  }
  localStorage.setItem("soundEnabled", soundEnabled);

  if (soundEnabled) {
    if (!audioContext) {
      initAudio();
    } else if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }
}

// ============================================
// Navigation Functions
// ============================================

function nextPage() {
  if (isAnimating || currentPage >= TOTAL_PAGES) return;

  isAnimating = true;
  document.querySelector(".book")?.classList.add("animating");
  playFlipSound();

  currentPage++;

  requestAnimationFrame(() => {
    updatePageStates();
    updateNavigation();
    updateProgressBar();
    updateDots();
  });

  // Lazy load projects when approaching page 4
  if (currentPage === 3 && !projectsLoaded) {
    loadProjects();
  }

  setTimeout(() => {
    isAnimating = false;
    document.querySelector(".book")?.classList.remove("animating");
  }, 800);
}

function prevPage() {
  if (isAnimating || currentPage <= 1) return;

  isAnimating = true;
  document.querySelector(".book")?.classList.add("animating");
  playFlipSound();

  currentPage--;

  requestAnimationFrame(() => {
    updatePageStates();
    updateNavigation();
    updateProgressBar();
    updateDots();
  });

  setTimeout(() => {
    isAnimating = false;
    document.querySelector(".book")?.classList.remove("animating");
  }, 800);
}

function jumpToPage(pageNum) {
  if (isAnimating || pageNum === currentPage || pageNum < 1 || pageNum > TOTAL_PAGES) return;

  isAnimating = true;
  currentPage = pageNum;

  requestAnimationFrame(() => {
    updatePageStates();
    updateNavigation();
    updateProgressBar();
    updateDots();
  });

  playFlipSound();

  setTimeout(() => {
    isAnimating = false;
  }, 800);
}

function updatePageStates(isInstant = false) {
  const pages = document.querySelectorAll(".page");

  pages.forEach((page) => {
    const pageNumber = parseInt(page.dataset.page);

    if (isInstant) {
      page.classList.add("no-transition");
    } else {
      page.classList.remove("no-transition");
    }

    if (pageNumber < currentPage) {
      page.classList.add("flipped");
      page.classList.remove("current");
      page.style.transform = `rotateY(-180deg) translateZ(${(currentPage - pageNumber) * 2}px)`;
    } else if (pageNumber === currentPage) {
      page.classList.remove("flipped");
      page.classList.add("current");
      page.style.transform = `translateZ(0px)`;
    } else {
      page.classList.remove("flipped", "current");
      page.style.transform = `translateZ(-${(pageNumber - currentPage) * 2}px)`;
    }
  });

  if (isInstant) {
    setTimeout(() => {
      pages.forEach((page) => page.classList.remove("no-transition"));
    }, 20);
  }
}

function updateNavigation() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const indicator = document.getElementById("pageIndicator");

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= TOTAL_PAGES;
  if (indicator) indicator.textContent = `${currentPage} / ${TOTAL_PAGES}`;
}

function updateProgressBar() {
  const progressFill = document.getElementById("progressFill");
  if (progressFill) {
    const progress = (currentPage / TOTAL_PAGES) * 100;
    progressFill.style.width = `${progress}%`;
  }
}

function updateDots() {
  document.querySelectorAll(".dot").forEach((dot, index) => {
    if (index + 1 === currentPage) {
      dot.classList.add("active");
      dot.setAttribute("aria-selected", "true");
    } else {
      dot.classList.remove("active");
      dot.setAttribute("aria-selected", "false");
    }
  });
}

// ============================================
// Projects Loading Functions
// ============================================

async function loadProjects() {
  if (projectsLoaded) return;

  const container = document.getElementById("projectsContainer");
  if (!container) return;

  // Check cache first
  const cachedData = getCachedProjects();
  if (cachedData) {
    displayProjects(cachedData);
    projectsLoaded = true;
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    // Sort by stars, then by updated date
    repos.sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    const topRepos = repos.slice(0, 6);

    // Cache the results
    cacheProjects(topRepos);

    displayProjects(topRepos);
    projectsLoaded = true;
  } catch (error) {
    console.error("Failed to load GitHub projects:", error);
    container.innerHTML = `
      <div style="text-align: center; color: var(--royal-inactive); padding: 2rem;">
        <p>Unable to load projects from GitHub.</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Please check back later or visit my GitHub directly.</p>
      </div>
    `;
    displayProjects(backupProjects);
    projectsLoaded = true;
  }
}

function getCachedProjects() {
  try {
    const cached = localStorage.getItem("github_repos");
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (1 hour)
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired
    localStorage.removeItem("github_repos");
    return null;
  } catch (e) {
    return null;
  }
}

function cacheProjects(data) {
  try {
    localStorage.setItem(
      "github_repos",
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (e) {
    console.warn("Failed to cache projects:", e);
  }
}

function displayProjects(projects) {
  const container = document.getElementById("projectsContainer");
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--royal-inactive);">
        <p>No projects available at the moment.</p>
      </div>
    `;
    return;
  }

  const projectsHTML = projects
    .map((project) => {
      const description = project.description || "No description available.";
      const language = project.language || "Unknown";
      const stars = project.stargazers_count || 0;
      const forks = project.forks_count || 0;
      const url = project.html_url || "#";

      return `
        <div class="project-card" data-url="${escapeHtml(url)}">
          <h4 class="project-title">${escapeHtml(project.name)}</h4>
          <p class="project-description">${escapeHtml(description)}</p>
          <div class="project-stats">
            <span class="language-badge">${escapeHtml(language)}</span>
            <span class="stat-item">
              <span>⭐</span>
              <span>${stars}</span>
            </span>
            <span class="stat-item">
              <span>🍴</span>
              <span>${forks}</span>
            </span>
            <a href="${escapeHtml(
              url,
            )}" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = projectsHTML;

  // Attach click handlers after DOM insertion
  container.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Don't trigger if clicking the link directly
      if (!e.target.closest(".project-link")) {
        const url = this.dataset.url;
        if (url && url !== "#") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    });
  });
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// ============================================
// Utility Functions
// ============================================

function sharePortfolio() {
  const url = window.location.href;
  const text = "Check out my portfolio - The Chronicles of Masud!";

  if (navigator.share) {
    navigator
      .share({
        title: "The Chronicles of Masud",
        text: text,
        url: url,
      })
      .catch(() => {
        // User cancelled or share failed
        copyToClipboard(url);
      });
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Link copied to clipboard!");
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("Link copied!");
  }
}

function showToast(message) {
  // Simple toast notification (you can enhance this)
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 6rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(230, 192, 123, 0.95);
    color: rgb(13, 13, 13);
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    z-index: 9999;
    font-weight: 500;
    animation: fadeInOut 2s ease-in-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function handleKeyPress(e) {
  if (e.key === "ArrowRight") {
    nextPage();
  } else if (e.key === "ArrowLeft") {
    prevPage();
  }
}

function setupWheelScrolling() {
  const scrollableAreas = document.querySelectorAll(".projects-container, .content, .skills-grid");

  scrollableAreas.forEach((area) => {
    area.addEventListener(
      "wheel",
      function (e) {
        const hasScrollbar = this.scrollHeight > this.clientHeight;
        const canScrollUp = e.deltaY < 0 && this.scrollTop > 0;
        const canScrollDown =
          e.deltaY > 0 && this.scrollTop < this.scrollHeight - this.clientHeight;

        if (hasScrollbar && (canScrollUp || canScrollDown)) {
          e.stopPropagation();
        }
      },
      { passive: true },
    );
  });
}

function setupTouchNavigation() {
  // Only setup touch if supported
  if (!("ontouchstart" in window)) return;

  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener(
    "touchstart",
    function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    function (e) {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger page flip if clearly horizontal swipe
      if (
        Math.abs(deltaX) > FLIP_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY) * FLIP_MULTIPLIER
      ) {
        if (deltaX > 0) {
          prevPage();
        } else {
          nextPage();
        }
      }
    },
    { passive: true },
  );
}

function updateCopyright() {
  const copyrightEl = document.querySelector(".copyright");
  if (copyrightEl) {
    const year = new Date().getFullYear();
    copyrightEl.textContent = `© ${year} MD Masud Ur Rahman`;
  }
}

// ============================================
// Initialization
// ============================================

function initBook() {
  // Set initial page states
  updatePageStates(true);
  updateNavigation();
  updateProgressBar();
  updateDots();

  // Load sound preference
  const savedSound = localStorage.getItem("soundEnabled");
  if (savedSound === "true") {
    soundEnabled = true;
    const icon = document.querySelector(".sound-icon");
    if (icon) icon.textContent = "🔊";
    initAudio();
  }

  // Setup event listeners
  document.addEventListener("keydown", handleKeyPress);
  setupWheelScrolling();
  setupTouchNavigation();

  // Lazy load projects
  loadProjects();

  // Update copyright year
  updateCopyright();

  // Sound toggle
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) {
    soundToggle.addEventListener("click", toggleSound);
  }

  // Share button
  const shareBtn = document.querySelector(".share-button");
  if (shareBtn) {
    shareBtn.addEventListener("click", sharePortfolio);
  }

  // Setup click areas via event delegation (removes HTML onclick)
  const book = document.querySelector(".book");
  if (book) {
    book.addEventListener("click", function (e) {
      const clickArea = e.target.closest(".click-area");
      if (!clickArea) return;

      if (clickArea.classList.contains("left")) {
        prevPage();
      } else if (clickArea.classList.contains("right")) {
        nextPage();
      }
    });
  }
}

// ============================================
// Initialize on DOM Load
// ============================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBook);
} else {
  initBook();
}

// Expose jumpToPage globally for dot navigation
window.jumpToPage = jumpToPage;
