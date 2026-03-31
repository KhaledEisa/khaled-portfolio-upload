const usernameInput = document.getElementById("username");
const loadReposBtn = document.getElementById("loadReposBtn");
const repoGrid = document.getElementById("repoGrid");
const statusText = document.getElementById("statusText");
const repoCount = document.getElementById("repoCount");
const starCount = document.getElementById("starCount");
const followerCount = document.getElementById("followerCount");

const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

const LAST_USERNAME_KEY = "portfolio-github-username";
const DEFAULT_USERNAME = "KhaledEisa";
const FEATURED_REPOS = new Set([
  "Sign-Language-ML",
  "QR-Cart-Shopping-System",
  "Health-Center-DB",
  "HMK-Charity",
]);

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function setLoadingState(isLoading, message = "") {
  loadReposBtn.disabled = isLoading;
  loadReposBtn.textContent = isLoading ? "Loading..." : "Refresh";
  if (message) {
    statusText.textContent = message;
  }
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRepos(repos) {
  repoGrid.innerHTML = "";

  if (!repos.length) {
    repoGrid.innerHTML = `<p>No public repositories found.</p>`;
    return;
  }

  repos.forEach((repo) => {
    const card = document.createElement("article");
    card.className = "repo-card";

    const language = repo.language ? `<span class="badge">${repo.language}</span>` : "";
    const safeName = escapeHtml(repo.name);
    const safeDescription = escapeHtml(repo.description || "No description provided.");

    card.innerHTML = `
      <h3 class="repo-title"><a href="${repo.html_url}" target="_blank" rel="noreferrer">${safeName}</a></h3>
      <p class="repo-desc">${safeDescription}</p>
      <div class="repo-meta">
        <span class="badge">★ ${repo.stargazers_count}</span>
        <span class="badge">⑂ ${repo.forks_count}</span>
        ${language}
        <span class="badge">Updated ${formatDate(repo.updated_at)}</span>
      </div>
    `;

    repoGrid.appendChild(card);
  });
}

async function fetchGitHubData(username) {
  const headers = {
    Accept: "application/vnd.github+json",
  };

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers }),
  ]);

  if (userRes.status === 404) {
    throw new Error("GitHub user not found.");
  }

  if (!userRes.ok || !reposRes.ok) {
    throw new Error("Could not load data from GitHub. Try again in a moment.");
  }

  const user = await userRes.json();
  const repos = await reposRes.json();

  return { user, repos };
}

function sortRepos(repos) {
  return [...repos]
    .filter((repo) => !repo.fork && !FEATURED_REPOS.has(repo.name))
    .sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at) - new Date(a.updated_at);
    })
    .slice(0, 12);
}

async function loadRepos() {
  const username = (usernameInput.value || DEFAULT_USERNAME).trim();

  if (!username) {
    statusText.textContent = "Please enter a GitHub username.";
    return;
  }

  localStorage.setItem(LAST_USERNAME_KEY, username);
  setLoadingState(true, "Loading repositories...");

  try {
    const { user, repos } = await fetchGitHubData(username);
    const featured = sortRepos(repos);

    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    repoCount.textContent = `Repositories: ${user.public_repos}`;
    starCount.textContent = `Total Stars: ${totalStars}`;
    followerCount.textContent = `Followers: ${user.followers}`;

    renderRepos(featured);
    statusText.textContent = `Showing ${featured.length} additional repositories for @${username}`;
  } catch (error) {
    repoGrid.innerHTML = "";
    statusText.textContent = error.message;
  } finally {
    setLoadingState(false);
  }
}

loadReposBtn.addEventListener("click", loadRepos);
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    loadRepos();
  }
});

const savedUsername = localStorage.getItem(LAST_USERNAME_KEY);
usernameInput.value = savedUsername || DEFAULT_USERNAME;
loadRepos();
