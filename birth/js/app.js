const Natus = (() => {

  /* ----------------------------------------------------------------------
     1. DATA STORE
     Everything lives under a few localStorage keys, namespaced "natus_".
     Each helper reads the whole array, mutates it, and writes it back —
     fine at prototype scale, and keeps every function easy to read.
  ---------------------------------------------------------------------- */
  const KEYS = {
    users: 'natus_users',
    apps: 'natus_applications',
    session: 'natus_session'
  };

  function read(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e){
      console.error('Natus.db: failed to read', key, e);
      return fallback;
    }
  }
  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* seed a demo admin account + a couple of sample applications the very
     first time the site is opened, so the dashboards never look empty */
  function seedIfEmpty(){
    if (!localStorage.getItem(KEYS.users)){
      write(KEYS.users, [
        { name:'Registry Admin', email:'admin@natus.gov', password:'admin123', role:'admin' }
      ]);
    }
    if (!localStorage.getItem(KEYS.apps)){
      write(KEYS.apps, [
        {
          regNo:'NT-2026-084213', ownerEmail:null,
          childFirstName:'Amara', childLastName:'Okafor', gender:'Female', dob:'2026-07-18',
          motherName:'Chinwe Okafor', fatherName:'Emeka Okafor',
          hospital:'Rivers State Teaching Hospital',
          status:'approved', submittedAt:'2026-07-21T09:12:00Z'
        },
        {
          regNo:'NT-2026-084214', ownerEmail:null,
          childFirstName:'Tobenna', childLastName:'Eze', gender:'Male', dob:'2026-07-23',
          motherName:'Ada Eze', fatherName:'Chuka Eze',
          hospital:'Obio-Akpor Registry Clinic',
          status:'pending', submittedAt:'2026-07-24T14:40:00Z'
        }
      ]);
    }
  }

  const db = {
    /* ---- users ---- */
    getUsers(){ return read(KEYS.users, []); },
    findUser(email){
      return db.getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase());
    },
    createUser({ name, email, password }){
      const users = db.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())){
        throw new Error('An account with this email already exists.');
      }
      const user = { name, email, password, role: 'parent' };
      users.push(user);
      write(KEYS.users, users);
      return user;
    },

    /* ---- applications ---- */
    getApplications(){ return read(KEYS.apps, []); },
    getApplicationsForUser(email){
      return db.getApplications().filter(a => a.ownerEmail && a.ownerEmail.toLowerCase() === email.toLowerCase());
    },
    findApplication(regNo){
      return db.getApplications().find(a => a.regNo === regNo);
    },
    createApplication(data){
      const apps = db.getApplications();
      const regNo = 'NT-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 899999);
      const record = {
        regNo,
        ownerEmail: data.ownerEmail || null,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ...data
      };
      apps.unshift(record);
      write(KEYS.apps, apps);
      return record;
    },
    updateApplicationStatus(regNo, status){
      const apps = db.getApplications();
      const rec = apps.find(a => a.regNo === regNo);
      if (rec) rec.status = status;
      write(KEYS.apps, apps);
      return rec;
    }
  };

  /* ----------------------------------------------------------------------
     2. AUTH
     Session is just { name, email, role } saved to localStorage. Not real
     security (nothing here is hashed) — this is a UI prototype, and the
     comments below flag that clearly wherever it matters.
  ---------------------------------------------------------------------- */
  const auth = {
    signup({ name, email, password }){
      const user = db.createUser({ name, email, password });
      auth.setSession(user);
      return user;
    },
    login(email, password){
      const user = db.findUser(email);
      if (!user || user.password !== password){
        throw new Error('Incorrect email or password.');
      }
      auth.setSession(user);
      return user;
    },
    adminLogin(email, password){
      const user = db.findUser(email);
      if (!user || user.role !== 'admin' || user.password !== password){
        throw new Error('Incorrect admin credentials.');
      }
      auth.setSession(user);
      return user;
    },
    setSession(user){
      write(KEYS.session, { name: user.name, email: user.email, role: user.role });
    },
    getSession(){ return read(KEYS.session, null); },
    logout(){
      localStorage.removeItem(KEYS.session);
      window.location.href = 'index.html';
    },
    /* call at the top of any protected page: redirects if not logged in
       (or not the right role), otherwise returns the session object */
    requireRole(role){
      const session = auth.getSession();
      if (!session || (role && session.role !== role)){
        window.location.href = role === 'admin' ? 'admin-login.html' : 'parentlog.html';
        return null;
      }
      return session;
    }
  };

  /* ----------------------------------------------------------------------
     3. TOASTS
  ---------------------------------------------------------------------- */
  function toast(message, type = 'info'){
    let stack = document.querySelector('.toast-stack');
    if (!stack){
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'ok' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ----------------------------------------------------------------------
     4. FLOATING NAVIGATION
     Builds the toggle button + slide-up panel described in style.css
     section 4. `links` is an array of { label, href, icon, current }.
     A logout link is appended automatically when a session exists.
  ---------------------------------------------------------------------- */
  const nav = {
    init(links){
      const toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;

      const panel = document.createElement('nav');
      panel.className = 'nav-panel';

      const session = auth.getSession();
      const linkHTML = links.map(l => `
        <a class="nav-link ${l.current ? 'is-current' : ''}" href="${l.href}">
          <i class="fa-solid ${l.icon}"></i> ${l.label}
        </a>`).join('');

      const sessionHTML = session ? `
        <div class="nav-divider"></div>
        <a class="nav-link danger" href="#" id="natus-logout">
          <i class="fa-solid fa-right-from-bracket"></i> Log out (${session.name.split(' ')[0]})
        </a>` : '';

      panel.innerHTML = `
        <div class="nav-brand"><span class="dot"></span><strong>NATUS</strong></div>
        ${linkHTML}
        ${sessionHTML}
      `;

      document.body.appendChild(toggle);
      document.body.appendChild(panel);

      toggle.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('is-open');
        toggle.classList.toggle('is-open', isOpen);
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !toggle.contains(e.target)){
          panel.classList.remove('is-open');
          toggle.classList.remove('is-open');
        }
      });

      const logoutBtn = document.getElementById('natus-logout');
      if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); auth.logout(); });
    }
  };

  /* ----------------------------------------------------------------------
     5. SMALL UI EFFECTS
  ---------------------------------------------------------------------- */
  const fx = {
    /* fades/slides elements with class="reveal" up into view as they enter
       the viewport — used across the landing page sections */
    initReveal(){
      const items = document.querySelectorAll('.reveal');
      if (!items.length) return;
      // "arm" each element now that we know JS is running — this is what
      // actually hides them before animating in (see style.css comment)
      items.forEach(el => el.classList.add('reveal-armed'));
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting){
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      items.forEach(el => io.observe(el));
    },
    /* counts a <h2 class="counter" data-target="1234"> up from 0 */
    initCounters(){
      document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.dataset.target, 10) || 0;
        const duration = 1400;
        const start = performance.now();
        function tick(now){
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    /* live clock used on dashboards */
    initClock(dateId = 'currentDate', timeId = 'currentTime'){
      const dateEl = document.getElementById(dateId);
      const timeEl = document.getElementById(timeId);
      if (!dateEl || !timeEl) return;
      function tick(){
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        timeEl.textContent = now.toLocaleTimeString();
      }
      tick();
      setInterval(tick, 1000);
    }
  };

  seedIfEmpty();

  return { db, auth, toast, nav, fx };
})();
