// Import any needed modules.
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// Global variables 
var CQprefs = Components.classes["@mozilla.org/preferences-service;1"].
    		getService(Components.interfaces.nsIPrefBranch);

var {MailUtils} = ChromeUtils.import("resource:///modules/MailUtils.jsm");


// Reset the headers to the standard
function standardHeader(msguri) {
	if (CQprefs.prefHasUserValue("mailnews.reply_header_type"))
	        CQprefs.clearUserPref("mailnews.reply_header_type");
	if (CQprefs.prefHasUserValue("mailnews.reply_header_authorwrote"))
   	     CQprefs.clearUserPref("mailnews.reply_header_authorwrote");
	if (CQprefs.prefHasUserValue("mailnews.reply_header_ondate"))
      		CQprefs.clearUserPref("mailnews.reply_header_ondate");
	if (CQprefs.prefHasUserValue("mailnews.reply_header_separator"))
        	CQprefs.clearUserPref("mailnews.reply_header_separator");
	if (CQprefs.prefHasUserValue("mailnews.reply_header_colon"))
        	CQprefs.clearUserPref("mailnews.reply_header_colon");
	if (CQprefs.prefHasUserValue("mailnews.reply_header_authorwrotesingle"))
   	     CQprefs.clearUserPref("mailnews.reply_header_authorwrotesingle");
	if (msguri)
		closeWindowOrMarkReadAfterReply(msguri);
}


function closeWindowOrMarkReadAfterReply(msguri) {
	if (! msguri) 
		return;
	try {
		if (CQprefs.getBoolPref("changequote.window.close_after_reply")) {
			var winurl = document.location.href;
                        if (winurl == "chrome://messenger/content/messageWindow.xul")
				setTimeout(function(){window.close();}, 1500);
		}
		if (CQprefs.getBoolPref("changequote.message.markread_after_reply")) {
			MarkSelectedMessagesRead(true);		
		}
	}
	catch(e) {}
}
	
