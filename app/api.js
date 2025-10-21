// app/api.js
// Client helpers with auto base URL + StudyGroups helpers

(function () {
  const KEY = 'apiBaseUrl';
  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // Auto-switch: local -> http://localhost:5000/api, jail -> /project/api
  const DEFAULT_BASE = isLocal ? 'http://localhost:5000/api' : '/project/api';

  // --- Base URL management ---
  function setApiBaseUrl(url) {
    if (!url) throw new Error('Missing URL');
    const clean = url.replace(/\/$/, '');
    localStorage.setItem(KEY, clean);
    return clean;
  }

  function getApiBaseUrl() {
    return localStorage.getItem(KEY) || DEFAULT_BASE;
  }

  // --- Request helper ---
  async function request(path, opts = {}) {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts
    });
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error || body?.message) msg = body.error || body.message;
      } catch (_) {}
      throw new Error(msg);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

 
  // UC-1: Study Groups (Mariah)
  // Endpoints used:
  //   GET  /api/study-groups?course=CMPS%20101
  //   POST /api/study-groups { course, title }
  //   POST /api/study-groups/:id/join { name }

  const StudyGroups = {
    list: ({ course = '' } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set('course', course);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request(`/study-groups${suffix}`);
    },
    create: (payload) => {
      // Expect payload: { course: 'CMPS 101', title: 'Study Group 1', ... }
      const formatted = {
        course: payload.course,
        title: payload.title
        // when/where/maxSize omitted here since DB stores only name+course
      };
      return request('/study-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatted)
      });
    },
    join: (id, name) =>
      request(`/study-groups/${encodeURIComponent(id)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
  };


  // Placeholders for other use cases 

  // const QA = { ... }
  // const Resources = { ... }
  // const Planner = { ... }

  window.API = {
    setApiBaseUrl,
    getApiBaseUrl,
    StudyGroups
    // QA,
    // Resources,
    // Planner
  };
})();
