browser.composeScripts.register({
    js: [{
            file: "compose.js"
        }
    ]
});

// Reset the headers to the standard
async function standardHeader() {
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_type");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_originalmessage");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrote");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_ondate");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_separator");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_colon");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_authorwrotesingle");
    // if (msguri)
    // closeWindowOrMarkReadAfterReply(msguri);
}

function CQcapitalize(val) {
    var newVal = "";
    val = val.split(' ');
    for (var c = 0; c < val.length; c++) {
        newVal += val[c].substring(0, 1).toUpperCase() + val[c].substring(1, val[c].length) + ' ';
    }
    return newVal;
}

function decodeCustomizedDate(date, str) {
    var d = date.getDate();
    var e = d < 10 ? " " + d : d;
    d = d < 10 ? "0" + d : d;
    var m = date.getMonth() + 1;
    m = m < 10 ? "0" + m : m;
    var y = date.getYear() - 100;
    y = y < 10 ? "0" + y : y;
    var D = date.toString().split(" ")[0];
    var M = date.toString().split(" ")[1];
    var Y = date.getFullYear();
    var i = date.getMinutes();
    i = i < 10 ? "0" + i : i;
    var s = date.getSeconds();
    s = s < 10 ? "0" + s : s;
    var H = date.getHours();
    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    var a = H > 11 && H < 24 ? "pm" : "am";
    var A = H > 11 && H < 24 ? "PM" : "AM";
    var z = date.toString().split(" ")[5];
    z = z.replace(/[a-zA-Z]+/, "");
    z = z.substring(0, 5);
    //var str = CQprefs.getCharPref("changequote.headers.date_custom_format");
    H = H < 10 ? "0" + H : H;
    h = h < 10 ? "0" + h : h;
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

async function CQgetDate(headerDate, receivedDateString) {
    let CQuse_date_long = await messenger.LegacyPrefs.getPref("changequote.headers.date_long");
    if (CQuse_date_long) {
        var dateLongFormat = await messenger.LegacyPrefs.getPref("changequote.headers.date_long_format");
        let datestring = "";
        if (dateLongFormat == 2)
            datestring = receivedDateString;
        else if (dateLongFormat == 1)
            datestring = headerDate.toString();
        else if (dateLongFormat == 3) { //local : receiver date
            let str = await messenger.LegacyPrefs.getPref("changequote.headers.date_custom_format");
            datestring = decodeCustomizedDate(headerDate, str);
        } else if (dateLongFormat == 4) { //sender date
            let str = await messenger.LegacyPrefs.getPref("changequote.headers.dateSender_custom_format");
            let receivedDate = new Date(receivedDateString)
                datestring = decodeCustomizedDate(receivedDate, str);
        } else
            datestring = headerDate.toLocaleString();
        let changequote_headers_capitalize_date = await messenger.LegacyPrefs.getPref("changequote.headers.capitalize_date");
        if (changequote_headers_capitalize_date)
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
    let changequote_headers_label_bold = await messenger.LegacyPrefs.getPref("changequote.headers.label_bold");
    if (changequote_headers_label_bold) {
        tagArr.push("[[b]]");
        tagArr.push("[[/b]]");
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
    let changequote_headers_withcc = await messenger.LegacyPrefs.getPref("changequote.headers.withcc");
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
    let cclabel = tags[0] + messenger.i18n.getMessage("Cc: ", "") + tags[1];
    let changequote_headers_withcc = await messenger.LegacyPrefs.getPref("changequote.headers.withcc");
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
        ch = await messenger.LegacyPrefs.getPref("changequote.headers.news.customized");
    else
        ch = await messenger.LegacyPrefs.getPref("changequote.headers.customized");
    if (cclist == "")
        cclist = "§§§§";
    if (subject == "")
        subject = "§§§§";
    if (sender == "")
        sender = "§§§§";
    if (recipient == "")
        recipient = "§§§§";

    ch = ch.replace("%%1", sender);
    ch = ch.replace("%%2", recipient);
    ch = ch.replace("%%3", cclist);
    ch = ch.replace("%%4", subject);
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
async function getHeader(custom, isNNTP, cite, msgDate, receivedDateString, messageHeader, endline) {
    let isHeaderEnglish = await messenger.LegacyPrefs.getPref("changequote.headers.english");
    let tb_locale = messenger.i18n.getUILanguage();

    let sender = messageHeader.author;
    let recipient = messageHeader.recipients.join(",");
    let cclist = messageHeader.ccList.join(",");
    let subject = messageHeader.subject;
    let realnewhdr = "";
    if (custom)
        realnewhdr = await getCustomizedHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, isNNTP, endline);
    else if (isNNTP)
        await standardHeader(email);
    else if (isHeaderEnglish)
        realnewhdr = await getClassicEnglishHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, endline);
    else
        realnewhdr = await getClassicLocalizedHeader(sender, recipient, cclist, subject, msgDate, receivedDateString, endline);
    // Fix for bug https://bugzilla.mozilla.org/show_bug.cgi?id=334053
    realnewhdr = realnewhdr.replace(/%/g, "%'");

    if (cite) // no HTML support for cite
        realnewhdr = realnewhdr.replace(/\[\[.+?\]\]/g, "");
    else {
        realnewhdr = realnewhdr.replace(/\[\[/g, "([[)");
        realnewhdr = realnewhdr.replace(/\]\]/g, "(]])");
    }

    //await messenger.LegacyPrefs.setPref("mailnews.reply_header_type", 1);

    //let reply_header_authorwrotesingle = await messenger.LegacyPrefs.getPref("mailnews.reply_header_originalmessage");
    let changequote_headers_add_newline = await messenger.LegacyPrefs.getPref("changequote.headers.add_newline", "");
    if (changequote_headers_add_newline)
        realnewhdr = realnewhdr + endline;
    return realnewhdr;
}

// Read the headers and load them in the prefs
async function loadHeader(custom, isNNTP, cite, msgDate, receivedDateString, messageHeader) {
    let realnewhdr = await getHeader(custom, isNNTP, cite, msgDate, receivedDateString, messageHeader, "\n");
    await messenger.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", realnewhdr);
    //window.closeWindowOrMarkReadAfterReply(email);
}

async function isNntpAccount(accountId) {
    let mailAccount = await messenger.accounts.get(accountId);
    if( mailAccount.type === "nntp")
        return true; // account for newsgroups
    return false;
}

async function doHandleCommand(message, sender) {
    const {
        command,
        options
    } = message;
    const {
        tab: {
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
    case "getPrefFormatAlternative":
        let formatAlternative = await messenger.LegacyPrefs.getPref("changequote.replyformat.format");
        return formatAlternative;
        break;
    case "getPrefCQHeaderType":
        let cqheaders_type = await messenger.LegacyPrefs.getPref("changequote.headers.type");
        return cqheaders_type;
        break;
    case "getPrefCQSetHeaderType":
        let cqheaders_news = await messenger.LegacyPrefs.getPref("changequote.set.headers.news");
        return cqheaders_news;
        break;
    case "getPrefCQHeaderDateLong":
        let changequote_headers_date_long = await messenger.LegacyPrefs.getPref("changequote.headers.date_long");
        return changequote_headers_date_long;
        break;
    case "getPrefCQHeaderDateLongFormat":
        let dateLongFormat = await messenger.LegacyPrefs.getPref("changequote.headers.date_long_format");
        return dateLongFormat;
        break;
    case "getPrefCQHeaderCapitalizeDate":
        let changequote_headers_capitalize_date = await messenger.LegacyPrefs.getPref("changequote.headers.capitalize_date");
        return changequote_headers_capitalize_date;
        break;
    case "getPrefCQHeaderLabelBold":
        let changequote_headers_label_bold = await messenger.LegacyPrefs.getPref("changequote.headers.label_bold");
        return changequote_headers_label_bold;
        break;
    case "getHeader":
        let realnewhdr = await getHeader(options.custom, options.isNNTP, options.cite, options.msgDate, options.receivedDate, options.messageHeader, options.endline);
        return realnewhdr;
        break;
    case "isNntpAccount":
        let isNewsAccount = await isNntpAccount(options.accountId);
        return isNewsAccount;
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
    id: "replyToIgnore",
    title: messenger.i18n.getMessage("CQnoReplyTo", "Reply ignoring Reply-To header"),
    contexts: ["message_display_action_menu"]
});

function updateQuoteMenus(quoted) {
    let titlePlain = messenger.i18n.getMessage("CQlabelitem2", "Reply in plain text") + " ";
    let titleHTML = messenger.i18n.getMessage("CQlabelitem1", "Reply in HTML") + " ";
    if (quoted) {
        let noQuote = messenger.i18n.getMessage("noquote", "(without quote)");
        titleHTML = titleHTML + noQuote;
        browser.menus.update("replyHTMLQuote", {
            title: titleHTML
        })
        titlePlain = titlePlain + noQuote;
        browser.menus.update("replyPlainQuote", {
            title: titlePlain
        });
    } else {
        let yesQuote = messenger.i18n.getMessage("yesquote", "(with quote)");
        titleHTML = titleHTML + yesQuote;
        browser.menus.update("replyHTMLQuote", {
            title: titleHTML
        });
        titlePlain = titlePlain + yesQuote;
        browser.menus.update("replyPlainQuote", {
            title: titlePlain
        });
    }
}

browser.menus.onClicked.addListener( async (info, tab) => {
    let messageHeader = await messenger.messageDisplay.getDisplayedMessage(tab.id);
    let details = {};
    if (info.menuItemId == "replyHTML") {
        details.isPlainText = false;
    } else if (info.menuItemId == "replyPlain") {
        details.isPlainText = true;
    } else if (info.menuItemId == "replyHTMLQuote") {
        let folder = messageHeader.folder;
        let mailIdentity = await messenger.accounts.getDefaultIdentity(folder.accountId);
        let prefName = "mail.identity." + mailIdentity.id + ".auto_quote";
        //await messenger.LegacyPrefs.setPref("changequote.auto_quote.reverse_key", mailIdentity.id);
        let quoted = await messenger.LegacyPrefs.getPref(prefName);
        await messenger.LegacyPrefs.setPref(prefName, !quoted);
        updateQuoteMenus(!quoted);
        details.isPlainText = false;
    } else if (info.menuItemId == "replyPlainQuote") {
        let folder = messageHeader.folder;
        let mailIdentity = await messenger.accounts.getDefaultIdentity(folder.accountId);
        let prefName = "mail.identity." + mailIdentity.id + ".auto_quote";
        //await messenger.LegacyPrefs.setPref("changequote.auto_quote.reverse_key", mailIdentity.id);
        let quoted = await messenger.LegacyPrefs.getPref(prefName);
        await messenger.LegacyPrefs.setPref(prefName, !quoted);
        updateQuoteMenus(!quoted);
        details.isPlainText = true;
    } else if (info.menuItemId == "replyToIgnore") {
        details.to = messageHeader.author;
    }
    messenger.compose.beginReply(messageHeader.id, "replyToSender", details);
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

browser.runtime.onSuspend.addListener(async(message, sender) => {
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_type");
    await messenger.LegacyPrefs.clearUserPref("mailnews.reply_header_originalmessage");
});

async function main() {
    let cqheaders_type = await messenger.LegacyPrefs.getPref("changequote.headers.type");
    if (cqheaders_type == 0 || cqheaders_type == 2) {
        await messenger.LegacyPrefs.setPref("mailnews.reply_header_type", 0);
        await messenger.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", "************HeaderChangeQuote*****************");
    } else {
        standardHeader();
    }
    let quoted = await messenger.LegacyPrefs.getPref("mail.identity.default.auto_quote");
    updateQuoteMenus(quoted);
}

main();
