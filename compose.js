/**
 * Update the message reply
 */
async function updateMessage(composeDetails, messageHeader, messagePart) {
    try {
        if (composeDetails.type == "reply") {
            var inner = document.body.innerHTML;
            if (inner.length < 20) // || inner.indexOf("([[)") < 0)
                return;

            let details = {};
            let msgFormat = messagePart.headers["content-type"];
            let CQmailformat = 0;
            for (let i = 0; i < msgFormat.length; i++) {
                if (msgFormat[i].indexOf("plain") > -1) {
                    CQmailformat = 2; // plain
                    break;
                } else if (msgFormat[i].indexOf("alternative") > -1) {
                    CQmailformat = 0; // alternative
                    let formatAlternative = await browser.runtime.sendMessage({command: "getPrefFormatAlternative"});
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
            let receivedDate = "";
            let received = messagePart.headers["received"];
            if( received ) {
                let size = received.length;
                if( size >= 1 ) {
                    let receivedDateTab = received[size-1].split(";");
                    if( receivedDateTab.length > 1 ) {
                        receivedDate = receivedDateTab[1];
                    }
                }
            }
            

            let cqheaders_type = await browser.runtime.sendMessage({command: "getPrefCQHeaderType"});
            let cqheaders_news = await browser.runtime.sendMessage({command: "getPrefCQSetHeaderType"});
            let msgdate = messageHeader.date;
            let isnntp = false; // hardcoded for the moment
            let realnewhdr = '';
            if (isnntp) {
                if (cqheaders_news)
                    realnewhdr = await browser.runtime.sendMessage({command: "getHeader", options:{custom:true, isNNTP:isnntp, cite:false, msgDate:msgdate, receivedDate: receivedDate, messageHeader:messageHeader, endline: "[[br /]]"}});
                else
                    return;//await browser.runtime.sendMessage({command: "standardheader"});
            } else {
                if (cqheaders_type == 0) {
                    realnewhdr = await browser.runtime.sendMessage({command: "getHeader", options:{custom:false, isNNTP:isnntp, cite:false, msgDate:msgdate, receivedDate: receivedDate, messageHeader:messageHeader, endline: "[[br /]]"}});
                } else if (cqheaders_type == 1)
                    return;//await browser.runtime.sendMessage({command: "standardheader"});
                else
                    realnewhdr = await browser.runtime.sendMessage({command: "getHeader", options:{custom:true, isNNTP:isnntp, cite:false, msgDate:msgdate, receivedDate: receivedDate, messageHeader:messageHeader, endline: "[[br /]]"}});
            }

            inner = inner.replace(/\*\*\*\*\*\*\*\*\*\*\*\*HeaderChangeQuote\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/g, realnewhdr);
            inner = inner.replace(/\(\[\[\)/g,"<");
            inner = inner.replace(/\(\]\]\)/g,">");
            document.body.innerHTML = inner;
        }
    } catch (e) {
        console.error(e);
    }
}

async function main() {
    let composeDetails = await browser.runtime.sendMessage({command: "getComposeDetails"});
    let message = await browser.runtime.sendMessage({command: "getMessage"});
    updateMessage(composeDetails, message.messageHeader, message.messagePart);
}

main();
