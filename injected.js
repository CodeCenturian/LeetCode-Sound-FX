// Runs in MAIN world (page JS context) via manifest content_scripts.
// No DOM injection needed — CSP is bypassed by the browser itself.

(function () {
  'use strict';

  function isCheckUrl(url) {
    if (!url) return false;
    const s = url.toString();
    return (
      (s.includes('/submissions/detail/') && s.includes('/check/')) ||
      s.includes('/check/')
    );
  }

  function handleData(data) {
    if (!data || data.state !== 'SUCCESS' || !data.status_msg) return;
    window.dispatchEvent(
      new CustomEvent('lc-result', { detail: { status: data.status_msg } })
    );
  }

  // ── Fetch interception ──────────────────────────────────────────────────────
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = args[0]?.toString?.() || args[0]?.url?.toString() || '';

    if (isCheckUrl(url)) {
      response
        .clone()
        .json()
        .then(handleData)
        .catch(() => {});
    }

    return response;
  };

  // ── XHR interception (fallback for older LeetCode API paths) ───────────────
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._lcUrl = url ? url.toString() : '';
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (isCheckUrl(this._lcUrl)) {
      this.addEventListener('load', function () {
        try {
          handleData(JSON.parse(this.responseText));
        } catch (_) {}
      });
    }
    return origSend.apply(this, args);
  };
})();