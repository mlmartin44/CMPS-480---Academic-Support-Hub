// app/api.js
// Client helpers with auto base URL + StudyGroups + Home + Resources

(function () {
  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Local dev → Node on 5000, Jail → /project/api (nginx proxy)
  const DEFAULT_BASE = isLocal ? 'http://localhost:5000/api' : '/project/api';

  function getApiBaseUrl() {
    return DEFAULT_BASE;
  }

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

  const Home = {
    get: () => request('/home')
  };

  const StudyGroups = {
    list: ({ course = '' } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set('course', course);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request(`/study-groups${suffix}`);
    },
    create: (payload) =>
      request('/study-groups', {
        method: 'POST',
        body: JSON.stringify({ course: payload.course, title: payload.title })
      }),
    join: (id, name) =>
      request(`/study-groups/${encodeURIComponent(id)}/join`, {
        method: 'POST',
        body: JSON.stringify({ name })
      })
  };

  const Resources = {
    list: ({ course = '', search = '' } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set('course', course);
      if (search) qs.set('search', search);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request(`/resources${suffix}`);
    },
    create: (payload) =>
      request('/resources', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  };

const Planner = {

list: (userEmail) => {
        if (!userEmail) throw new Error("User email is required to load assignments.");
        const qs = new URLSearchParams({ email: userEmail });
        const suffix = `?${qs.toString()}`;
        return request(`/assignments${suffix}`); 
    },
  
    create: (payload) =>
        request('/planner', {
            method: 'POST',
            body: JSON.stringify(payload)
        })
};

  window.API = {
    getApiBaseUrl,
    Home,
    StudyGroups,
    Resources,
    Planner
  };
})();