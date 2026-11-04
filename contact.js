// The contact address is assembled only when a contact link is clicked, so it
// never appears as text on the page (keeps it away from scrapers and search).
(function () {
  var c = [59, 49, 51, 54, 59, 49, 59, 44, 51, 41, 51, 52, 61, 50, 63, 107, 99, 99, 99, 26, 61, 55, 59, 51, 54, 116, 57, 53, 55];
  function address() {
    return c.map(function (n) { return String.fromCharCode(n ^ 90); }).join('');
  }
  document.querySelectorAll('a[data-contact]').forEach(function (a) {
    a.href = '#contact';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var subject = a.getAttribute('data-subject');
      location.href = 'mailto:' + address() + (subject ? '?subject=' + encodeURIComponent(subject) : '');
    });
  });
})();
