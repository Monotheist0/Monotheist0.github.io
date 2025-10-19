// Book navigation state
let currentPage = 1;
const totalPages = 7;
let isAnimating = false;
let projectsLoaded = false;

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

// Initialize the book
function initBook() {
  // Call updatePageStates immediately, with 'true' to set state instantly
  updatePageStates(true);
  updateNavigation();
  loadProjects();

  // Add keyboard navigation
  document.addEventListener("keydown", handleKeyPress);
  const projectsContainer = document.getElementById("projectsContainer");
  if (projectsContainer) {
    projectsContainer.addEventListener("wheel", function (e) {
      // Check if the container is actually scrollable
      const hasScrollbar = this.scrollHeight > this.clientHeight;
      if (hasScrollbar) {
        // Stop the scroll event from bubbling up to the body
        e.stopPropagation();
      }
    });
  }

  // Add touch support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", function (e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    if (Math.abs(touchEndX - touchStartX) > 50) {
      if (touchEndX < touchStartX) {
        nextPage();
      } else {
        prevPage();
      }
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

// Navigate to next page
function nextPage() {
  if (isAnimating || currentPage >= totalPages) return;

  isAnimating = true;
  document.querySelector(".book").classList.add("animating");

  // 1. Increment the page number FIRST
  currentPage++;

  // 2. Call updatePageStates to trigger the animation
  updatePageStates();
  updateNavigation();

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

  // 1. Decrement the page number FIRST
  currentPage--;

  // 2. Call updatePageStates to trigger the animation
  updatePageStates();
  updateNavigation();

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
  // ... (rest of your loadProjects function is perfectly fine)
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
document.addEventListener("DOMContentLoaded", initBook);
