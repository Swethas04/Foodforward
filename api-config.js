/** API base URL: same origin on port 5000, otherwise localhost:5000 */
(function () {
  const host = window.location.hostname || "localhost";
  const port = window.location.port;
  const proto = window.location.protocol;

  if (proto === "file:") {
    window.API_BASE = "http://localhost:5000";
  } else if (port === "5000") {
    window.API_BASE = "";
  } else {
    window.API_BASE = `http://${host}:5000`;
  }

  window.apiUrl = function (path) {
    if (!path.startsWith("/")) path = "/" + path;
    return window.API_BASE + path;
  };
})();
