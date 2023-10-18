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
        else if (dateLongFormat == 3) {//local : receiver date
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
    let newhdr = "-------- Original Message  --------"+endline;
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
        let realnewhdr = getHeader(options.custom, options.isNNTP, options.cite, options.msgDate, options.receivedDate, options.messageHeader, options.endline);
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
