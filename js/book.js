// Book navigation state
let currentPage = 1;
const totalPages = 7;
let isAnimating = false;
let projectsLoaded = false;
let soundEnabled = false;
let audioContext = null;

// Backup projects data
const backupProjects = [
  {
    name: "Islamic Text Dataset",
    description:
      "OCR'd 50+ Islamic books, tafsirs, and collected text versions of Quran and Hadith to feed AI models for Islamic studies and research.",
    language: "Python",
    stargazers_count: 0,
    forks_count: 0,
    html_url: "#",
  },
];

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.log("Web Audio API not supported");
  }
}

// Initialize the book
function initBook() {
  // Call updatePageStates immediately, with 'true' to set state instantly
  updatePageStates(true);
  updateNavigation();
  updateProgressBar();
  updateDots();

  const savedSound = localStorage.getItem("soundEnabled");
  if (savedSound === "true") {
    soundEnabled = true;
    document.querySelector(".sound-icon").textContent = "🔊";
  }
  loadProjects();
  // Add keyboard navigation
  document.addEventListener("keydown", handleKeyPress);
}

function playFlipSound() {
  if (!soundEnabled || !audioContext) return;

  // --- Create White Noise ---
  const duration = 0.3; // Sound duration in seconds
  const sampleRate = audioContext.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // Generate random noise
  }

  // --- Create Source Node ---
  const noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;

  // --- Create Filter (The "Whoosh" part) ---
  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.Q.setValueAtTime(0.5, audioContext.currentTime);

  // --- Create Volume Control (The Fade) ---
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  // <-- THIS IS THE CHANGE: 0.1 is now 0.05 -->
  gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.05); // Swell up (but quieter)

  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration); // Fade out

  // --- Connect everything together ---
  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // --- Play ---
  noiseSource.start(audioContext.currentTime);
  noiseSource.stop(audioContext.currentTime + duration);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.querySelector(".sound-icon");
  icon.textContent = soundEnabled ? "🔊" : "🔇";
  localStorage.setItem("soundEnabled", soundEnabled);

  if (soundEnabled) {
    if (!audioContext) {
      // Create audio context for the first time
      initAudio();
    } else if (audioContext.state === "suspended") {
      // Resume it if it was created but suspended by the browser
      audioContext.resume();
    }
  }
}

// Handle keyboard navigation
function handleKeyPress(e) {
  if (e.key === "ArrowRight") {
    nextPage();
  } else if (e.key === "ArrowLeft") {
    prevPage();
  }
}

function sharePortfolio() {
  const url = window.location.href;
  const text = "Check out my portfolio - The Chronicles of Masud!";

  if (navigator.share) {
    navigator.share({
      title: "The Chronicles of Masud",
      text: text,
      url: url,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    });
  }
}

function updateDots() {
  document.querySelectorAll(".dot").forEach((dot, index) => {
    if (index + 1 === currentPage) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

function updateProgressBar() {
  const progressFill = document.getElementById("progressFill");
  const progress = (currentPage / totalPages) * 100;
  progressFill.style.width = `${progress}%`;
}

function jumpToPage(pageNum) {
  if (isAnimating || pageNum === currentPage || pageNum < 1 || pageNum > totalPages) return;

  isAnimating = true;
  currentPage = pageNum;

  updatePageStates();
  updateNavigation();
  updateProgressBar();
  updateDots();
  playFlipSound();

  setTimeout(() => {
    isAnimating = false;
  }, 800);
}

// Navigate to next page
function nextPage() {
  if (isAnimating || currentPage >= totalPages) return;

  isAnimating = true;
  document.querySelector(".book").classList.add("animating");
  playFlipSound();
  // 1. Increment the page number FIRST
  currentPage++;

  // 2. Call updatePageStates to trigger the animation
  updatePageStates();
  updateNavigation();
  updateProgressBar();
  updateDots();

  if (currentPage === 3 && !projectsLoaded) {
    loadProjects();
  }
  // 3. Set timeout ONLY to reset the animation flag
  setTimeout(() => {
    isAnimating = false;
    document.querySelector(".book").classList.remove("animating");
  }, 800); // 800ms matches your CSS transition
}

// Navigate to previous page
function prevPage() {
  if (isAnimating || currentPage <= 1) return;

  isAnimating = true;
  document.querySelector(".book").classList.add("animating");
  playFlipSound();
  // 1. Decrement the page number FIRST
  currentPage--;

  // 2. Call updatePageStates to trigger the animation
  updatePageStates();
  updateNavigation();
  updateProgressBar();
  updateDots();

  // 3. Set timeout ONLY to reset the animation flag
  setTimeout(() => {
    isAnimating = false;
    document.querySelector(".book").classList.remove("animating");
  }, 800);
}

/**
 * This is the core logic. It sets the target state for all pages.
 * CSS transitions then animate any changes.
 * @param {boolean} isInstant - If true, apply changes instantly (for init)
 */
function updatePageStates(isInstant = false) {
  const pages = document.querySelectorAll(".page");

  pages.forEach((page) => {
    const pageNumber = parseInt(page.dataset.page);

    // Add/remove 'no-transition' class to apply changes instantly or not
    if (isInstant) {
      page.classList.add("no-transition");
    } else {
      page.classList.remove("no-transition");
    }

    // Set state based on page number relative to currentPage
    if (pageNumber < currentPage) {
      // This page is in the "past" (flipped)
      page.classList.add("flipped");
      page.classList.remove("current");
      // "Past" pages stack up from the left cover
      page.style.transform = `rotateY(-180deg) translateZ(${(currentPage - pageNumber) * 2}px)`;
    } else if (pageNumber === currentPage) {
      // This is the "present" (current page)
      page.classList.remove("flipped");
      page.classList.add("current");
      // Current page is at the "front"
      page.style.transform = `translateZ(0px)`;
    } else {
      // This page is in the "future"
      page.classList.remove("flipped");
      page.classList.remove("current");
      // "Future" pages stack up *behind* the current page
      page.style.transform = `translateZ(-${(pageNumber - currentPage) * 2}px)`;
    }
  });

  // If we set 'no-transition', remove it after a tick to allow future animations
  if (isInstant) {
    setTimeout(() => {
      pages.forEach((page) => page.classList.remove("no-transition"));
    }, 20);
  }
}

// Update navigation buttons and indicator
function updateNavigation() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const indicator = document.getElementById("pageIndicator");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  indicator.textContent = `${currentPage} / ${totalPages}`;
}

// Load projects from GitHub API
async function loadProjects() {
  if (projectsLoaded) return;

  const container = document.getElementById("projectsContainer");

  try {
    const response = await fetch("https://api.github.com/users/Monotheist0/repos");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const repos = await response.json();

    // Sort by stars, then by updated date
    repos.sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    displayProjects(repos.slice(0, 6)); // Show top 6 projects
    projectsLoaded = true;
  } catch (error) {
    console.error("Failed to load GitHub projects:", error);
    displayProjects(backupProjects);
    projectsLoaded = true;
  }
}

// Display projects in the container
function displayProjects(projects) {
  // ... (rest of your displayProjects function is perfectly fine)
  const container = document.getElementById("projectsContainer");

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
    <div class="project-card" onclick="window.open('${url}', '_blank')">
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
                              <a href="${url}" class="project-link" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
                          </div>
                      </div>
                  `;
    })
    .join("");

  container.innerHTML = projectsHTML;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initBook(); // Run the main init function

  // Attach the sound toggle listener
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) {
    soundToggle.addEventListener("click", toggleSound);
  }
});
