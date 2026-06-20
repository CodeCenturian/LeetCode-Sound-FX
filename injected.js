// Runs in MAIN world (page JS context) via manifest content_scripts.

(function () {
  'use strict';

  // Set window.__lcSoundFxDebug = true in the page console to see which
  // signal (click intent / id tracking / data shape / url hint) decided
  // the eventType for each result. Handy for diagnosing API drift.
  function dbg(...args) {
    if (window.__lcSoundFxDebug) console.log('[LC Sound FX]', ...args);
  }

  // ── User-intent tracking (most reliable signal — independent of backend API
  // shape, which LeetCode changes without notice). We watch the actual Run /
  // Submit controls and keyboard shortcuts and trust THAT over anything we
  // parse out of network responses.
  let lastAction = null; // { type: 'run' | 'submit', time }

  function markAction(type) {
    lastAction = { type, time: Date.now() };
    dbg('intent captured:', type);
  }

  function recentAction(maxAgeMs = 30000) {
    if (!lastAction) return null;
    if (Date.now() - lastAction.time > maxAgeMs) return null;
    return lastAction.type;
  }

  function matchesRunControl(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[data-e2e-locator="console-run-button"]')) return true;
    const btn = el.closest('button');
    return !!btn && btn.textContent.trim().toLowerCase() === 'run';
  }

  function matchesSubmitControl(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[data-e2e-locator="console-submit-button"]')) return true;
    const btn = el.closest('button');
    return !!btn && btn.textContent.trim().toLowerCase() === 'submit';
  }

  document.addEventListener('click', (e) => {
    // Check submit first since some submit buttons may also nest a "Run" label
    if (matchesSubmitControl(e.target)) { markAction('submit'); return; }
    if (matchesRunControl(e.target)) { markAction('run'); return; }
  }, true);

  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key === 'Enter') markAction('submit');
    else if (e.key === "'") markAction('run');
  }, true);

  // ── Pending request tracker ─────────────────────────────────────────────────
  // LeetCode polls the SAME endpoint shape — /submissions/detail/<id>/check/ —
  // for both "Run" and "Submit" results, so the URL alone can't tell them apart.
  // We remember the id returned by the *initiating* request (interpret_solution
  // -> interpret_id, submit -> submission_id) and use that id to know for sure
  // which kind a later /check/ poll belongs to.
  const pendingIds = new Map();

  function rememberId(id, kind) {
    if (id === undefined || id === null) return;
    pendingIds.set(String(id), kind);
  }

  function lookupIdFromCheckUrl(url) {
    const m = url.match(/\/submissions\/detail\/([^/]+)\/check\/?/);
    return m ? m[1] : null;
  }

  // ── URL classifiers ─────────────────────────────────────────────────────────
  function isInitiateRunUrl(url) {
    if (!url) return false;
    const s = url.toString();
    return s.includes('/interpret_solution/') || s.includes('/run_code/');
  }

  function isInitiateSubmitUrl(url) {
    if (!url) return false;
    const s = url.toString();
    return s.includes('/submit/') && !s.includes('/submissions/detail/');
  }

  function isCheckUrl(url) {
    if (!url) return false;
    const s = url.toString();
    return s.includes('/check/') && s.includes('/submissions/detail/');
  }

  function isGraphQL(url) {
    if (!url) return false;
    return url.toString().includes('/graphql');
  }

  // ── Status extraction ───────────────────────────────────────────────────────
  // Returns { status, eventType } or null
  function extractResult(data) {
    if (!data) return null;

    // ── RUN CODE paths ──────────────────────────────────────────────────────

    // Legacy REST run check: { state: "SUCCESS", status_msg: "Accepted", ... }
    // LeetCode uses run_success / compile_error / runtime_error for run
    if (data.state === 'SUCCESS' && data.run_success !== undefined) {
      let status = data.status_msg || (data.run_success ? 'Accepted' : 'Error');

      // status_msg can say "Accepted" on a Run even when not every test case
      // matched — it sometimes just means "executed without crashing". The
      // pass/fail counts (and correct_answer) are the actual source of truth.
      const totalCorrect   = Number(data.total_correct);
      const totalTestcases = Number(data.total_testcases);
      if (!Number.isNaN(totalCorrect) && !Number.isNaN(totalTestcases) && totalTestcases > 0) {
        if (totalCorrect < totalTestcases) status = 'Wrong Answer';
      } else if (data.correct_answer === false) {
        status = 'Wrong Answer';
      }

      return { status, eventType: 'run' };
    }

    // GraphQL interpret_solution (run code)
    const interp = data?.data?.interpret_solution;
    if (interp?.status_msg) {
      return { status: interp.status_msg, eventType: 'run' };
    }

    // ── SUBMIT paths ────────────────────────────────────────────────────────

    // Legacy REST submit check: { state: "SUCCESS", status_msg: "Accepted" }
    // These do NOT have run_success field
    if (data.state === 'SUCCESS' && data.status_msg && data.run_success === undefined) {
      return { status: data.status_msg, eventType: 'submit' };
    }

    // GraphQL submissionDetails query
    const sd = data?.data?.submissionDetails;
    if (sd?.statusDisplay) {
      return { status: sd.statusDisplay, eventType: 'submit' };
    }

    // GraphQL submitSolution mutation
    const ss = data?.data?.submitSolution?.result;
    if (ss?.statusDisplay) {
      return { status: ss.statusDisplay, eventType: 'submit' };
    }

    // GraphQL submit check (comes back on /graphql after polling)
    // shape: { data: { submissionResult: { statusDisplay, runSuccess } } }
    const sr = data?.data?.submissionResult;
    if (sr?.statusDisplay) {
      return { status: sr.statusDisplay, eventType: 'submit' };
    }

    return null;
  }

  // Pull interpret_id / submission_id out of the response that *kicks off*
  // a run or submit, so we can identify the matching /check/ poll later.
  function handleInitiateResponse(url, data) {
    if (!data) return;
    if (isInitiateRunUrl(url)) {
      if (data.interpret_id) rememberId(data.interpret_id, 'run');
      if (data.interpret_expected_id) rememberId(data.interpret_expected_id, 'run');
    } else if (isInitiateSubmitUrl(url)) {
      if (data.submission_id) rememberId(data.submission_id, 'submit');
    }
  }

  function handleData(url, data, urlHint) {
    const result = extractResult(data);
    if (!result) return;

    // Priority: what the user actually clicked / pressed (ground truth, immune
    //         to backend response-shape changes)
    //         > tracked id from the initiating request
    //         > data-shape detection (run_success presence, GraphQL field, etc.)
    //         > generic url hint (last-resort fallback)
    let matchedId = null;
    if (isCheckUrl(url)) {
      matchedId = lookupIdFromCheckUrl(url);
    }

    const intentType = recentAction();
    const idType = (matchedId && pendingIds.has(matchedId)) ? pendingIds.get(matchedId) : null;

    let eventType = intentType || idType || result.eventType || urlHint;

    dbg('result', { url, status: result.status, intentType, idType, dataShapeType: result.eventType, urlHint, chosen: eventType });

    window.dispatchEvent(
      new CustomEvent('lc-result', {
        detail: { status: result.status, type: eventType }
      })
    );

    // Clean up — this action has concluded.
    if (matchedId) pendingIds.delete(matchedId);
    lastAction = null;
  }

  // ── Fetch interception ──────────────────────────────────────────────────────
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const urlRaw = (args[0] && typeof args[0] === 'string')
        ? args[0]
        : (args[0]?.url ?? '');
      const url = urlRaw.toString();

      const isInitRun    = isInitiateRunUrl(url);
      const isInitSubmit = isInitiateSubmitUrl(url);
      const isCheck      = isCheckUrl(url);
      const isGQL        = isGraphQL(url);

      if (isInitRun || isInitSubmit) {
        response.clone().json().then(d => handleInitiateResponse(url, d)).catch(() => {});
      }

      if (isCheck || isGQL) {
        const urlHint = isCheck ? 'submit' : null; // only used if id-tracking and data-shape both miss
        response.clone().json().then(d => handleData(url, d, urlHint)).catch(() => {});
      }
    } catch (_) {}

    return response;
  };

  // ── XHR interception ────────────────────────────────────────────────────────
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._lcUrl = url ? url.toString() : '';
    return origOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const url = this._lcUrl || '';
    const isInitRun    = isInitiateRunUrl(url);
    const isInitSubmit = isInitiateSubmitUrl(url);
    const isCheck      = isCheckUrl(url);
    const isGQL        = isGraphQL(url);

    if (isInitRun || isInitSubmit) {
      this.addEventListener('load', function () {
        try { handleInitiateResponse(url, JSON.parse(this.responseText)); } catch (_) {}
      });
    }

    if (isCheck || isGQL) {
      const urlHint = isCheck ? 'submit' : null;
      this.addEventListener('load', function () {
        try { handleData(url, JSON.parse(this.responseText), urlHint); } catch (_) {}
      });
    }

    return origSend.apply(this, args);
  };
})();

//fordebug
//window.__lcSoundFxDebug = true;