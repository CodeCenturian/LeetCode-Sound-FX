// Runs in MAIN world (page JS context) via manifest content_scripts.
// No DOM injection needed — CSP is bypassed by the browser itself.

(function () {
  'use strict';

  // Match both the legacy REST check endpoint AND the GraphQL endpoint
  function isCheckUrl(url) {
    if (!url) return false;
    const s = url.toString();
    return (
      (s.includes('/submissions/detail/') && s.includes('/check/')) ||
      s.includes('/check/')
    );
  }

  // GraphQL responses use a different shape — unwrap them here
  function extractStatus(data) {
    if (!data) return null;

    // Legacy REST shape: { state: "SUCCESS", status_msg: "Accepted" }
    if (data.state === 'SUCCESS' && data.status_msg) {
      return data.status_msg;
    }

    // GraphQL shape (submissionDetails query):
    // { data: { submissionDetails: { statusDisplay: "Accepted" } } }
    const sd = data?.data?.submissionDetails;
    if (sd?.statusDisplay) return sd.statusDisplay;

    // GraphQL shape (interpret_solution / run code):
    // { data: { interpret_solution: { status_msg: "Accepted" } } }
    const is = data?.data?.interpret_solution;
    if (is?.status_msg) return is.status_msg;

    // GraphQL mutation shape (submit):
    // { data: { submitSolution: { result: { statusDisplay: "Accepted" } } } }
    const ss = data?.data?.submitSolution?.result;
    if (ss?.statusDisplay) return ss.statusDisplay;

    return null;
  }

  function handleData(data) {
    const status = extractStatus(data);
    if (!status) return;
    document.dispatchEvent(
      new CustomEvent('lc-result', {
        detail: { status },
        bubbles: true,
        composed: true
      })
    );
  }

  // ── Fetch interception ──────────────────────────────────────────────────────
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url =
        (args[0] && typeof args[0] === 'string')
          ? args[0]
          : (args[0]?.url ?? '');
      const urlStr = url.toString();

      // Intercept both the legacy check endpoint and the GraphQL endpoint
      const isLegacyCheck = isCheckUrl(urlStr);
      const isGraphQL =
        urlStr.includes('/graphql') || urlStr.includes('/graphql/');

      if (isLegacyCheck || isGraphQL) {
        response
          .clone()
          .json()
          .then(handleData)
          .catch(() => {});
      }
    } catch (_) {}

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
    const url = this._lcUrl || '';
    const isLegacyCheck = isCheckUrl(url);
    const isGraphQL = url.includes('/graphql');

    if (isLegacyCheck || isGraphQL) {
      this.addEventListener('load', function () {
        try {
          handleData(JSON.parse(this.responseText));
        } catch (_) {}
      });
    }
    return origSend.apply(this, args);
  };
})();