// app/api.js
// Client helpers with auto base URL detection for Local + Jail (/api or /project/api)

(function () {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const PROD_CANDIDATES = ["/project/api", "/api"];
  const LOCAL_BASE = "http://localhost:5000/api";

  let _base = isLocal ? LOCAL_BASE : null;

  function getApiBaseUrl() {
    return _base || "/api";
  }

  async function detectBase() {
    if (isLocal) {
      _base = LOCAL_BASE;
      return _base;
    }
    if (_base) return _base;

    // Use a REAL endpoint to detect (health can lie depending on nginx)
    const testPath = "/resources";

    for (const candidate of PROD_CANDIDATES) {
      try {
        const res = await fetch(`${candidate}${testPath}`, { cache: "no-store" });
        if (res.ok) {
          _base = candidate;
          return _base;
        }
      } catch (_) {
        // try next
      }
    }

    _base = "/api";
    return _base;
  }

  async function request(path, opts = {}) {
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

  const Home = {
    get: () => request("/home"),
  };

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

  // Detect early
  detectBase().catch(() => {});

  window.API = {
    getApiBaseUrl,
    Home,
    StudyGroups,
    Resources,
    Planner,
  };
})();
