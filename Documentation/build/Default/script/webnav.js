var defaultTabHeight = 28;
var defaultHighlightForeColor = "black"
var defaultHightlightBackColor = "yellow"

var navButtonNames = [];
var navButtonTitles = [];
var navTabIndex = 1;

var navFrameVisible = true;
var navFrameWidth = "";

var navTitleTimer = null;

function DoAddToFavorites()
{
    var content = contentFrame();
	if (isPostMessageEnabled())
	{
		content.postMessage("addtofavorites","*");
	}
	else
	{
    var nav = navbarFrame();
    var fav = null;

    if(!document.all)
    {
        fav = nav.document.getElementById("cntNavfavorites");
        fav = fav.contentDocument;
    }
    else
        fav = nav.frames["cntNavfavorites"];

        AddToFavorites(content.document.title, content.location,fav);
        }
}

function QuickSearch()
{
    var content = contentFrame();
	if (isPostMessageEnabled())
	{
		content.postMessage("quicksearch|" + document.getElementById("txtQuickSearch").value,"*");
	}
	else
    HighlightText(content.document,document.getElementById("txtQuickSearch").value, defaultHighlightForeColor, defaultHightlightBackColor, true);
}

function ResetQuickSearch()
{
    var content = contentFrame();

	if (isPostMessageEnabled())
	{
		content.postMessage("resetquicksearch","*");
	}
	else
    removeAllHighlights(content.document);
}

function ToggleNavigationFrame()
{
	if (isPostMessageEnabled())
	{
		var toolbar = toolbarFrame();
		toolbar.postMessage("toggletitlevisibility","*");
		parent.postMessage("togglenavbarvisibility","*");
	}
	else
	{
        var colset = parent.document.getElementById("nav");
        var toolbar = toolbarFrame();
        var title = toolbar.document.getElementById("navbartitle");
        if(navFrameVisible)
        {
                navFrameVisible = false;
                navFrameWidth = colset.cols;
                colset.cols = "0,*"
                title.style.display = "none";
        }
        else
        {
                navFrameVisible = true;
                colset.cols = navFrameWidth
                title.style.display = "";
        }
}
}

function NavBarClickHandler(event)
{
        if(!event)
                event = window.event;

        var e = null;
        if(event.target)
                e = event.target;
        else
                e = event.srcElement;

        var done = false

        do
                if(e.parentNode!=null)
                {
                        e = e.parentNode;
                        var name = GetUserAttribute(e, "innovasys_navid");
                        if(name!=null)
                        {
                                // found a match
                                SetActiveNavTab(name);
                                done = true;
                        }
                }
                else
                {
                        done = true;
                }
        while(!done)
}

function GlobalSetActiveNavTab(name)
{
        var navbar = navbarFrame();
		if (isPostMessageEnabled())
		{
			navbar.postMessage("setactivenavtab|" + name, "*");
		}
		else
		{
        navbar.SetActiveNavTab(name);
}
}

function IsPostMessageEnabled()
{
	return (window.postMessage != null)
}

function SetContentDocument(url)
{
        var content = contentFrame();
        content.location = url;
}

function RefreshContentDocument()
{
        var content = contentFrame();
		if (isPostMessageEnabled()) 
		{
			content.postMessage("refresh","*");
		}
		else
		{		
        content.location.reload();
}
}

function PrintContentDocument()
{
        var content = contentFrame();
		if (isPostMessageEnabled()) 
		{
			content.postMessage("print","*");
		}
		else
		{		
        content.focus();
        content.window.print();
}
}

function SetActiveNavTab(name,setTimerIfRequired)
{
        var toolbar = toolbarFrame();

	if (!isPostMessageEnabled())
	{
		try
		{
    var titleElement = toolbar.document.getElementById("navbartitle");
		}
		catch (e)
		{}
	}
		
    var titleText = "";
        for (var i = 0; i < navButtonNames.length; i++)
        {
                var content = document.getElementById("divNav" + navButtonNames[i]);
                var header = document.getElementById("btnNav" + navButtonNames[i]);
                if(navButtonNames[i]==name)
                {
                        //show
                    if(!content.getAttribute("innovasys_loaded"))
                    {
                        content.childNodes[0].src = content.getAttribute("innovasys_src");
                        content.setAttribute("innovasys_loaded",true);
                    }
                        content.style.display = "";
                        header.className = "highlighttabitem";
                    titleText = navButtonTitles[i];
                }
                else
                {
                        //hide
                        content.style.display = "none";
                        header.className = "tabitem";
                }
        }

    if(navTitleTimer)
    {
        clearInterval(navTitleTimer);
    }

	if (!isPostMessageEnabled() && titleElement)
        titleElement.childNodes[0].nodeValue = titleText;
    else if(setTimerIfRequired)
    {
        eval("navTitleTimer = setTimeout(\"SetActiveNavTab('" + name + "')\",100)");
    }

	if (isPostMessageEnabled() && toolbar)
	{
		toolbar.postMessage("settitle|" + titleText,"*");
	}
}

function NavBarResizeHandler()
{
    // resize the title header in the toolbar
	if (isPostMessageEnabled())
	{
		var toolbar = toolbarFrame();
		toolbar.postMessage("settitlewidth|" + Math.max(getClientSize().width, 0) + "px","*");
	}
	else
	{
		try
		{
    var toolbar = toolbarFrame();
    toolbar.document.getElementById("navbartitle").style.width = Math.max(getClientSize().width, 0) + "px";
		}
		catch (e)
		{
		
		}
	}

    // now resize the content frames
    ResizeContentElements();
}

function LoadNavBar(base)
{
        var commandnodes;
        var node;
        var cmdcount = 0;
        var defaultTab = "";
		var xml;

		if (window['addEventListener']) 
        {
            window.addEventListener("resize", NavBarResizeHandler, false);
        }
        else 
        {
            window.attachEvent("onresize", NavBarResizeHandler);
        }
		
		var parent_url = decodeURIComponent(document.location.hash.replace(/^#/, ''));

		/* Listen for nav bar commands (e.g. synctoc) */
		if (isPostMessageEnabled())
        {
			addMessageListener(navBarMessageHandler);
        }

        commandnodes = getXmlIsland("navigationcommands");
		
		if (commandnodes)
			cmdcount = commandnodes.childNodes.length;
		
        // now create the buttons
        for (var index = 0; index < cmdcount; index++)
        {
                // load settings from XML
                node = commandnodes.childNodes[index];

                if(node.nodeType==1)
                {
                        var name = node.getAttribute("name");
                        var label = node.getAttribute("label");
                        var icon = node.getAttribute("icon");
                        var page = node.getAttribute("page");
                        var isDefault = parseInt(node.getAttribute("default"));

                        //create the element
                        CreateNavButton(name, icon, label, page)
                        navButtonNames.push(name);
                        navButtonTitles.push(label);

                        //default?
                        if(isDefault)
                        {
                                defaultTab = name;
                        }
                }
        }

        // set the active tab
        SetActiveNavTab(defaultTab,true);

        // size
        NavBarResizeHandler();

        window.onresize = NavBarResizeHandler;

        // Other browsers that don't support onresize
        if(!window.onresize)
        {
            setInterval('NavBarResizeHandler();',100);
        }
}

function ResizeContentElements()
{
    var height  = getClientSize().height;
    var location = height;

        // reduce the height according to the number of tabs
    for (var i = navButtonNames.length - 1; i >= 0; i--)
    {
        var tab = document.getElementById("btnNav" + navButtonNames[i]);
        var itemheight = tab.style.height ? parseInt(tab.style.height) : defaultTabHeight;
        tab.style.height = itemheight + "px";
        tab.style.position = "absolute";
        tab.style.bottom = (height - location) + "px";
        location -= itemheight;
    }

        // apply the new height to content frames
        for (var i = 0; i < navButtonNames.length; i++)
        {
                var content = document.getElementById("cntNav" + navButtonNames[i]);
                if (location > 0)
                    content.style.height = location + "px";
        }
}

function CreateNavButton(name, icon, label, page)
{
        var wrapperDiv = document.createElement("div");
        var contentDiv = document.createElement("div");
        var headerBtn = document.createElement("table");
        var headerBody = document.createElement("tbody");
        var headerRow = document.createElement("tr");
        var cellIcon = document.createElement("td");
        var cellLabel = document.createElement("td");
        var img = document.createElement("img");
        var contentFrame = document.createElement("iframe");
        var link = document.createElement("a");

        wrapperDiv.id = "tab" + name;
        wrapperDiv.setAttribute("innovasys_navid", name);

        // build the header table
        headerBtn.className = "tabitem";
        headerBtn.id = "btnNav" + name;
        cellIcon.className = "icon";
        img.src = icon;
        img.alt = label;
        img.width = 16;
        img.height = 16;
        headerBtn.onclick = NavBarClickHandler;
        cellLabel.appendChild(document.createTextNode(label))

        // and the content div
        contentDiv.id = "divNav" + name;
        contentDiv.style.display = "none";
        contentDiv.className = "stretcher";
        contentFrame.id = "cntNav" + name;
        contentFrame.name = contentFrame.id;
        contentFrame.frameBorder = 0;
        contentDiv.setAttribute("innovasys_src",page);
        contentFrame.style.width = "100%"

        // add the elements to the page
        contentDiv.appendChild(contentFrame);
        cellIcon.appendChild(img);
        headerRow.appendChild(cellIcon);
        headerRow.appendChild(cellLabel);
        headerBody.appendChild(headerRow);
        headerBtn.appendChild(headerBody);
        wrapperDiv.appendChild(headerBtn);
        wrapperDiv.appendChild(contentDiv);
        document.body.appendChild(wrapperDiv);
}

function LoadToolbar(parent, base)
{
    var doc;
    var commandnodes;
    var node;
    var xmlfile = GetFolderPath(window.location) + base + ".xml";
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    var tr = document.createElement("tr");
    var td;
    var cmdcount = 0;
    var btn;

	/* Listen for tool bar commands (e.g. settitle) */
	if (isPostMessageEnabled())
	{
		addMessageListener(toolbarMessageHandler);
	}

    /* setup the new table */
    table.id = "toolbar";
    table.style.width = "auto";

    commandnodes = getXmlIsland("toolbarcommands");
	if (commandnodes)
            cmdcount = commandnodes.childNodes.length;

    // now create the buttons
    for (var index = 0; index < cmdcount; index++)
    {
            // get the source node
            node = commandnodes.childNodes[index];
            if(node.nodeType==1)
            {

            /* create the table cell to hold our button */
            td = document.createElement("td");

            /* load settings from XML */
            var cmd = node.getAttribute("type")
            var label = node.getAttribute("label");
            var src = node.getAttribute("page");
            var image = node.getAttribute("image");
            var hotimage = node.getAttribute("hotimage");
            var selectedimage = node.getAttribute("selectedimage");

            /* add a prefix label */
            if(label!="" && cmd!="label" && cmd!="logo")
            {
                            /* add a label */
            var labelcell = document.createElement("td");
                            CreateLabel(labelcell, label);
            tr.appendChild(labelcell);
            }

            /* create a command */
            switch(cmd)
            {
                    case "addtofavorites":
                            btn = CreateButton(td, getPhrase("AddToFavorites"), "images/toolbar/addtofavorites.gif", "images/toolbar/addtofavoriteshot.gif", null, 22, 22, null);
                            btn.onclick = function() { DoAddToFavorites(); }
                            break;

                    case "togglenavigation":
                            btn = CreateButton(td, getPhrase("HideNavigation"), "images/toolbar/togglenav.gif", "images/toolbar/togglenavhot.gif", null, 22, 22, null);
                            btn.onclick = function() { ToggleNavigationFrame(); }
                            break;

                    case "expandall":
                            btn = CreateButton(td, getPhrase("ExpandAll"), "images/toolbar/expand.gif", "images/toolbar/expandhot.gif", null, 22, 22, null);
                            btn.onclick = function() { alert("Not implemented"); }
                            break;

                    case "collapseall":
                            btn = CreateButton(td, getPhrase("Collapse All"), "images/toolbar/collapse.gif", "images/toolbar/collapsehot.gif", null, 22, 22, null);
                            btn.onclick = function() { alert("Not implemented"); }
                            break;

                    case "printtopic":
                            btn = CreateButton(td, getPhrase("PrintTopic"), "images/toolbar/print.gif", "images/toolbar/printhot.gif", null, 22, 22, null);
                            btn.onclick = function() { PrintContentDocument(); }
                            break;

                    case "quicksearch":

                        var searchcell = document.createElement("td");
                        var form = document.createElement("form");
                        var input = document.createElement("input");

                        searchcell.style.width = "150px";
                        form.id = "searchform"
                        form.onsubmit = function() { QuickSearch(); return false; };
                        input.id = "txtQuickSearch";
                        input.name = "quicksearch"
                        input.type = "text";
                        // input.tabIndex = elementtabindex++;
                        input.title = getPhrase("QuickSearch");
                        input.cssClass = "field";

                        /* add the children */
                        form.appendChild(input);
                        searchcell.appendChild(form);
                        tr.appendChild(searchcell);

                            btn = CreateButton(td, getPhrase("QuickSearch"), "images/toolbar/search.gif", "images/toolbar/searchhot.gif", null, 22, 22, null);
                            btn.onclick = function() { QuickSearch(); }
                            break;

                    case "clearsearch":
                            btn = CreateButton(td, getPhrase("ClearSearch"), "images/toolbar/resetsearch.gif", "images/toolbar/resetsearchhot.gif", null, 22, 22, null);
                            btn.onclick = function() { ResetQuickSearch(); }
                            break;

                    case "back":
                            btn = CreateButton(td, getPhrase("Back"), "images/toolbar/navback.gif", "images/toolbar/navbackhot.gif", null, 22, 22, null);
                            btn.onclick = function() { history.back(); }
                            break;

                    case "forward":
                            btn = CreateButton(td, getPhrase("Forward"), "images/toolbar/navforward.gif", "images/toolbar/navforwardhot.gif", null, 22, 22, null);
                            btn.onclick = function() { history.forward(); }
                            break;

                    case "stop":
                            btn = CreateButton(td, getPhrase("Stop"), "images/toolbar/navstop.gif", "images/toolbar/navstophot.gif", null, 22, 22, null);
                            btn.onclick = function() { SetContentDocument(defaultTopic); }
                            break;

                    case "refresh":
                            btn = CreateButton(td, getPhrase("Refresh"), "images/toolbar/navrefresh.gif", "images/toolbar/navrefreshhot.gif", null, 22, 22, null);
                            btn.onclick = function() { RefreshContentDocument(); }
                            break;

                    case "home":
                            btn = CreateButton(td, getPhrase("Home"), "images/toolbar/navhome.gif", "images/toolbar/navhomehot.gif", null, 22, 22, null);
                            btn.onclick = function() { SetContentDocument(defaultTopic); }
                            break;

                    case "gotoc":
                            btn = CreateButton(td, getPhrase("TableOfContents"), "images/toolbar/toc.gif", "images/toolbar/tochot.gif", null, 22, 22, null);
                            btn.onclick = function() { GlobalSetActiveNavTab("toc"); }
                            break;

                    case "goindex":
                            btn = CreateButton(td, getPhrase("Index"), "images/toolbar/index.gif", "images/toolbar/indexhot.gif", null, 22, 22, null);
                            btn.onclick = function() { GlobalSetActiveNavTab("index"); }
                            break;

                    case "gosearch":
                            btn = CreateButton(td, getPhrase("Search"), "images/toolbar/search.gif", "images/toolbar/searchhot.gif", null, 22, 22, null);
                            btn.onclick = function() { GlobalSetActiveNavTab("search"); }
                            break;

                    case "goglossary":
                            btn = CreateButton(td, getPhrase("Glossary"), "images/toolbar/glossary.gif", "images/toolbar/glossaryhot.gif", null, 22, 22, null);
                            btn.onclick = function() { GlobalSetActiveNavTab("glossary"); }
                            break;

                    case "gofavorites":
                            btn = CreateButton(td, getPhrase("Favorites"), "images/toolbar/favorites.gif", "images/toolbar/favoriteshot.gif", null, 22, 22, null);
                            btn.onclick = function() { GlobalSetActiveNavTab("favorites"); }
                            break;

                    case "sep":
                            // toolbar seperator
            var btn = document.createElement("div");
            var img = document.createElement("img");

            img.src = "images/toolbar/seperator.gif";
            img.alt = "Separator";
            img.style.width = "2px";
            img.style.height = "22px";

            btn.appendChild(img);
            td.appendChild(btn);

            td.style.width = "2px";
            td.style.height = "22px";
            break;

        case "logo":
            // add a right aligned logo
            // ideally this should be the last command in the load file
            var img = document.createElement("img");

            img.src = image;
            img.alt = label;

            td.className = "logo";
            td.appendChild(img)
            break;

                    case "label":
                            // create a plain text label
                            CreateLabel(td, label);
                            break;

                    default:
                            // unknown, don't add anything
                            td = null;
                            break;
            }

            /* add only if it's a valid item */
            if(td!=null)
            {
                    tr.appendChild(td);
            }
            }

    }

    // add our toolbar table
    tbody.appendChild(tr);
    table.appendChild(tbody);
    parent.appendChild(table);
    
    // This step is necessary to prevent a security warning in IE
    //  when the pages are obtained through SSL
    tableSRC = table.outerHTML;       

    var framespage = frameContainer();
	if (isPostMessageEnabled())
	{
		framespage.postMessage("toolbarloaded","*");
	}
	else
	{
    framespage.toolbarloaded = true;
}
}

function CreateLabel(parent, label)
{
    if (label.substring(0,2) == "$$")
    {
        label = getPhrase(label.substring(2));
    }
    
    var tempSpan = document.createElement("span");

    tempSpan.appendChild(document.createTextNode(label));
    document.body.appendChild(tempSpan);

    var tempSpanWidth   = tempSpan.offsetWidth;
    var tempSpanHeight  = tempSpan.offsetHeight;

    document.body.removeChild(tempSpan);

    CreateButton(parent, null, null, null, null, tempSpanWidth, tempSpanHeight, label);
}

function CreateButton(parent, tooltip, image, hotImage, selectedImage, width, height, label)
{
    var btn = document.createElement("div");
    btn.className = "button";

    if(selectedImage==null)
    {
        selectedImage = hotImage
    }

    /* set button properties */
    tooltip ? btn.title = tooltip : false;
    btn.setAttribute("innovasys_width", width);
    btn.setAttribute("innovasys_height", height);

    /* set a tab index if it's a proper button */
    if(image!=null)
    {
        //btn.tabIndex = elementtabindex++;
        btn.setAttribute("innovasys_image", image);
        btn.setAttribute("innovasys_hotimage", hotImage);
        btn.setAttribute("innovasys_selectedimage", selectedImage);
    }

    /* add a label */
    if(label!=null)
    {
        btn.appendChild(document.createTextNode(label));
    }

    /* initialize the button */
    parent.appendChild(btn);
    InitializeButton(btn);

    // return the element for more processing
    return btn
}

function InitializeButton(btn)
{
    var width   = parseInt(GetUserAttribute(btn, "innovasys_width")) + "px";
    var height  = parseInt(GetUserAttribute(btn, "innovasys_height")) + "px";

    /* set default button properties and size */
    btn.style.cursor = "default";
    btn.style.width = width;
    btn.style.height = height;

    /* image event suupport */
    if(GetUserAttribute(btn, "innovasys_image")!=null)
    {
        btn.style.backgroundImage = "url(" + GetUserAttribute(btn, "innovasys_image") + ")";
        btn.onmouseover = function() {this.style.backgroundImage = "url(" + GetUserAttribute(this, "innovasys_hotimage") + ")"; };
        btn.onmouseout = function() {this.style.backgroundImage = "url(" + GetUserAttribute(this, "innovasys_image") + ")"; };
        /*
        button.onmousedown = function() { StartPress( this ); return false; };
        */
    }

    /* set the parent cell to be the same size as the button */
    btn.parentNode.style.width = width;
    btn.parentNode.style.height = height;
}
/* Message processing */
function navBarMessageHandler(event) {
    var message = getMessage(event.data);
    
	switch (message.messageType) 
	{
		case "setactivenavtab":
			SetActiveNavTab(message.messageData, true);
			break;		
		case "synctoc":
			/* Forward to toc frame */
			var toc = document.getElementById("cntNavtoc").contentWindow;
			toc.postMessage("pageloaded|" + message.messageData,"*");
			break;
		case "addtofavorites":
			/* Forward to favorites frame */
			var favorites = document.getElementById("cntNavfavorites").contentWindow;
			favorites.postMessage(event.data,"*");
			break;
	}
}  

function toolbarMessageHandler(event) {
	var message = getMessage(event.data);
    
	switch (message.messageType) 
	{
		case "settitle":
			var titleElement = document.getElementById("navbartitle");
			if (titleElement)
				titleElement.childNodes[0].nodeValue = message.messageData;
			break;
		case "settitlewidth":
			document.getElementById("navbartitle").style.width = message.messageData;
			break;
		case "toggletitlevisibility":
			var titleElement = document.getElementById("navbartitle");
			if (titleElement)
			{
				if (titleElement.style.display == "none")
				{
					titleElement.style.display = "";
				}
				else
				{
					titleElement.style.display = "none";
				}
			}
			break;
	}
}