// Import any needed modules.
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

// Global variables 
var CQprefs = Components.classes["@mozilla.org/preferences-service;1"].
    		getService(Components.interfaces.nsIPrefBranch);
var CQinlineImages = 0;

var CQmsgComposeType = Components.interfaces.nsIMsgCompType;
var CQmsgComposeFormat = Components.interfaces.nsIMsgCompFormat;

var {MailUtils} = ChromeUtils.import("resource:///modules/MailUtils.jsm");
// values for "changequote.headers.type":
// 0 = extended headers
// 1 = standard headers
// 2 = customized headers via user.js file
//
// values for "changequote.headers.date_long_format":
// 0 = long, in locale time and in locale 
// 1 = long, in locale time and in english
// 2 = long, from the original message header
// 3 = custom

// Load an additional JavaScript file.
Services.scriptloader.loadSubScript("chrome://changequote/content/changequote/changequote.js", window, "UTF-8");



function onLoad(activatedWhileWindowOpen) {

    // Overwrite the original functions of reply and quote
    
    if (typeof MsgReplyToListMessageORIG == "undefined" && typeof window.MsgReplyToListMessage != "undefined") {
        var MsgReplyToListMessageORIG = window.MsgReplyToListMessage;
        window.MsgReplyToListMessage = function(event) {
            var messageArray =  [CQGetFirstSelectedMessage()];
            var CQheaders_news = CQprefs.getBoolPref("changequote.set.headers.news");
            if (CQheaders_news)
                loadHeader(messageArray[0], true, true,false);
            else
                standardHeader(messageArray[0]);
            MsgReplyToListMessageORIG.apply(this,arguments);
        };
    }
    
    if (typeof MsgReplySenderORIG == "undefined" && typeof window.MsgReplySender != "undefined") {
        var MsgReplySenderORIG = window.MsgReplySender;
        window.MsgReplySender = function MsgReplySender(event) {
            
            var CQreplyformat = CQprefs.getBoolPref("changequote.replyformat.enable");
            // Choose the format of reply: clone the format of the mail?
            if (CQreplyformat)
                window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyToSender,-1,false);
            else {
                // So no - usual behaviour of TB
                if (event && event.shiftKey)
                    window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyToSender,CQmsgComposeFormat.OppositeOfDefault,false);
                else
                    window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyToSender,CQmsgComposeFormat.Default,false);
            }
        }
    }
    
     if (typeof MsgReplyToAllMessageORIG == "undefined" && typeof window.MsgReplyToAllMessage != "undefined") {
        var MsgReplyToAllMessageORIG = window.MsgReplyToAllMessage;
        window.MsgReplyToAllMessage = function MsgReplyToAllMessage(event){
        
            var CQreplyformat = CQprefs.getBoolPref("changequote.replyformat.enable");	
            if (CQreplyformat) 
                window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyAll,-1,false);	
            else {
                // So no - usual behaviour of TB
                if (event && event.shiftKey)
                    window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyAll,CQmsgComposeFormat.OppositeOfDefault,false);
                else
                    window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyAll,CQmsgComposeFormat.Default,false);
            }
        }
    }
    
     if (typeof MsgReplyGroupORIG == "undefined" && typeof window.MsgReplyGroup != "undefined") {
        var MsgReplyGroupORIG = window.MsgReplyGroup;
        window.MsgReplyGroup = function MsgReplyGroup(event) {  
    
            if (event && event.shiftKey)
                window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyToGroup,CQmsgComposeFormat.OppositeOfDefault,true);
            else
                window.changequote.CQcomposeMessage(CQmsgComposeType.ReplyToGroup,CQmsgComposeFormat.Default,true);
                
            // if (CQinlineImages == 1)
            //	 preRestoreInline();
        }
     }
     
    window.addEventListener("load", window.changequote.CQaddListener, false);
	window.addEventListener("unload", window.standardHeader, false);



    WL.injectElements(`<toolbaritem id="hdrSmartReplyButton">
    <toolbarbutton is="toolbarbutton-menu-button" type="menu-button" label="test">
        <menupopup id="hdrReplyDropdown" onpopupshowing="changequote.CQsetReverseLabelHRD()" >
            <menuseparator />
            <menuitem label="&CQlabelitem1;" tooltiptext="&CQlabelitem1;" oncommand="changequote.replyHTML(event,false);" />
            <menuitem label="&CQlabelitem2;"  tooltiptext="&CQlabelitem2;" oncommand="changequote.replyText(event,false);" />
            <menuseparator />
            <menuitem id="replyhtml_reversequote_hrd1" label="&CQlabelitem1; &noquote;" tooltiptext="&CQlabelitem1;" oncommand="changequote.replyHTML(event,true);" />
            <menuitem id="replytext_reversequote_hrd1" label="&CQlabelitem2;  &noquote;"  tooltiptext="&CQlabelitem2;" oncommand="changequote.replyText(event,true);" />
            <menuitem id="replyhtml_reversequote_hrd2" label="&CQlabelitem1; &yesquote;" tooltiptext="&CQlabelitem1;" oncommand="changequote.replyHTML(event,true);" />
            <menuitem id="replytext_reversequote_hrd2" label="&CQlabelitem2; &yesquote;"  tooltiptext="&CQlabelitem2;" oncommand="changequote.replyText(event,true);" />
            <menuseparator />
            <menuitem label="&CQnoReplyTo;" oncommand="changequote.CQnoReplyTo(event);" />
        </menupopup>
        <!-- <toolbarbutton id="hdrReplyToSenderButton" /> -->
        <!-- <dropmarker type="menu-button" class="toolbarbutton-menubutton-dropmarker" /> -->
    </toolbarbutton>
</toolbaritem>`, ["chrome://changequote/locale/changequote.dtd"]);
}


function onUnload(deactivatedWhileWindowOpen) {
  // Cleaning up the window UI is only needed when the
  // add-on is being deactivated/removed while the window
  // is still open. It can be skipped otherwise.
  if (!deactivatedWhileWindowOpen) {
    return
  }

}
