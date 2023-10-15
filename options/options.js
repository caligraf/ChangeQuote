// Reset the headers to the standard
async function standardHeader() {
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_type");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_originalmessage");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrote");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_ondate");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_separator");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_colon");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrotesingle");
    // if (msguri)
        // closeWindowOrMarkReadAfterReply(msguri);
}


function restoreOptions() {
  /*var storageItem = browser.storage.local.get('colour');
  storageItem.then((res) => {
    document.querySelector("#managed-colour").innerText = res.colour;
  });*/

  var gettingItem = browser.storage.local.get('colour');
  // gettingItem.then((res) => {
    // document.querySelector("#colour").value = res.colour || 'Firefox red';
  // });
}

//document.addEventListener('DOMContentLoaded', restoreOptions);
//document.querySelector("form").addEventListener("submit", saveOptions);

// UI function to hide/show out option tabs.
function tablistClickHandler(elem) {
    let target = elem.target;

    if (target.parentNode.id != 'tablist') return false;

    let selectedTab = document.querySelector('[aria-selected="true"]');
    selectedTab.setAttribute('aria-selected', false);
    target.setAttribute('aria-selected', true);

    let panels = document.querySelector('[aria-hidden="false"]');
    panels.setAttribute('aria-hidden', true);

    let panelId = target.getAttribute('aria-controls'),
        panel = document.getElementById(panelId);
    panel.setAttribute('aria-hidden', false);
}

async function loadPref(prefElement) {
    let type = prefElement.dataset.type || prefElement.getAttribute("type") || prefElement.tagName;
    let name = prefElement.dataset.preference;
    let value = await browser.LegacyPrefs.getPref(`${name}`);
    switch (type) {
        case "checkbox":
            prefElement.checked = value;
            prefElement.addEventListener("change", () => savePref(prefElement));
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"][value="${value}"]`)
            if (selectedElement) {
                selectedElement.checked = true;
            }
            for (let radio of prefElement.querySelectorAll(`input[type="radio"]`)) {
                radio.addEventListener("change", () => {
                    savePref(prefElement);
                });
            }
            break;
        case "textarea":
            prefElement.value = value;
            prefElement.addEventListener("change", () => savePref(prefElement));
            break;
    }
}

async function savePref(prefElement) {
    let type = prefElement.dataset.type || prefElement.getAttribute("type") || prefElement.tagName;
    let name = prefElement.dataset.preference;
    switch (type) {
        case "checkbox":
            browser.LegacyPrefs.setPref(`${name}`, !!prefElement.checked);
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"]:checked`)
            if (selectedElement) {
                browser.LegacyPrefs.setPref(`${name}`, selectedElement.value);
                if( prefElement.dataset.preference === "changequote.headers.type" ) {
                    if( selectedElement.value == 0 || selectedElement.value == 2) {
                            browser.LegacyPrefs.setPref("mailnews.reply_header_type", 0);
                            browser.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", "************HeaderChangeQuote*****************");
                    } else
                        standardHeader();
                }
            }
            break;
        case "textarea":
            browser.LegacyPrefs.setPref(`${name}`, prefElement.value);
            break;
    }
}

async function loadOptions() {
    const elementEventMap = {
        tablist: { type: "click", callback: tablistClickHandler },
        // button_website: { type: "click", callback: () => browser.windows.openDefaultBrowser(homepageUrl) },
        // button_review: { type: "click", callback: () => browser.windows.openDefaultBrowser(reviewsPageUrl) },
        // button_issues: { type: "click", callback: () => browser.windows.openDefaultBrowser(issuesPageUrl) },
        // button_paypal: { type: "click", callback: openPaypal },
        // bitcoin_img: { type: "click", callback: copyBtcAddress },
        // bitcoin_div: { type: "click", callback: copyBtcAddress }
    }

    for (let [elementId, eventData] of Object.entries(elementEventMap)) {
        document.getElementById(elementId).addEventListener(eventData.type, eventData.callback);
    }

    //Load preferences and attach onchange listeners for auto save.
    let prefElements = document.querySelectorAll("*[data-preference]");
    for (let prefElement of prefElements) {
        await loadPref(prefElement);
    }
}

//window.addEventListener("load", loadOptions);
document.addEventListener('DOMContentLoaded', () => {
  i18n.updateDocument();
  loadOptions();
}, { once: true });