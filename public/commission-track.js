/**
 * Commission tracking script - embed this on your own site to capture
 * leads directly, without sending customers to Commission's hosted page.
 *
 * Usage:
 *   <script src="https://commission.ng/commission-track.js" data-program="YOUR_PROGRAM_ID"></script>
 *
 * 1. Capture a lead from your own form's submit handler:
 *      Commission.trackLead({ fullName, phone, email, metadata: { budget: "500k-1m" } })
 *        .then((result) => { ... }) // result.leadRef is what step 2 needs
 *        .catch((err) => { ... });
 *
 * 2. Immediately after, render the confirmation widget into an element on
 *    your page - this is what actually qualifies the lead (and is what
 *    triggers billing). It cannot be skipped or automated from your own
 *    code by design - see app/embed/qualify/[leadRef]/page.js for why.
 *      Commission.renderQualifyWidget("commission-qualify", result.leadRef);
 *
 *    Add a container for it anywhere on your page:
 *      <div id="commission-qualify"></div>
 *
 * The widget posts a message when the customer confirms, if you want to
 * react to it on your own page:
 *   window.addEventListener("message", (e) => {
 *     if (e.data?.source === "commission-embed" && e.data?.event === "qualified") { ... }
 *   });
 *
 * For a SALE-GOAL campaign instead, there's no lead capture step at all -
 * just call this from your own "Subscribe"/"Buy" button's click handler:
 *   Commission.initiateSaleCheckout()
 *     .then((result) => { window.location.href = result.authorizationUrl; })
 *     .catch((err) => { ... });
 * This redirects the customer to Paystack's own checkout - Commission is
 * never involved in rendering any page before that point for a sale-goal
 * campaign; the customer stays on your own site until they actually pay.
 */
(function () {
  var SCRIPT_TAG = document.currentScript;
  var PROGRAM_ID = SCRIPT_TAG ? SCRIPT_TAG.getAttribute("data-program") : null;
  var API_BASE = "https://commission.ng";
  var STORAGE_KEY = "cmn_ref";
  var SCRIPT_LOADED_AT = new Date().toISOString();

  function captureRefFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem(STORAGE_KEY, ref);
      } catch (e) {
        // localStorage unavailable (private browsing, etc.) - attribution
        // will only work for this page load, not across navigation.
      }
    }
  }
  captureRefFromUrl();

  function getStoredRef() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  window.Commission = window.Commission || {};
  window.Commission.trackLead = function (lead) {
    var ref = getStoredRef();
    if (!ref) {
      return Promise.reject(new Error("No referral code found - this visitor did not arrive through a Commission referral link."));
    }
    if (!PROGRAM_ID) {
      return Promise.reject(new Error("Missing data-program attribute on the Commission tracking script tag."));
    }
    return fetch(API_BASE + "/api/leads/external-capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: PROGRAM_ID,
        referralCode: ref,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        metadata: lead.metadata || null,
        pageLoadedAt: SCRIPT_LOADED_AT,
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Failed to record lead");
        return data;
      });
    });
  };

  window.Commission.renderQualifyWidget = function (containerId, leadRef) {
    var container = document.getElementById(containerId);
    if (!container) {
      throw new Error('Commission.renderQualifyWidget: no element with id "' + containerId + '" found on the page.');
    }
    var iframe = document.createElement("iframe");
    iframe.src = API_BASE + "/embed/qualify/" + encodeURIComponent(leadRef);
    iframe.style.width = "100%";
    iframe.style.minHeight = "260px";
    iframe.style.border = "none";
    iframe.title = "Confirm your interest";
    container.innerHTML = "";
    container.appendChild(iframe);
  };

  window.Commission.initiateSaleCheckout = function () {
    var ref = getStoredRef();
    if (!ref) {
      return Promise.reject(new Error("No referral code found - this visitor did not arrive through a Commission referral link."));
    }
    return fetch(API_BASE + "/api/sales/initiate-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: ref }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || "Failed to start checkout");
        return data;
      });
    });
  };
})();
