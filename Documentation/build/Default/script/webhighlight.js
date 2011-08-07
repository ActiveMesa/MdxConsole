/* Search highlight support */

var firstMatch=null;

/* Returns an elements absolute position, allowing for the non-scrolling header */
function getElementPosition(e)
{
    var offsetLeft = 0;
    var offsetTop = 0;

    while (e)
    {
        // Allow for the scrolling body region in IE
        if (msieversion() > 4)
        {
            offsetLeft += (e.offsetLeft - e.scrollLeft);
            offsetTop += (e.offsetTop - e.scrollTop);
        }
        else
        {
            offsetLeft += e.offsetLeft ;
            offsetTop += e.offsetTop;
        }

        e = e.offsetParent;
    }

    if (navigator.userAgent.indexOf('Mac') != -1 && typeof document.body.leftMargin != 'undefined')
    {
        offsetLeft += document.body.leftMargin;
        offsetTop += document.body.topMargin;
    }

    return {left:offsetLeft,top:offsetTop};
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

/* Highlight text in a document */
function HighlightText(targetDocument,text,color,backColor,clearBefore)
{
	if(clearBefore)
	{
		firstMatch=null;
		removeAllHighlights(targetDocument);
	}

	if(text != "")
	{
		HighlightTextInElement(targetDocument,targetDocument.body,text,color,backColor,firstMatch);
		// Scroll to the first hit if it's not already visible
		if(firstMatch && clearBefore)
		{
		    if(getElementPosition(firstMatch).top > targetDocument.documentElement.scrollTop+targetDocument.documentElement.clientHeight || getElementPosition(firstMatch).top < targetDocument.documentElement.scrollTop)
		    {
			    targetDocument.documentElement.scrollTop = firstMatch.offsetTop;
			}
		}
	}
}

/* Highlight text in a specific element */
function HighlightTextInElement(targetDocument,element,text,color,backColor)
{
	var lowerCaseText = text.toLowerCase();
	var node=null;
	var nodeText=null;
	var lowerCaseNodeText=null;
	var highlightSpan=null;
	var remainingText=null;
	var textNode=null;
	var selection=null;

    // Traverse the document backwards otherwise the DOM returns stale objects as
    //  we make modifications
    for(var x=element.childNodes.length-1;x>=0;x--)
    {
	    node = element.childNodes[x];

	    // Text Node
	    if(node.nodeType == 3)
	    {
		    nodeText = node.nodeValue;
		    lowerCaseNodeText = nodeText.toLowerCase();
		    for(pos=lowerCaseNodeText.indexOf(lowerCaseText);pos>=0;pos=lowerCaseNodeText.indexOf(lowerCaseText))
		    {
			    // Create a span to mark up the highlight
			    highlightSpan = targetDocument.createElement("SPAN");
			    highlightSpan.style.backgroundColor = backColor;
			    highlightSpan.style.color = color;
			    highlightSpan.className = "InnovasysSearchHighlight";
			    highlightSpan.appendChild(targetDocument.createTextNode(nodeText.substring(pos,pos+text.length)));

			    // Insert the span containing the term
			    remainingText = targetDocument.createTextNode(nodeText.substring(pos+text.length,nodeText.length));
			    node.nodeValue = nodeText.substring(0,pos);
				highlightSpan = node.parentNode.insertBefore(highlightSpan,node.nextSibling);
				remainingText = node.parentNode.insertBefore(remainingText,highlightSpan.nextSibling);

			    // Store the first (last)hit so we can scroll to it
			    firstMatch = highlightSpan;

			    // Skip past the new nodes we've added
			    node = node.nextSibling.nextSibling;
			    nodeText = node.nodeValue;
			    lowerCaseNodeText = nodeText.toLowerCase();
		    }
	    }
	    // Element node
	    else if(node.nodeType == 1)
	    {
	        // To ensure we don't modify script or go over
	        //  highlights we have already applied
		    if(node.nodeName != "SCRIPT" && !(node.nodeName == "SPAN" && node.className == "InnovasysSearchHighlight"))
		    {
			    HighlightTextInElement(targetDocument,node,text,color,backColor);
		    }
	    }
    }
}

/* Returns all highlight SPAN elements for a document */
function getHighlightSpans(targetDocument)
{
	var spans=targetDocument.getElementsByTagName("SPAN");
	var highlightSpans = new Array();
	var span=null;
	var highlightSpanCount=0;

	for(x=spans.length-1;x>=0;x--)
	{
	    span = spans[x];
		if(span.className == "InnovasysSearchHighlight")
		{
		    highlightSpans[highlightSpanCount] = span;
		    highlightSpanCount++;
		}
	}

	return highlightSpans;
}

/* Merges any adjacent text node.s The IE DOM in particular has a habit of
    splitting up text nodes, and also after highlighting and removing split
    adjacent nodes can be left */
function cleanUpTextNodes(parentNode)
{
    var node=null;
    var lastNode=null;
    var mergeCount=null;

    do
    {
        mergeCount=0;
        for(var x=1;x<parentNode.childNodes.length;x++)
        {
            node = parentNode.childNodes[x];
            lastNode = node.previousSibling;

            if(node.nodeType == 3 && lastNode.nodeType == 3)
            {
                node.nodeValue = lastNode.nodeValue + node.nodeValue;
                parentNode.removeChild(lastNode);
                mergeCount++;
            }
        }
    }
    while(mergeCount>0)

    for(var x=0;x<parentNode.childNodes.length;x++)
    {
        cleanUpTextNodes(parentNode.childNodes[x]);
    }
}

/* Removes any previously added highlight SPANs from the document */
function removeAllHighlights(targetDocument)
{
	var spans=getHighlightSpans(targetDocument);
	var text=null;

	for(x=spans.length-1;x>=0;x--)
	{
		span = spans[x];
		text = targetDocument.createTextNode(span.innerHTML);
		span.parentNode.replaceChild(text,span);
	}

	// This process may have resulted in multiple contiguous text nodes
	//  which could cause problems with subsequent search highlight operations
	// So we join any continguous text nodes here
	cleanUpTextNodes(targetDocument.body);
}