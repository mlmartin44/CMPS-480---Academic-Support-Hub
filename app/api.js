// app/api.js
// Teammates: add your own client helpers in the TODO sections below.

(function () {
  const KEY = 'apiBaseUrl';

  function setApiBaseUrl(url) {
    if (!url) throw new Error('Missing URL');
    const clean = url.replace(/\/$/, '');
    localStorage.setItem(KEY, clean);
    return clean;
  }

  function getApiBaseUrl() {
    const val = localStorage.getItem(KEY) || '';
    if (!val) throw new Error('Set API base URL first.');
    return val;
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

 
  // UC-1: Study Groups (Mariah)
 
  const StudyGroups = {
    list: ({ course = '', tag = '' } = {}) => {
      const qs = new URLSearchParams();
      if (course) qs.set('course', course);
      if (tag) qs.set('tag', tag);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request(`/api/study-groups${suffix}`);
    },
    create: (payload) =>
      request('/api/study-groups', { method: 'POST', body: JSON.stringify(payload) }),
    join: (id, name) =>
      request(`/api/study-groups/${encodeURIComponent(id)}/join`, {
        method: 'POST',
        body: JSON.stringify({ name })
      })
  };


  // Placeholders for other use cases 
  

  // TODO (UC-2 Q&A): add client helpers, e.g.:
 

  // TODO (UC-3 Resources): add client helpers, e.g.:


  // TODO (UC-4 Planner): add client helpers, e.g.:



  // Expose only what exists now (StudyGroups). Teammates should export theirs
  window.API = { setApiBaseUrl, getApiBaseUrl, StudyGroups /* , QA, Resources, Planner */ };
})();
