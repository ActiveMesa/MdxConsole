/* General Utility Functions */

var ELEMENT_NODE = 1;

function getPhrase(name)
{
    var span = document.getElementById("phrase_" + name);
    if (span)
    {
        return span.innerHTML;
    }
}

function getClientSize()
{
    var height=0;
    var width=0;
    var doc=document;
    var win=window;

    if(doc.compatMode == 'CSS1Compat' && !win.opera && doc.documentElement && doc.documentElement.clientHeight)
    {
        height = doc.documentElement.clientHeight;
        width = doc.documentElement.clientWidth;
    }
    else if(doc.body && doc.body.clientHeight)
    {
        height = doc.body.clientHeight;
        width = doc.body.clientWidth;
    }
    else if(isDefined(win.innerHeight,win.innerWidth,doc.width))
    {
        height = win.innerHeight;
        width = win.innerWidth;
    }

    if(doc.width > win.innerWidth)
    {
        width = width - 16;
        height = height - 16;
    }

    return {width:width,height:height};
}

function isDefined()
{
  for(var x=0;x<arguments.length;x++)
  {
    if(typeof(arguments[x])=='undefined')
        return false;
  }
  return true;
}

function GetUserAttribute(element, attribute)
{
    var value = null;

    try
    {
        if(element.getAttribute(attribute) != null)
        {
            value = element.getAttribute(attribute);
        }
        else if (element.getAttribute(attribute.substring("innovasys_".length, attribute.length)))
        {
            value = element.getAttribute(attribute.substring("innovasys_".length, attribute.length));
        }
    }
    catch(err)
    {
    }

    return value;
}

function documentElement(id)
{
    return document.getElementById(id);
}

function sourceElement(e)
{
    if (window.event)
    {
        e = window.event;
    }

    return e.srcElement? e.srcElement : e.target;
}
    
/* Return Microsoft Internet Explorer (major) version number, or 0 for others. */
function msieversion()
{
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf ( "MSIE " );

    if ( msie > 0 ) // is Microsoft Internet Explorer; return version number
    {
        return parseInt ( ua.substring ( msie+5, ua.indexOf ( ".", msie ) ) );
    }
    else
    {
        return 0;    // is other browser
    }
}   

/* Returns true if the passed element is currently in view */
function InView(element,margin) {
  if(!margin) margin=0;
  var Top=GetTop(element), ScrollTop=GetScrollTop();
  return !(Top<ScrollTop+margin||
    Top>ScrollTop+GetWindowHeight()-element.offsetHeight-margin);
}

/* Scrolls to ensure the passed element is currently in view */
function ScrollIntoView(element,bAlignTop,margin) {
  if(!margin) margin=0;
  var posY=GetTop(element);
  if(bAlignTop) posY-=margin;
  else posY+=element.offsetHeight+margin-GetWindowHeight();
  window.scrollTo(0, posY);
}

function GetWindowHeight() {
  return window.innerHeight||
    document.documentElement&&document.documentElement.clientHeight||
    document.body.clientHeight||0;
}

function GetScrollTop() {
  return window.pageYOffset||
    document.documentElement&&document.documentElement.scrollTop||
    document.body.scrollTop||0;
}

function GetTop(element) {
    var pos=0;
    do pos+=element.offsetTop
    while(element=element.offsetParent);
    return pos;
}

function findParentTagByName(e,tagName)
{
    if (!e)
        return;
    else if (e.tagName === tagName)
        return e;    
    else
        return findParentTagByName(e.parent,tagName);                      
}

/* End: General Utility Functions */


/* End: Frame helpers */

function findFrame(Name)
{
    var frameObject = parent.frames[Name];
    if((!frameObject) && parent.parent)
    {
        frameObject = parent.parent.frames[Name];
    }
    return frameObject;
}

function contentFrame()
{
    return findFrame("webcontent");
}

function toolbarFrame()
{
    return findFrame("webtoolbar");
}

function navbarFrame()
{
    return findFrame("webnavbar");
}

function frameContainer()
{
	try
	{
    var frameLocation = parent.location.href;
    if (frameLocation.indexOf('webframe.') != -1)
        return parent;
    else if(parent.parent)
        return parent.parent;
}
	catch (e)
	{
		return parent;
	}
}

function contentDocument()
{
    return findFrame("webcontent").document;
}

/* End: Frame helpers */


/* Load XML functionality */

function LoadXml(xmlfile)
{
    var xmlDoc = null;

    if(window.ActiveXObject)
    {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.load(xmlfile);
    }
    else if(window.XMLHttpRequest)
    {
        var xmlHTTP = null;
        xmlHTTP = new XMLHttpRequest();
        xmlHTTP.open("GET", xmlfile, false);
        try
        {
            xmlHTTP.send( null );
        }
        catch (err)
        {
            xmlHTTP.abort();
        }
        xmlDoc = xmlHTTP.responseXML;
    }
    else if(document.implementation && document.implementation.createDocument)
    {
        xmlDoc = document.implementation.createDocument("", "", null);
        xmlDoc.load(xmlfile);
    }
    return xmlDoc;
}

function GetFolderPath(location)
{
    var path = null;
    var href = location.href;
    var url = href.substring(0, href.lastIndexOf(location.hash));

    path = url.substring(0, url.lastIndexOf("/") + 1);

    return path;
}

/* End: Load XML functionality */


/* Cookie functionality */

function setCookie(name, value, expires, path, domain, secure)
{
    document.cookie= name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires.toGMTString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
}

function getCookie(name)
{
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1)
    {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    }
    else
    {
        begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1)
    {
        end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
}

function deleteCookie(name, path, domain)
{
    if (getCookie(name))
    {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}

/* End: Cookie functionality */


/* Action-after-load functionality */

var waiting = false;

function loadAndExecute( href, action )
{
        if(waiting)
        {
            clearTimeout( waiter );
            waiter = false;
            waiting = false;
        }
        var container = frameContainer();
        container.loaded = false;
        var content = contentFrame();
        content.location = href;
        waitUntilContentLoaded(action);
}

function waitUntilContentLoaded(action)
{
        if(action)
            waitUntilContentLoadedAction = action;

        var container = frameContainer();

        if( !container.loaded)
        {
            waiter = setTimeout("waiter=false;waiting=false;waitUntilContentLoaded()",100);
            waiting = true;
        }
        else
            eval( waitUntilContentLoadedAction );
}

/* End: Action-after-load functionality */

/* Xml Island */
function getXmlIsland(id)
{
	var nodes = null;
	
	try
	{
			xml = document.getElementById(id);
			if (xml.documentElement != null)
			{
				// IE
				nodes = xml.documentElement;
			}
			else
			{
				// Firefox, chrome etc.
				for (var index = 0; index < xml.childNodes.length; index++)
				{	
					node = xml.childNodes[index];
					if (node.nodeType == ELEMENT_NODE)
					{
						nodes = node;
						break;
					}
				}
			}
	}
	catch(err)
	{
	}
	
	return nodes;
}

/* Common Messaging Support */
function isPostMessageEnabled() {
    return (window['postMessage'] != null);
}

function addMessageListener(receiver) {
    if (isPostMessageEnabled())
    {
        if (window['addEventListener']) 
        {
            window.addEventListener("message", receiver, false);
        }
        else 
        {
            window.attachEvent("onmessage", receiver);
        }
    }
}

function Message(messageType,messageData)
{
	this.messageType = messageType;
	this.messageData = messageData;
}

function getMessage(data)
{
	var separator = data.indexOf("|");
    var messageType;
	var messageData;
	
	if (separator != -1)	
	{
		messageType = data.substring(0, separator);
		messageData = data.substring(separator + 1);
	}
	else
	{
		messageType = data;
		messageData = "";
	}
	
	return new Message(messageType,messageData);
}
/* Common Messaging Support */