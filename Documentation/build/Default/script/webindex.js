/* Index functionality */

var lastSelectedElement=null;

function findIndexEntry(e)
{
    if(!e)
        e = window.event;

    var term = document.getElementById("txtSearch").value;
    term = term.toLowerCase();
    var element = null;
    var bodyElement = document.getElementById("indexbody");
    var found=false;

    if(term.length > 0)
    {
        for(x=1;x<bodyElement.childNodes.length;x++)
        {
            element = bodyElement.childNodes[x];
            if(element.nodeType == 1)
            {
                if(element.nodeName == "A")
                {
                    if(element.childNodes[0].nodeValue.substring(0,term.length).toLowerCase() == term)
                    {
                        bodyElement.scrollTop = element.offsetTop;
                        if(lastSelectedElement)
                            lastSelectedElement.style.background = "";
                        element.style.background = "#d0d0d0";
                        lastSelectedElement = element;
                        found = true;
                        break;
                    }
                }
            }
        }
    }

    if(!found)
    {
        if(lastSelectedElement)
        {
            lastSelectedElement.style.background = "";
            lastSelectedElement = null;
        }
        bodyElement.scrollTop = 0;
    }
    else
    {
        if(e.keyCode == 13)
            contentFrame().document.location.href = lastSelectedElement.href;
    }

}

function indexLoad()
{
    document.getElementById("indexcontainer").onresize=resizeContainer;
    resizeContainer();
}

function resizeContainer()
{
    setInterval("resizeContainerNow()",1);
}

function resizeContainerNow()
{
    try
    {
        document.getElementById("indexbody").style.height = (getClientSize().height-20) + "px";
        document.getElementById("indexbody").style.width = (getClientSize().width) + "px";
    }
    catch(e)
    { }
}