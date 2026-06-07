class Router {
  constructor() {
    this.routes = [];
    this.current = null;
    window.addEventListener('hashchange', () => this._dispatch());
  }

  on(pattern, handler) {
    this.routes.push({ pattern: new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'), handler, pattern });
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    this._dispatch();
  }

  _dispatch() {
    const hash = window.location.hash.slice(1) || '/';
    this.current = hash;

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(el => {
      const href = el.getAttribute('href');
      if (!href) return;
      const linkPath = href.startsWith('#') ? href.slice(1) : href;
      el.classList.toggle('active', linkPath === hash);
    });

    for (const route of this.routes) {
      const match = hash.match(route.pattern);
      if (match) {
        const params = {};
        const keys = (route.pattern.source.match(/\([^)]+\)/g) || []);
        match.slice(1).forEach((val, i) => { params[`p${i}`] = val; });
        route.handler({ path: hash, params, match });
        return;
      }
    }
  }
}

export const router = new Router();
