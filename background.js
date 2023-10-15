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

async function CQgetDate(headerDate) {
    // if (headerDate) {
    // headerDate = headerDate.replace(/ +$/, "");
    // return headerDate;
    // }
    //var date = new Date(hdr.date / 1000);
    let CQuse_date_long = await messenger.LegacyPrefs.getPref("changequote.headers.date_long");
    if (CQuse_date_long) {
        var dateLongFormat = await messenger.LegacyPrefs.getPref("changequote.headers.date_long_format");
        if (dateLongFormat == 2)
            var datestring = CQdate; //TODO: get Original Date
        else if (dateLongFormat == 1)
            var datestring = headerDate.toString();
        else if (dateLongFormat == 3)
            var datestring = changequote.decodeCustomizedDate(headerDate);
        else if (dateLongFormat == 4)
            var datestring = changequote.decodeCustomizedDateSender(headerDate);
        else
            var datestring = headerDate.toLocaleString();
        let changequote_headers_capitalize_date = await messenger.LegacyPrefs.getPref("changequote.headers.capitalize_date");
        if (changequote_headers_capitalize_date)
            datestring = changequote.CQcapitalize(datestring);
        datestring = datestring.replace(/ +$/, "");
        return datestring;
    } else {
        var formDate = new Services.intl.DateTimeFormat().format(date)
            formDate = formDate.replace(/ +$/, "");
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

async function getClassicEnglishHeader(sender, recipient, cclist, subject, headerDate, endline) {
    let tags = await CQgetBtags();
    let newhdr = "-------- Original Message  --------"+endline;
    let senderhdr = tags[0] + "From: " + tags[1] + sender + endline;
    let recipienthdr = tags[0] + "To: " + tags[1] + recipient;
    let cclabel = tags[0] + "Cc: " + tags[1];
    let changequote_headers_withcc = await messenger.LegacyPrefs.getPref("changequote.headers.withcc");
    if (changequote_headers_withcc && cclist.length > 0)
        recipienthdr = recipienthdr + endline + cclabel + changequote.ccListDecoded(cclist);
    let subjectlabel = tags[0] + "Subject: " + tags[1];
    let realnewhdr = newhdr + subjectlabel + subject + endline + senderhdr + recipienthdr + endline;
    let datestring = await CQgetDate(headerDate);
    let newdate = tags[0] + "Date: " + tags[1] + datestring;
    return realnewhdr + newdate;
}

async function getClassicLocalizedHeader(sender, recipient, cclist, subject, headerDate, endline) {
    let tags = await CQgetBtags();
    let newhdr = messenger.i18n.getMessage("OriginalMessage", "-------- Original Message  --------") + endline;
    let senderhdr = tags[0] + messenger.i18n.getMessage("From", "From: ") + tags[1] + sender + endline;
    let recipienthdr = tags[0] + messenger.i18n.getMessage("To", "To: ") + tags[1] + recipient;
    let cclabel = tags[0] + messenger.i18n.getMessage("Cc: ", "") + tags[1];
    let changequote_headers_withcc = await messenger.LegacyPrefs.getPref("changequote.headers.withcc");
    if (changequote_headers_withcc && cclist.length > 0)
        recipienthdr = recipienthdr + endline + cclabel + changequote.ccListDecoded(cclist);
    let datelabel = tags[0] + messenger.i18n.getMessage("Date", "Date: ") + tags[1];
    let subjectlabel = tags[0] + messenger.i18n.getMessage("Subject", "Subject: ") + tags[1];
    let realnewhdr = newhdr + subjectlabel + subject + endline + senderhdr + recipienthdr + endline;
    let datestring = await CQgetDate(headerDate);
    let newdate = datelabel + datestring;
    return realnewhdr + newdate;
}

async function getCustomizedHeader(sender, recipient, cclist, subject, headerDate, isNNTP, endline) {
    let ch = "";
    if (isNNTP)
        ch = await messenger.LegacyPrefs.getPref("changequote.headers.news.customized");
    else
        ch = await messenger.LegacyPrefs.getPref("changequote.headers.customized");
    if (cclist == "")
        cclist = "§§§§";
    else
        cclist = changequote.ccListDecoded(cclist);
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
    let msgDate = await CQgetDate(headerDate);
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
async function getHeader(custom, isNNTP, cite, msgDate, messageHeader, endline) {
    let isHeaderEnglish = await messenger.LegacyPrefs.getPref("changequote.headers.english");
    let tb_locale = messenger.i18n.getUILanguage();

    let sender = messageHeader.author;
    let recipient = messageHeader.recipients.join(",");
    let cclist = messageHeader.ccList.join(",");
    let subject = messageHeader.subject;
    let realnewhdr = "";
    if (custom)
        realnewhdr = await getCustomizedHeader(sender, recipient, cclist, subject, msgDate, isNNTP, endline);
    else if (isNNTP)
        await standardHeader(email);
    else if (isHeaderEnglish)
        realnewhdr = await getClassicEnglishHeader(sender, recipient, cclist, subject, msgDate, endline);
    else
        realnewhdr = await getClassicLocalizedHeader(sender, recipient, cclist, subject, msgDate, endline);
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
async function loadHeader(custom, isNNTP, cite, msgDate, messageHeader) {
    let realnewhdr = await getHeader(custom, isNNTP, cite, msgDate, messageHeader, "\n");
    await messenger.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", realnewhdr);
    //window.closeWindowOrMarkReadAfterReply(email);
}

messenger.messageDisplayAction.onClicked.addListener(async(tab, buttonid) => {

    let messageHeader = await messenger.messageDisplay.getDisplayedMessage(tab.id);
    let messagePart = await messenger.messages.getFull(messageHeader.id);
    let details = {};
    let msgFormat = messagePart.headers["content-type"];
    let CQmailformat = 0;
    for (let i = 0; i < msgFormat.length; i++) {
        if (msgFormat[i].indexOf("plain") > -1) {
            CQmailformat = 2; // plain
            break;
        } else if (msgFormat[i].indexOf("alternative") > -1) {
            CQmailformat = 0; // alternative
            let formatAlternative = await messenger.LegacyPrefs.getPref("changequote.replyformat.format");
            if (formatAlternative) {
                if (formatAlternative == 0) {
                    details.deliveryFormat = 'both';
                } else if (formatAlternative == 1) {
                    details.deliveryFormat = 'html';
                } else if (formatAlternative == 2) {
                    details.deliveryFormat = 'text';
                }
            } else {
                details.deliveryFormat = 'auto';
            }
            break;
        } else if (msgFormat[i].indexOf("html") > -1) {
            CQmailformat = 1; // html
            break;
        }
    }

/*    let CQheaders_type = await messenger.LegacyPrefs.getPref("changequote.headers.type");
    let CQheaders_news = await messenger.LegacyPrefs.getPref("changequote.set.headers.news");
    let msgDate = messageHeader.date;
    let isNNTP = false; // hardcoded for the moment
    if (isNNTP) {
        if (CQheaders_news)
            await loadHeader(true, isNNTP, false, msgDate, messageHeader);
        else
            standardHeader(messageArray[0]);
    } else {
        if (CQheaders_type == 0) {
            CQuse_date_long = await messenger.LegacyPrefs.getPref("changequote.headers.date_long");
            await loadHeader(false, isNNTP, false, msgDate, messageHeader);
        } else if (CQheaders_type == 1)
            standardHeader(messageArray[0]);
        else
            await loadHeader(true, isNNTP, false, msgDate, messageHeader);
    }*/

    messenger.compose.beginReply(messageHeader.id, "replyToSender", details);
});

async function doHandleCommand(message, sender) {
    const {command, options } = message;
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
        let realnewhdr = getHeader(options.custom, options.isNNTP, options.cite, options.msgDate, options.messageHeader, options.endline);
        return realnewhdr;
        break;        
    }
    
}

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
    if( cqheaders_type == 0 || cqheaders_type == 2) {
        await messenger.LegacyPrefs.setPref("mailnews.reply_header_type", 0);
        await messenger.LegacyPrefs.setPref("mailnews.reply_header_originalmessage", "************HeaderChangeQuote*****************");
    } else {
        standardHeader();
    }
}

main();
