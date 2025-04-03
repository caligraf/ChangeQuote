browser.composeScripts.register({
    js: [{
            file: "compose.js"
        }
    ]
});

function CQcapitalize(val) {
    let newVal = "";
    val = val.split(' ');
    for (let c = 0; c < val.length; c++) {
        newVal += val[c].substring(0, 1).toUpperCase() + val[c].substring(1, val[c].length);
        if( val.length > 1 )
            newVal += ' ';
    }
    return newVal;
}

function getTimeZone(str) {
    let z = str.replace(/^ +/, "");
    z = z.split(" ")[5];
    z = z.replace(/[a-zA-Z]+/, "");
    z = z.substring(0, 5);
    return z;
}

function decodeCustomizedDate(date, str, timeZone, capitalizeDate) {
    const optionsWeekday = { weekday: 'long', timeZone: timeZone };
    const weekdayformat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsWeekday);
    let LD = weekdayformat.format(date);

    const optionsMonthName = { month: 'long', timeZone: timeZone };
    const monthNameFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsMonthName);
    let LM = monthNameFormat.format(date);

    const optionsDayEnShort = { weekday: 'short', timeZone: timeZone };
    const dayEnShortFormat = new Intl.DateTimeFormat('en-US', optionsDayEnShort);
    let D = dayEnShortFormat.format(date);

    const optionsMonthEnShort = { month: 'short', timeZone: timeZone };
    const monthEnShortFormat = new Intl.DateTimeFormat('en-US', optionsMonthEnShort);
    let M = monthEnShortFormat.format(date);

    const optionsDay = { day: 'numeric', timeZone: timeZone };
    const dayFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsDay);
    let d = dayFormat.format(date);
    let e = d < 10 ? " " + d : d;
    d = d < 10 ? "0" + d : d;

    const optionsMonth = { month: '2-digit', timeZone: timeZone };
    const monthFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsMonth);
    let m = monthFormat.format(date);

    const optionsYear = { year: '2-digit', timeZone: timeZone };
    const yearFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsYear);
    let y = yearFormat.format(date);

    const optionsYearFull = { year: 'numeric', timeZone: timeZone };
    const yearFullFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsYearFull);
    let Y = yearFullFormat.format(date);

    const optionsMinutes = { minute: '2-digit', timeZone: timeZone };
    const minutesFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsMinutes);
    let i = minutesFormat.format(date);

    const optionsSeconds = { second: '2-digit', timeZone: timeZone };
    const secondsFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsSeconds);
    let s = secondsFormat.format(date);

    const optionsHours12 = { hour: '2-digit', hour12: true, timeZone: timeZone };
    const hours12Format = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsHours12);
    let h = hours12Format.format(date).split(" ")[0];

    const optionsHours = { hour: '2-digit', hour12: false, timeZone: timeZone };
    const hoursFormat = new Intl.DateTimeFormat(messenger.i18n.getUILanguage(), optionsHours);
    let H = hoursFormat.format(date);

    let a = Number(H) > 11 && Number(H) < 24 ? "pm" : "am";
    let A = Number(H) > 11 && Number(H) < 24 ? "PM" : "AM";
    let z = timeZone;
    if (capitalizeDate) {
        LD = CQcapitalize(LD);
        LM = CQcapitalize(LM);
        D = CQcapitalize(D);
        M = CQcapitalize(M);
    }

    str = str.replace("%LM", LM);
    str = str.replace("%LD", LD);
    str = str.replace("%d", d);
    str = str.replace("%D", D);
    str = str.replace("%m", m);
    str = str.replace("%M", M);
    str = str.replace("%y", Y);
    str = str.replace("%Y", Y);
    str = str.replace("%i", i);
    str = str.replace("%s", s);
    str = str.replace("%H", H);
    str = str.replace("%h", h);
    str = str.replace("%A", A);
    str = str.replace("%a", a);
    str = str.replace("%e", e);
    str = str.replace("%z", z);
    return str;
}

async function getPrefInStorage(prefName, defaultValue) {
    let prefObj = await browser.storage.local.get(prefName);
    if (prefObj && prefObj[prefName] != null)
        return prefObj[prefName];
    return defaultValue;
}

async function setPrefInStorage(prefName, prefValue) {
    let prefObj = {};
    prefObj[prefName] = prefValue;
    await browser.storage.local.set(prefObj);
}

async function CQgetDate(headerDate, receivedDateString) {
    let CQuse_date_long = await getPrefInStorage("changequote.headers.date_long");
    if (CQuse_date_long) {
        let postCapitalization = true; 
        let changequote_headers_capitalize_date = await getPrefInStorage("changequote.headers.capitalize_date");
        let dateLongFormat = await getPrefInStorage("changequote.headers.date_long_format");
        let datestring = "";
        if (dateLongFormat == 2)
            datestring = receivedDateString;
        else if (dateLongFormat == 1)
            datestring = headerDate.toString();
        else if (dateLongFormat == 3) { //local : receiver date
            let str = await getPrefInStorage("changequote.headers.date_custom_format");
            let timeZone = getTimeZone(headerDate.toString());
            postCapitalization = false;
            datestring = decodeCustomizedDate(headerDate, str, timeZone,
                                              changequote_headers_capitalize_date);
        } else if (dateLongFormat == 4) { //sender date
            postCapitalization = false;
            let str = await getPrefInStorage("changequote.headers.dateSender_custom_format");
            let receivedDate = new Date(receivedDateString)
            let timeZone = getTimeZone(receivedDateString);
            datestring = decodeCustomizedDate(receivedDate, str, timeZone,
                                              changequote_headers_capitalize_date);
        } else
            datestring = headerDate.toLocaleString();
        if (changequote_headers_capitalize_date && postCapitalization)
            datestring = CQcapitalize(datestring);
        datestring = datestring.replace(/ +$/, "");
        return datestring;
    } else {
        let formDate = headerDate.toLocaleString();
        return formDate;
    }
}

async function CQgetBtags() {
    let tagArr = [];
    let changequote_headers_label_bold = await getPrefInStorage("changequote.headers.label_bold");
    if (changequote_headers_label_bold) {
        tagArr.push("<b>");
        tagArr.push("</b>");
    } else {
        tagArr.push("");
        tagArr.push("");
    }
    return tagArr;
}

async function getClassicEnglishHeader(sender, recipient, cclist, subject, headerDate, receivedDateString, endline) {
    let tags = await CQgetBtags();
    let newhdr = "-------- Original Message  --------" + endline;
    let senderhdr = tags[0] + "From: " + tags[1] + sender + endline;
    let recipienthdr = tags[0] + "To: " + tags[1] + recipient;
    let cclabel = tags[0] + "Cc: " + tags[1];
    let changequote_headers_withcc = await getPrefInStorage("changequote.headers.withcc");
    if (changequote_headers_withcc && cclist.length > 0)
        recipienthdr = recipienthdr + endline + cclabel + cclist;
    let subjectlabel = tags[0] + "Subject: " + tags[1];
    let realnewhdr = newhdr + subjectlabel + subject + endline + senderhdr + recipienthdr + endline;
    let datestring = await CQgetDate(headerDate, receivedDateString);
    let newdate = tags[0] + "Date: " + tags[1] + datestring;
    return realnewhdr + newdate;
}

async function getClassicLocalizedHeader(sender, recipient, cclist, subject, headerDate, receivedDateString, endline) {
    let tags = await CQgetBtags();
    let newhdr = messenger.i18n.getMessage("OriginalMessage", "-------- Original Message  --------") + endline;
    let senderhdr = tags[0] + messenger.i18n.getMessage("From", "From: ") + tags[1] + sender + endline;
    let recipienthdr = tags[0] + messenger.i18n.getMessage("To", "To: ") + tags[1] + recipient;
    let cclabel = tags[0] + messenger.i18n.getMessage("Cc", "Cc: ") + tags[1];
    let changequote_headers_withcc = await getPrefInStorage("changequote.headers.withcc");
    if (changequote_headers_withcc && cclist.length > 0)
        recipienthdr = recipienthdr + endline + cclabel + cclist;
    let datelabel = tags[0] + messenger.i18n.getMessage("Date", "Date: ") + tags[1];
    let subjectlabel = tags[0] + messenger.i18n.getMessage("Subject", "Subject: ") + tags[1];
    let realnewhdr = newhdr + subjectlabel + subject + endline + senderhdr + recipienthdr + endline;
    let datestring = await CQgetDate(headerDate, receivedDateString);
    let newdate = datelabel + datestring;
    return realnewhdr + newdate;
}

async function getCustomizedHeader(sender, recipient, cclist, subject, headerDate, receivedDateString, isNNTP, endline) {
    let ch = "";
    if (isNNTP)
        ch = await getPrefInStorage("changequote.headers.news.customized");
    else
        ch = await getPrefInStorage("changequote.headers.customized");
    if (cclist == "")
        cclist = "§§§§";
    if (subject == "")
        subject = "§§§§";
    if (sender == "")
        sender = "§§§§";
    if (recipient == "")
        recipient = "§§§§";


    let msgDate = await CQgetDate(headerDate, receivedDateString);
    ch = ch.replace("%%5", msgDate);
    let sender_nomail = sender.replace(/<.+>/, "");
    sender_nomail = sender_nomail.replace(/ +$/, "");
    ch = ch.replace("%%6", sender_nomail);
    let sender_mail = sender.replace(/.+</, "");
    sender_mail = sender_mail.replace(">", "");
    ch = ch.replace("%%7", sender_mail);
    let recipient_nomail = recipient.replace(/<.+?>/g, "");
    recipient_nomail = recipient_nomail.replace(/ +$/, "");
    ch = ch.replace("%%8", recipient_nomail);
    let cclist_nomail = cclist.replace(/<.+?>/g, "");
    cclist_nomail = cclist_nomail.replace(/ +$/, "");
    ch = ch.replace("%%9", cclist_nomail);

    let senderEncoded = sender.replaceAll("<", "&lt;");
    senderEncoded = senderEncoded.replaceAll(">", "&gt;");
    ch = ch.replace("%%1", senderEncoded);
    let recipientEncoded = recipient.replaceAll("<", "&lt;");
    recipientEncoded = recipientEncoded.replaceAll(">", "&gt;");
    ch = ch.replace("%%2", recipientEncoded);
    let cclistEncoded = cclist.replaceAll("<", "&lt;");
    cclistEncoded = cclistEncoded.replaceAll(">", "&gt;");
    ch = ch.replace("%%3", cclistEncoded);
    let subjectEncoded = subject.replaceAll("<", "&lt;");
    subjectEncoded = subjectEncoded.replaceAll(">", "&gt;");
    ch = ch.replace("%%4", subject);
    
    if (cclist == "§§§§" || subject == "§§§§" || recipient == "§§§§" || sender == "§§§§") {
        ch = ch.replace(/\{\{[^\{\}]*§§§§[^\{\}]*\}\}/g, "§§§§");
        ch = ch.replace(/(\n§§§§\n)*§§§§$/g, "");
        ch = ch.replace(/\n§§§§\n/g, endline);
        ch = ch.replace(/§§§§/g, "");
    }

    ch = ch.replace(/\{\{/g, "");
    ch = ch.replace(/\}\}/g, "");
    return ch;
}

// Read the headers and load them in the prefs
async function getHeader(custom, isNNTP, msgDate, receivedDateString, messageHeader, endline) {
    let isHeaderEnglish = await getPrefInStorage("changequote.headers.english");
    let tb_locale = messenger.i18n.getUILanguage();

    let sender = messageHeader.author;
    let recipient = messageHeader.recipients.join(", ");
    let cclist = messageHeader.ccList.join(", ");
    let subject = messageHeader.subject;
    let realnewhdr = "";
    let newlineOptionAvailable = false;
    if (custom) {
        realnewhdr = await getCustomizedHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, isNNTP, endline);
        newlineOptionAvailable = true;
    } else if (isHeaderEnglish)
        realnewhdr = await getClassicEnglishHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, endline);
    else
        realnewhdr = await getClassicLocalizedHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, endline);

    if (newlineOptionAvailable) {
        let changequote_headers_add_newline = await getPrefInStorage("changequote.headers.add_newline", "");
        if (changequote_headers_add_newline)
            realnewhdr = realnewhdr + endline;
    }
    return realnewhdr;
}

async function isNntpAccount(accountId) {
    let mailAccount = await messenger.accounts.get(accountId);
    if (mailAccount.type === "nntp")
        return true; // account for newsgroups
    return false;
}

async function needToRemoveInlineImages(tabId) {
    let inline_attach = await getPrefInStorage("changequote.reply.without_inline_images");
    return inline_attach;
}

async function findTab(messageId) {
    let tabs = await browser.tabs.query({
            type: "messageDisplay"
        });
    for (let t of tabs) {
        let m = await browser.messageDisplay.getDisplayedMessage(t.id);
        if (m?.id == messageId) {
            return t;
        }
    }
    return null;
}

async function doHandleCommand(message, sender) {
    const {
        command,
        options
    } = message;
    const {
        tab : {
            id: tabId
        }
    } = sender;
    switch (command) {
    case "getComposeDetails":
        let composeDetails = await messenger.compose.getComposeDetails(tabId);
        return composeDetails;
        break;
    case "getMessage":
        let composeDetails2 = await messenger.compose.getComposeDetails(tabId);
        let messageHeader = await messenger.messages.get(composeDetails2.relatedMessageId);
        let messagePart = await messenger.messages.getFull(messageHeader.id);
        let message = {};
        message["messageHeader"] = messageHeader;
        message["messagePart"] = messagePart;
        return message;
        break;
    case "getHeader":
        let realnewhdr = await getHeader(options.custom, options.isNNTP, options.msgDate, options.receivedDate, options.messageHeader, options.endline);
        return realnewhdr;
        break;
    case "isNntpAccount":
        let isNewsAccount = await isNntpAccount(options.accountId);
        return isNewsAccount;
        break;
    case "needToRemoveInlineImages":
        let noimage = await needToRemoveInlineImages(tabId);
        return noimage;
        break;
    case "markMsgRead":
        let composeDetails3 = await messenger.compose.getComposeDetails(tabId);
        messenger.messages.update(composeDetails3.relatedMessageId, {
            read: true
        });
        break;
    case "closeWindows":
        let composeDetails4 = await messenger.compose.getComposeDetails(tabId);
        let originalMsgId = composeDetails4.relatedMessageId;
        let tab = await findTab(originalMsgId);
        if (tab !== null)
            await browser.tabs.remove(tab.id);
        break;
    case "getIdentityId":
        let messageDisplayedHeader = await messenger.messages.get(options.messageId);
        let folder = messageDisplayedHeader.folder;
        let mailIdentity = await messenger.identities.getDefault(folder.accountId);
        if (mailIdentity)
            return mailIdentity.id;
        else
            return "default";
        break;
    case "updateComposeDetail":
        messenger.compose.setComposeDetails(tabId, options.details)
        break;
    }
}

browser.menus.create({
    id: "replyHTML",
    title: messenger.i18n.getMessage("CQlabelitem1", "Reply in HTML"),
    contexts: ["message_display_action_menu"]
});
browser.menus.create({
    id: "replyPlain",
    title: messenger.i18n.getMessage("CQlabelitem2", "Reply in plain text"),
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replySeparator",
    type: "separator",
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replyHTMLQuote",
    title: messenger.i18n.getMessage("CQlabelitem1", "Reply in HTML") + " " + messenger.i18n.getMessage("yesquote", "(with quote)"),
    contexts: ["message_display_action_menu"]
});
browser.menus.create({
    id: "replyPlainQuote",
    title: messenger.i18n.getMessage("CQlabelitem2", "Reply in plain text") + " " + messenger.i18n.getMessage("yesquote", "(with quote)"),
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replySeparator2",
    type: "separator",
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replyToIgnore",
    title: messenger.i18n.getMessage("CQnoReplyTo", "Reply ignoring Reply-To header"),
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replySeparator3",
    type: "separator",
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replyALLHTML",
    title: messenger.i18n.getMessage("CQReplyAllHtlm", "Reply All in HTML"),
    contexts: ["message_display_action_menu"]
});
browser.menus.create({
    id: "replyALLPlain",
    title: messenger.i18n.getMessage("CQReplyAllText", "Reply All in plain text"),
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replySeparator4",
    type: "separator",
    contexts: ["message_display_action_menu"]
});

browser.menus.create({
    id: "replyALLHTMLQuote",
    title: messenger.i18n.getMessage("CQReplyAllHtlm", "Reply All in HTML") + " " + messenger.i18n.getMessage("yesquote", "(with quote)"),
    contexts: ["message_display_action_menu"]
});
browser.menus.create({
    id: "replyALLPlainQuote",
    title: messenger.i18n.getMessage("CQReplyAllText", "Reply All in plain text") + " " + messenger.i18n.getMessage("yesquote", "(with quote)"),
    contexts: ["message_display_action_menu"]
});

function updateQuoteMenus(quoted) {
    let titlePlain = messenger.i18n.getMessage("CQlabelitem2", "Reply in plain text") + " ";
    let titlePlainALL = messenger.i18n.getMessage("CQReplyAllText", "Reply All in plain text") + " ";
    let titleHTML = messenger.i18n.getMessage("CQlabelitem1", "Reply in HTML") + " ";
    let titleHTMLALL = messenger.i18n.getMessage("CQReplyAllHtlm", "Reply All in HTML") + " ";
    if (quoted) {
        let noQuote = messenger.i18n.getMessage("noquote", "(without quote)");
        titleHTML = titleHTML + noQuote;
        browser.menus.update("replyHTMLQuote", {
            title: titleHTML
        })
        titleHTMLALL = titleHTMLALL + noQuote;
        browser.menus.update("replyALLHTMLQuote", {
            title: titleHTMLALL
        })

        titlePlain = titlePlain + noQuote;
        browser.menus.update("replyPlainQuote", {
            title: titlePlain
        });
        titlePlainALL = titlePlainALL + noQuote;
        browser.menus.update("replyALLPlainQuote", {
            title: titlePlainALL
        });

    } else {
        let yesQuote = messenger.i18n.getMessage("yesquote", "(with quote)");
        titleHTML = titleHTML + yesQuote;
        browser.menus.update("replyHTMLQuote", {
            title: titleHTML
        });
        titleHTMLALL = titleHTMLALL + yesQuote;
        browser.menus.update("replyALLHTMLQuote", {
            title: titleHTMLALL
        });
        titlePlain = titlePlain + yesQuote;
        browser.menus.update("replyPlainQuote", {
            title: titlePlain
        });
        titlePlainALL = titlePlainALL + yesQuote;
        browser.menus.update("replyALLPlainQuote", {
            title: titlePlainALL
        });
    }
}

browser.menus.onClicked.addListener(async(info, tab) => {
    let details = {};
    let messageHeader = await messenger.messageDisplay.getDisplayedMessage(tab.id);
    let folder = messageHeader.folder;
    let mailIdentity = await messenger.identities.getDefault(folder.accountId);
    let mailIdentityId = 'default';
    if (mailIdentity) {
        mailIdentityId = mailIdentity.id;
        details.identityId = mailIdentityId;
    }

    if (info.menuItemId == "replyHTML" || info.menuItemId == "replyALLHTML") {
        details.isPlainText = false;
    } else if (info.menuItemId == "replyPlain" || info.menuItemId == "replyALLPlain") {
        details.isPlainText = true;
    } else if (info.menuItemId == "replyHTMLQuote" || info.menuItemId == "replyALLHTMLQuote") {
        let prefName = "changequote." + mailIdentityId + ".auto_quote";
        let quoted = await getPrefInStorage(prefName, true);
        await setPrefInStorage(prefName, !quoted);
        updateQuoteMenus(!quoted);
        details.isPlainText = false;
    } else if (info.menuItemId == "replyPlainQuote" || info.menuItemId == "replyALLPlainQuote") {
        let prefName = "changequote." + mailIdentityId + ".auto_quote";
        let quoted = await getPrefInStorage(prefName, true);
        await setPrefInStorage(prefName, !quoted);
        updateQuoteMenus(!quoted);
        details.isPlainText = true;
    } else if (info.menuItemId == "replyToIgnore") {
        details.to = messageHeader.author;
    }

    if (info.menuItemId == "replyALLHTML" || info.menuItemId == "replyALLPlain" || info.menuItemId == "replyALLHTMLQuote" || info.menuItemId == "replyALLPlainQuote")
        messenger.compose.beginReply(messageHeader.id, "replyToAll", details);
    else
        messenger.compose.beginReply(messageHeader.id, "replyToSender", details);
});

browser.messageDisplay.onMessageDisplayed.addListener(async(tab, message) => {
    let mailIdentity = await messenger.identities.getDefault(message.folder.accountId);
    let mailIdentityId = 'default';
    if (mailIdentity)
        mailIdentityId = mailIdentity.id;
    let prefName = "changequote." + mailIdentityId + ".auto_quote";
    let quoted = await getPrefInStorage(prefName, true);
    updateQuoteMenus(quoted);
    let numberOfReceivers = message.ccList.length + message.recipients.length;
    if (numberOfReceivers > 1) {
        browser.menus.update("replySeparator3", {
            visible: true
        });
        browser.menus.update("replyALLHTML", {
            visible: true
        });
        browser.menus.update("replyALLPlain", {
            visible: true
        });
        browser.menus.update("replySeparator4", {
            visible: true
        });
        browser.menus.update("replyALLHTMLQuote", {
            visible: true
        });
        browser.menus.update("replyALLPlainQuote", {
            visible: true
        });
    } else {
        browser.menus.update("replySeparator3", {
            visible: false
        });
        browser.menus.update("replyALLHTML", {
            visible: false
        });
        browser.menus.update("replyALLPlain", {
            visible: false
        });
        browser.menus.update("replySeparator4", {
            visible: false
        });
        browser.menus.update("replyALLHTMLQuote", {
            visible: false
        });
        browser.menus.update("replyALLPlainQuote", {
            visible: false
        });
    }
});

/**
 * Handles the received commands by filtering all messages where "type" property
 * is set to "command". Ignore all other requests.
 */
browser.runtime.onMessage.addListener((message, sender) => {
    if (message && message.hasOwnProperty("command")) {
        return doHandleCommand(message, sender);
    }
});

async function setDefaults(prefName, defaultValue) {
    let prefValue = await browser.storage.local
        .get({ [prefName] : null })
        .then(rv => rv[prefName]);
    if (prefValue === null) {
        await browser.storage.local.set({ [prefName] : defaultValue });
    }
}

async function main() {
    await setDefaults("changequote.headers.type", 1);
    await setDefaults("changequote.headers.english", false);
    await setDefaults("changequote.headers.withcc", false);
    await setDefaults("changequote.headers.date_long", false);
    await setDefaults("changequote.headers.date_long_format", 0);
    await setDefaults("changequote.replyformat.enable", false);
    await setDefaults("changequote.replyformat.format", 0);
    await setDefaults("changequote.news.reply_date_first", false);
    await setDefaults("changequote.news.reply_header_locale", "");
    await setDefaults("changequote.news.reply_header_authorwrote", "%s");
    await setDefaults("changequote.news.reply_header_ondate", "");
    await setDefaults("changequote.news.reply_header_separator", ", ");
    await setDefaults("changequote.news.reply_header_colon", ":\n");
    await setDefaults("changequote.reply.without_inline_images", false);
    await setDefaults("changequote.window.close_after_reply", false);
    await setDefaults("changequote.message.markread_after_reply", false);
    await setDefaults("changequote.headers.customized", "");
    await setDefaults("changequote.headers.news.customized", "");
    await setDefaults("changequote.set.headers.news", false);
    await setDefaults("changequote.headers.ignore_reply_to", false);
    await setDefaults("changequote.headers.date_custom_format", "");
    await setDefaults("changequote.headers.dateSender_custom_format", "");
    await setDefaults("changequote.headers.add_newline", false);
    await setDefaults("changequote.headers.capitalize_date", true);
    await setDefaults("changequote.headers.label_bold", false);
    await setDefaults("changequote.headers.custom_html_enabled", false);
    await setDefaults("changequote.headers.custom_news_html_enabled", false);
}

main();
