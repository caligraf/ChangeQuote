// Reset the headers to the standard
async function standardHeader() {
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_type");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_originalmessage");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrote");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_ondate");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_separator");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_colon");
    await browser.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrotesingle");
}

function toggleCustomizedBox() {
	document.getElementById("CQdateLong").removeAttribute("disabled");
	toggleLongDate();
	document.getElementById("CHbox").removeAttribute("disabled");
	document.getElementById("CQadd_newline").removeAttribute("disabled");
	document.getElementById("CQwithoutCC").setAttribute("disabled", "true");
	document.getElementById("CQAlwaysEnglish").setAttribute("disabled", "true");
	document.getElementById("CQbold").setAttribute("disabled", "true");
	document.getElementById("CQhtml_support").removeAttribute("disabled");
}

function toggleStandard() {
	document.getElementById("CHbox").setAttribute("disabled", "true");
	document.getElementById("CQdateLong").setAttribute("disabled", "true");
	document.getElementById("CQdatelongINT").setAttribute("disabled", "true");
	document.getElementById("CQdatelocalized").setAttribute("disabled", "true");
	document.getElementById("CQdateorig").setAttribute("disabled", "true");
	document.getElementById("CQdatecustom").setAttribute("disabled", "true");
	document.getElementById("CQcapitalize_date").setAttribute("disabled", "true");
	document.getElementById("CQwithoutCC").setAttribute("disabled", "true");
	document.getElementById("CQAlwaysEnglish").setAttribute("disabled", "true");
	document.getElementById("CQadd_newline").setAttribute("disabled", "true");
	document.getElementById("CQbold").setAttribute("disabled", "true");
	document.getElementById("CQhtml_support").setAttribute("disabled", "true");
}

function toggleLongDate() {
	if (document.getElementById("CQdateLong").checked) {
		document.getElementById("CQdatelongINT").removeAttribute("disabled");
		document.getElementById("CQdatelocalized").removeAttribute("disabled");
		document.getElementById("CQdateorig").removeAttribute("disabled");
		document.getElementById("CQdatecustom").removeAttribute("disabled");
		document.getElementById("CQcapitalize_date").removeAttribute("disabled");
	}
	else {
		document.getElementById("CQdatelongINT").setAttribute("disabled", "true");
		document.getElementById("CQdatelocalized").setAttribute("disabled", "true");
		document.getElementById("CQdateorig").setAttribute("disabled", "true");
		document.getElementById("CQdatecustom").setAttribute("disabled", "true");
		document.getElementById("CQcapitalize_date").setAttribute("disabled", "true");
	}
}

function toggleExt() {
	document.getElementById("CHbox").setAttribute("disabled", "true");
	document.getElementById("CQadd_newline").setAttribute("disabled", "true");
	document.getElementById("CQdateLong").removeAttribute("disabled");
	document.getElementById("CQwithoutCC").removeAttribute("disabled");
	document.getElementById("CQAlwaysEnglish").removeAttribute("disabled");
	document.getElementById("CQbold").removeAttribute("disabled");
	document.getElementById("CQhtml_support").setAttribute("disabled", "true");
	toggleLongDate();
}

function InitCheckBox() {
	if (document.getElementById("CQStandard").selected)
		toggleStandard();
	else if (document.getElementById("CQCustomize").selected)
		toggleCustomizedBox();
	else
		toggleExt();
			
	if (document.getElementById("CQcustomizeHeaderForNewsGroup").checked)
		document.getElementById("CHbox-news").removeAttribute("disabled");
	else	
		document.getElementById("CHbox-news").setAttribute("disabled", "true");	
}

function checkboxcheck3() {
	if (document.getElementById("CQsameReplyFormat").checked) {
		document.getElementById("CQDefault").removeAttribute("disabled");
		document.getElementById("CQHTML").removeAttribute("disabled");
		document.getElementById("CQPlainText").removeAttribute("disabled");
	}
	else {
		document.getElementById("CQDefault").setAttribute("disabled", "true");
		document.getElementById("CQHTML").setAttribute("disabled", "true");
		document.getElementById("CQPlainText").setAttribute("disabled", "true");
	}
}

function checkboxcheck4() {
	if (document.getElementById("CQcustomizeHeaderForNewsGroup").checked)
		document.getElementById("CHbox-news").removeAttribute("disabled");
	else	
		document.getElementById("CHbox-news").setAttribute("disabled", "true");
}

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
        case "text":
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
            if( prefElement.dataset.preference === "changequote.headers.date_long" )
                toggleLongDate();
            else if(prefElement.dataset.preference === "changequote.set.header.news" )
                checkboxcheck4();
            else if(prefElement.dataset.preference === "changequote.replyformat.format" )
                checkboxcheck3();
            break;
        case "radiogroup":
            let selectedElement = prefElement.querySelector(`input[type="radio"]:checked`)
            if (selectedElement) {
                browser.LegacyPrefs.setPref(`${name}`, selectedElement.value);
                if( prefElement.dataset.preference === "changequote.headers.type" ) {
                    if( selectedElement.value == 0 || selectedElement.value == 2) {
                            browser.LegacyPrefs.setPref("mailnews.reply_header_type", 0);
                            browser.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", "************HeaderChangeQuote*****************");
                            if( selectedElement.value == 0  )
                                toggleExt();
                            else
                                toggleCustomizedBox();
                    } else {
                        standardHeader();
                        toggleStandard();
                    }
                }
            }
            break;
        case "text":
        case "textarea":
            browser.LegacyPrefs.setPref(`${name}`, prefElement.value);
            break;
    }
}

async function loadOptions() {
    document.getElementById("tablist").addEventListener("click", tablistClickHandler);

    //Load preferences and attach onchange listeners for auto save.
    let prefElements = document.querySelectorAll("*[data-preference]");
    for (let prefElement of prefElements) {
        await loadPref(prefElement);
    }
    InitCheckBox();
    checkboxcheck3();
}

document.addEventListener('DOMContentLoaded', () => {
  i18n.updateDocument();
  loadOptions();
}, { once: true });