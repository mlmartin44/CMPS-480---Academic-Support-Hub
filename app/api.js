// app/api.js
// Client helpers with auto base URL detection for Local + Jail (/api or /project/api)

(function () {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Candidates in production. We’ll auto-pick whichever responds.
  const PROD_CANDIDATES = ["/project/api", "/api"];

  // Local dev base
  const LOCAL_BASE = "http://localhost:5000/api";

  // Cached chosen base
  let _base = isLocal ? LOCAL_BASE : null;

  function getApiBaseUrl() {
    // If base already determined, use it
    if (_base) return _base;

    // Fallback if something calls this before detection finishes
    // (we’ll still do detection automatically below)
    return "/api";
  }

  async function detectBase() {
    if (isLocal) {
      _base = LOCAL_BASE;
      return _base;
    }
    if (_base) return _base;

    // Try each candidate with a lightweight ping
    for (const candidate of PROD_CANDIDATES) {
      try {
        const res = await fetch(`${candidate}/health`, { cache: "no-store" });
        if (res.ok) {
          _base = candidate;
          return _base;
        }
      } catch (_) {
        // ignore and try next
      }
    }

    // If none worked, default to /api (most common)
    _base = "/api";
    return _base;
  }

  async function request(path, opts = {}) {
    // Ensure base is detected before any request
    await detectBase();

    const base = getApiBaseUrl();
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      ...opts,
    });

    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error || body?.message) msg = body.error || body.message;
      } catch (_) {}
      throw new Error(msg);
    }

    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  }

  // ---------------- HOME ----------------
  const Home = {
    get: () => request("/home"),
  };

  // ---------------- STUDY GROUPS ----------------
  const StudyGroups = {
    list: ({ course = "" } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set("course", course);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request(`/study-groups${suffix}`);
    },

    create: (payload) =>
      request("/study-groups", {
        method: "POST",
        body: JSON.stringify({ course: payload.course, title: payload.title }),
      }),

    join: (id, name) =>
      request(`/study-groups/${encodeURIComponent(id)}/join`, {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
  };

  // ---------------- RESOURCES ----------------
  const Resources = {
    list: ({ course = "", search = "" } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set("course", course);
      if (search) qs.set("search", search);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request(`/resources${suffix}`);
    },

    create: (payload) =>
      request("/resources", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  // ---------------- PLANNER ----------------
  const Planner = {
    list: (userEmail) => {
      const qs = new URLSearchParams({ email: userEmail });
      return request(`/assignments?${qs.toString()}`);
    },

    create: (payload) =>
      request("/assignments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };

  // Kick off detection ASAP so UI feels fast
  detectBase().catch(() => {});

  window.API = {
    getApiBaseUrl,
    Home,
    StudyGroups,
    Resources,
    Planner,
  };
})();
