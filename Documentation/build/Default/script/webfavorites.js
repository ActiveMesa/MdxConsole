/* Favorites support */

function InitializeFavorites()
{
	/* Listen for favorites commands */
	if (isPostMessageEnabled())
	{
		addMessageListener(favoritesMessageHandler);
	}

    var count = getFavoritesCount();
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");

    //setup the table
    table.id = "tblFavorites";
    table.className = "favorites";

    //build the table rows
    if(count!=null)
    {
        // one or more favorite entries exist
        for (var index = 0; index < count; index++)
        {
            var title = getFavoriteTitle(index + 1);
            var url = getFavoriteURL(index + 1);
            var row = document.createElement("tr");
            var link = document.createElement("a");
            var imgDelete = document.createElement("img")
            var linkDelete = document.createElement("a")
            var cellLink = document.createElement("td");

            //build the row
            link.href= url;
            link.appendChild(document.createTextNode(title));
            link.target = "webcontent";
            cellLink.appendChild(link);
            row.appendChild(cellLink);
            cellLink.appendChild(document.createTextNode(" "));

            //build the delete command
            imgDelete.src = "images/toolbar/deletesm.gif";
            imgDelete.alt = "Delete";
            imgDelete.width = 10;
            imgDelete.height = 10;
            linkDelete.href = "javascript:DeleteFromFavorites(" + (index + 1) + ");";
            linkDelete.appendChild(imgDelete);
            cellLink.appendChild(linkDelete);

            // add the row to the table
            tbody.appendChild(row);
        }
    }

    //add the table
    table.appendChild(tbody);
    document.body.appendChild(table);
}

function DeleteFromFavorites(index)
{
    deleteFavorite(index);
    location.href = location.href;
}

function AddToFavorites(title, url, doc)
{
    if (url.href) 
    {
        url = url.href;
    }
    addFavorite(title, url);
    if(doc)
        doc.location.href = doc.location.href;
}

function getFavoritesCount()
{
    var count = getCookie("favcount")
    if(count==null)
    {
        count = 0;
    }
    return parseInt(count);
}

function getFavoriteTitle(index)
{
    return getCookie("fav" + index  + "title");
}

function getFavoriteURL(index)
{
    return getCookie("fav" + index  + "url");
}

function addFavorite(title, href)
{
    if(!favoriteExists(href))
    {
        var dateExpires = new Date();
        var count = getFavoritesCount() + 1;

        //set the expirydate for the cookie
        dateExpires.setDate(dateExpires.getDate() + 3650)

        //increment count
        setCookie("favcount", count, dateExpires);

        //add the favorite
        setCookie("fav" + count + "title", title, dateExpires);
        setCookie("fav" + count + "url", href, dateExpires);
    }
}

function favoriteExists(href)
{
    var exists = false;
    var count = getFavoritesCount();
    for (var index = 0; index < count; index++)
    {
        var url = getFavoriteURL(index + 1);
        if(url.toLowerCase()==href.toLowerCase())
        {
            exists = true;
            break;
        }
    }
    return exists;
}

function deleteFavorite(index)
{
    var count = getFavoritesCount();
    var dateExpires = new Date();

    if(index>=1 && index<=count)
    {
        //set the expirydate for the cookie
        dateExpires.setDate(dateExpires.getDate() + 3650)

        //move all items down the lost
        for (var i = index+1; i <= count; i++)
        {
            setCookie("fav" + (i - 1) + "title", getCookie("fav" + i + "title"), dateExpires);
            setCookie("fav" + (i - 1) + "url", getCookie("fav" + i + "url"), dateExpires);
        }

        //delete the last item
        deleteCookie("fav" + count + "title")
        deleteCookie("fav" + count + "url")

        //update the count
        setCookie("favcount", count - 1, dateExpires);
    }
}

function favoritesMessageHandler(event) {
    var message = getMessage(event.data);
    
	switch (message.messageType) 
	{
		case "addtofavorites":
			var separator = message.messageData.indexOf("|");
			var pageLocation = message.messageData.substring(0, separator);
			var pageTitle = message.messageData.substring(separator + 1);
			AddToFavorites(pageTitle, pageLocation, document);
	}
}  