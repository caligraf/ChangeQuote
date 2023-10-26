async function getPrefInStorage(prefName, defaultValue) {
    let prefObj = await browser.storage.local.get(prefName);
    if (prefObj && prefObj[prefName] != null)
        return prefObj[prefName];
    return defaultValue;
}

function findFormatEmail(messagePart) {
    let msgFormat = messagePart.headers["content-type"];
    for( let i = 0 ; i < msgFormat.length ; i++) {
        if (msgFormat[i].indexOf("plain") > -1) {
            return 'plaintext';
        } else if (msgFormat[i].indexOf("alternative") > -1) {
            return "alternative"
        } else if (msgFormat[i].indexOf("html") > -1) {
            return "html";
        } else if (msgFormat[i].indexOf("mixed") > -1 || msgFormat[i].indexOf("related") > -1 ) {
            if (messagePart.parts ) {
                for( let j=0; j < messagePart.parts.length ; j++) {
                    let subEmaiLFormat = findFormatEmail(messagePart.parts[j]);
                    if( subEmaiLFormat !== "auto" )
                        return subEmaiLFormat;
                }
            }
        } 
    }
    return "auto"; 
}

/**
 * Update the message reply
 */
async function updateMessage(composeDetails, messageHeader, messagePart) {
    try {
        if (composeDetails.type == "reply") {
            let identityId = await browser.runtime.sendMessage({
                    command: "getIdentityId",
                    options: {
                        messageId: composeDetails.relatedMessageId
                    }
                });
            let prefAutoQuote = "changequote." + identityId + ".auto_quote";
            let quoted = await getPrefInStorage(prefAutoQuote, true);
            if (!quoted) { // no quote
                document.body.innerHTML = "<p><br /><p>";
            } else {
                let inner = document.body.innerHTML;

                if (inner.length < 20)
                    return;

                let sameFormatAsReceived = await getPrefInStorage("changequote.replyformat.enable");
                if (sameFormatAsReceived) {
                    let details = {};
                    let emaiLFormat = findFormatEmail(messagePart);
                    if( emaiLFormat === "plaintext") {
                        details.deliveryFormat = 'plaintext';
                        details.isPlainText = true;
                    } else if( emaiLFormat === "html") {
                        details.deliveryFormat = 'html';
                        details.isPlainText = false;
                    } else if( emaiLFormat === "alternative") {
                        let formatAlternative = await getPrefInStorage("changequote.replyformat.format");
                        if (formatAlternative) {
                            if (formatAlternative == 0) {
                                details.deliveryFormat = 'auto';
                            } else if (formatAlternative == 1) {
                                details.deliveryFormat = 'html';
                                details.isPlainText = false;
                            } else if (formatAlternative == 2) {
                                details.deliveryFormat = 'plaintext';
                                details.isPlainText = true;
                            }
                        } else {
                            details.deliveryFormat = 'both';
                        }
                    }
                    
                    await browser.runtime.sendMessage({
                        command: "updateComposeDetail",
                        options: {
                            details
                        }
                    });
                }
                let receivedDate = "";
                let received = messagePart.headers["received"];
                if (received) {
                    let size = received.length;
                    if (size >= 1) {
                        let receivedDateTab = received[size - 1].split(";");
                        if (receivedDateTab.length > 1) {
                            receivedDate = receivedDateTab[1];
                        }
                    }
                }

                let cqheaders_type = await getPrefInStorage("changequote.headers.type");
                let cqheaders_news = await getPrefInStorage("changequote.set.headers.news");
                let msgdate = messageHeader.date;

                let folder = messageHeader.folder;
                let isnntp = await browser.runtime.sendMessage({
                        command: "isNntpAccount",
                        options: {
                            accountId: folder.accountId
                        }
                    });
                let isStandardHeader = false;
                let realnewhdr = '';
                if (isnntp) {
                    if (cqheaders_news)
                        realnewhdr = await browser.runtime.sendMessage({
                                command: "getHeader",
                                options: {
                                    custom: true,
                                    isNNTP: isnntp,
                                    msgDate: msgdate,
                                    receivedDate: receivedDate,
                                    messageHeader: messageHeader,
                                    endline: "<br />"
                                }
                            });
                    else
                        isStandardHeader = true;
                } else {
                    if (cqheaders_type == 0) {
                        realnewhdr = await browser.runtime.sendMessage({
                                command: "getHeader",
                                options: {
                                    custom: false,
                                    isNNTP: isnntp,
                                    msgDate: msgdate,
                                    receivedDate: receivedDate,
                                    messageHeader: messageHeader,
                                    endline: "<br />"
                                }
                            });
                    } else if (cqheaders_type == 1)
                        isStandardHeader = true;
                    else
                        realnewhdr = await browser.runtime.sendMessage({
                                command: "getHeader",
                                options: {
                                    custom: true,
                                    isNNTP: isnntp,
                                    msgDate: msgdate,
                                    receivedDate: receivedDate,
                                    messageHeader: messageHeader,
                                    endline: "<br />"
                                }
                            });
                }
                if (!isStandardHeader) {
                    let replyTB = document.body.getElementsByClassName("moz-cite-prefix");
                    replyTB[0].innerHTML = realnewhdr;
                }
                let removeFirstLine = await getPrefInStorage("changequote.message.remove_first_line");
                if( removeFirstLine ) {
                    document.body.getElementsByTagName("br")[0].remove();
                }
            }
            let inlineImgRemove = await browser.runtime.sendMessage({
                    command: "needToRemoveInlineImages"
                });
            if (inlineImgRemove) {
                let elementImages = document.body.getElementsByTagName("img");
                for (let i = 0; i < elementImages.length; i++) {
                    let imgSrc = elementImages[i].getAttribute("src");
                    if (imgSrc.indexOf("http://") == -1 && imgSrc.indexOf("https://") == -1)
                        elementImages[i].remove();
                }
            }

            let markread_after_reply = await getPrefInStorage("changequote.message.markread_after_reply");
            if (markread_after_reply)
                await browser.runtime.sendMessage({
                    command: "markMsgRead"
                });
            let close_after_reply = await getPrefInStorage("changequote.window.close_after_reply");
            if (close_after_reply)
                await browser.runtime.sendMessage({
                    command: "closeWindows"
                });
        } else if (composeDetails.type == "forward") {
            let close_after_reply = await getPrefInStorage("changequote.window.close_after_reply");
            if (close_after_reply)
                await browser.runtime.sendMessage({
                    command: "closeWindows"
                });
        }
    } catch (e) {
        console.error(e);
    }
}

async function main() {
    let composeDetails = await browser.runtime.sendMessage({
            command: "getComposeDetails"
        });
    let message = await browser.runtime.sendMessage({
            command: "getMessage"
        });
    updateMessage(composeDetails, message.messageHeader, message.messagePart);
}

main();
