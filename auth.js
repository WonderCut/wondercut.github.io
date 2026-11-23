// WonderCut accounts on the website. The API is a Cloudflare Worker; the
// session token lives in localStorage and goes out as a bearer header.
(function () {
  var API = 'https://wondercut-accounts.wondercut.workers.dev/api';
  var KEY = 'wc_session';
  var root = document.documentElement.getAttribute('data-root') || './';

  function token() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setToken(t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} }

  function call(path, body) {
    var headers = { 'content-type': 'application/json' };
    var t = token();
    if (t) headers.authorization = 'Bearer ' + t;
    return fetch(API + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var err = new Error(data.error || 'Something went wrong. Try again.'); err.status = r.status; throw err; }
        return data;
      });
    }, function () { throw new Error('Couldn’t reach WonderCut. Check your connection and try again.'); });
  }

  // Nav: "Log in" becomes "Account" once signed in.
  var navLink = document.querySelector('nav a[data-auth-nav]');
  if (navLink && token()) { navLink.textContent = 'Account'; navLink.href = root + 'account/'; }

  function bindForm(form, submit) {
    var msg = form.querySelector('.form-error');
    var button = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.textContent = '';
      button.disabled = true;
      var fields = {};
      new FormData(form).forEach(function (v, k) { fields[k] = v; });
      submit(fields).catch(function (err) { msg.textContent = err.message; button.disabled = false; });
    });
  }

  var login = document.getElementById('login-form');
  if (login) {
    if (token()) location.replace(root + 'account/');
    bindForm(login, function (f) {
      return call('/login', { email: f.email, password: f.password }).then(function (d) {
        setToken(d.token); location.href = root + 'account/';
      });
    });
  }

  var signup = document.getElementById('signup-form');
  if (signup) {
    if (token()) location.replace(root + 'account/');
    bindForm(signup, function (f) {
      if (f.password !== f.confirm) return Promise.reject(new Error('The two passwords don’t match.'));
      if (!f.agree) return Promise.reject(new Error('Please agree to the Terms of Service and Privacy Policy.'));
      return call('/signup', { name: f.name, email: f.email, password: f.password }).then(function (d) {
        setToken(d.token); location.href = root + 'account/';
      });
    });
  }

  var account = document.getElementById('account');
  if (account) {
    if (!token()) { location.replace(root + 'login/'); return; }
    call('/me').then(function (d) {
      var u = d.user;
      function set(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
      set('acct-first', u.name.split(' ')[0]);
      set('acct-name', u.name);
      set('acct-email', u.email);
      set('acct-since', new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
      set('acct-status', u.status === 'alpha' ? 'Active' : 'Waitlist');
      document.querySelectorAll('[data-status]').forEach(function (el) {
        el.hidden = el.getAttribute('data-status') !== u.status;
      });
      account.hidden = false;
      document.getElementById('account-loading').hidden = true;
    }, function (err) {
      if (err.status === 401) { setToken(null); location.replace(root + 'login/'); return; }
      document.getElementById('account-loading').textContent = err.message;
    });

    document.getElementById('logout').addEventListener('click', function () {
      var done = function () { setToken(null); location.href = root; };
      call('/logout', {}).then(done, done);
    });

    var del = document.getElementById('delete-form');
    bindForm(del, function (f) {
      if (!confirm('Delete your WonderCut account? This can’t be undone.')) {
        del.querySelector('button[type=submit]').disabled = false;
        return Promise.resolve();
      }
      return call('/delete-account', { password: f.password }).then(function () {
        setToken(null); location.href = root + '?deleted=1';
      });
    });
  }
})();
