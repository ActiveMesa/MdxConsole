var highlightColors = null;

function documentElement(id){
    return document.getElementById(id);
}

function btnSearch_onclick()
{
    // hide search div
    documentElement("divSearch").style.display = "none";

    // show progress div
    documentElement("divSearching").style.display = "";

    // do search
    var bResult = DoSearch();

    // hide progress div
    documentElement("divSearching").style.display = "none";

    // hide search div
    documentElement("divSearch").style.display = "";

    // show results
    if (bResult == true)
    {
        // show resulta div
        documentElement("divResults").style.display = "";
    }
}

function btnNewSearch_onclick()
{
    document.execCommand("refresh");
}

function DoSearch()
{
    // get search string
    var strSearchString = new String(documentElement("txtSearch").value);
    if (strSearchString.length == 0)
    {
        return false;
    }

    // make lowercase for easy comparison later on
    strSearchString = strSearchString.toLowerCase();

    // tokenise
    var aTokens = strSearchString.split(" ");

    // build keywords array & query string
    var strQuery = new String();
    var bLastOperator = true;
    var bLastKeyword = false;
    var nKeyword = 0;
    var aKeywords = new Array();
    for (var nToken = 0; nToken < aTokens.length; nToken++)
    {
        if (aTokens[nToken].length > 0)
        {
            var strTok = new String(aTokens[nToken]);

            // strip out any delimiters & whitespace
            strTok = strTok.replace(new RegExp("\'", "ig"), "");
            strTok = strTok.replace(new RegExp("\"", "ig"), "");
            strTok = strTok.replace(new RegExp(",", "ig"), "");

            // add to array
            if ((strTok == "or") || (strTok == "and"))
            {
                // only add it if not just had an operator
                if (bLastOperator == false)
                {
                    // add to the query string
                    if (strTok == "or")
                    {
                        strQuery += " || ";
                    }
                    else if (strTok == "and")
                    {
                        strQuery += " && ";
                    }
                    bLastOperator = true;
                    bLastKeyword = false;
                }
            }
            else
            {
                // we just had a keyword ?
                if (bLastKeyword)
                {
                    // add default OR operator
                    strQuery += " || ";
                }

                // add to query string
                //strQuery += "(strKey.indexOf(";
                //strQuery += "\"";

                strQuery += ("(strKey.indexOf(\"" + strTok + "\") >= 0)");
                bLastOperator = false;
                bLastKeyword = true;

                // add to keywords array
                aKeywords[nKeyword] = strTok;
                nKeyword++;
            }
        }
    }
    if (aKeywords.length == 0)
    {
        return false;
    }

    // load files & stopwords arrays
    var aIndexFiles = new Array();
    var aIndexFileTitles = new Array();
    var aIndexStopWords = new Array();
    BuildIndexArray(aIndexFiles, aIndexFileTitles, aIndexStopWords);

    // build list of files containing keywords
    var aFiles = new Array();
    var aFileTitles = new Array();
    var aFileKeywords = new Array();
    LoadFilesWithKeywords(aIndexFiles, aIndexFileTitles, aIndexStopWords, aKeywords, aFiles, aFileTitles, aFileKeywords);

    // build results list
    var aResults = BuildResultsArray(strQuery, aFileKeywords);

    // write results to document
    OutputResults(aResults, aFiles, aFileTitles);

    // return success
    return true;
}

function LoadFilesWithKeywords(aIndexFiles, aIndexFileTitles, aIndexStopWords, aKeywords, aFiles, aFileTitles, aFileKeywords)
{
    // build lookup arrays
    for (var nStopWord = 0; nStopWord < aKeywords.length; nStopWord++)
    {
        // find stop word in index
        if (aIndexStopWords["_" + aKeywords[nStopWord]] != undefined)
        {
            // get indices of files containing word
            var strIndices = new String(aIndexStopWords["_" + aKeywords[nStopWord]]);

            // tokenize indices
            var aIndices = strIndices.split(",");
            for (var nIndex = 0; nIndex < aIndices.length; nIndex++)
            {
                // add to array
                var nFileIndex = new Number(aIndices[nIndex]);
                if (aFileKeywords[nFileIndex] == undefined)
                {
                    aFileKeywords[nFileIndex] = aKeywords[nStopWord];
                }
                else
                {
                    aFileKeywords[nFileIndex] += ("," + aKeywords[nStopWord]);
                }
            }
        }
    }

    // get filenames for indices
    for (var nFile = 0; nFile < aFileKeywords.length; nFile++)
    {
        if (aFileKeywords[nFile] != undefined)
        {
            // find stop word in index
            if (aIndexFiles[nFile] != undefined)
            {
                aFiles[nFile] = aIndexFiles[nFile];
                aFileTitles[nFile] = aIndexFileTitles[nFile];
            }
        }
    }
}

function BuildResultsArray(strQuery, aFileKeywords)
{
    var aResults = new Array();

    for (var nIndex = 0; nIndex < aFileKeywords.length; nIndex++)
    {
        if (aFileKeywords[nIndex] != undefined)
        {
            var strKey = aFileKeywords[nIndex];
            if (eval(strQuery) == true)
            {
                aResults[nIndex] = nIndex;
            }
        }
    }
    return aResults;
}

function OutputResults(aResults, aFiles, aFileTitles)
{
    // init table html
    var strTable = "<hr style=\"height: 1px; border: 0; padding: 0; margin: 0 0 3px 0;\"><p class=\"searchtitle\">" + getPhrase("Search_SearchResults") + "</p>";
    strTable += "<table class=\"searchresults\">";
    var nResult = 0;

    // add results to table
    var nTotal = 0;
    for (var nResult = 0; nResult < aResults.length; nResult++)
    {
        if (aResults[nResult] != undefined)
        {
            if(nTotal == 0)
                className = "toprow";
            else if (nTotal == aResults.length)
                className = "bottomrow";
            else
                className = "innerrow";

            // add row text
            strTable += "<tr><td style=\"margin-right: 2px;\" class=\"" + className + "\">" + (nTotal+1) + ":</td><td class=\"" + className + "\"><a target='webcontent' href=\"" + aFiles[aResults[nResult]] + "\" onclick='javascript:showSearchResult(\"" + aFiles[aResults[nResult]] + "\"); return false;'>" + aFileTitles[aResults[nResult]] + "</a></td></tr>";

            // incr total
            nTotal++;
        }
    }

    // add footer
    strTable += "</table><p>" + nTotal + " " + getPhrase("Search_ResultCount") + "</p>";

    // set it
    documentElement("divResults").innerHTML = strTable;
}

function showSearchResult(hRef)
{
    var highlight = document.getElementById("chkHighlightInResults");

    if(!highlight.checked)
    {
        var content = contentFrame();
        content.location = hRef;
    }
    else
	{
		var content = contentFrame();
        content.location = hRef;
		
		setTimeout("highlightContentFrame();",500);
	}
}

function highlightContentFrame()
{
    keywords = getKeywordArray();
    var doc = contentDocument()
    for(var x=0;x<keywords.length;x++)
    {
		if (isPostMessageEnabled())
		{
			var content = contentFrame();
			content.postMessage("quicksearch|" + keywords[x],"*");
		}
		else
		{
        HighlightText(doc,keywords[x],"black",getHighlightColor(x),(x==0));
    }
}
}

function getHighlightColor(index)
{
    if (!highlightColors)
    {
        highlightColors = new Array("#ffff66","#ff66ff","#99ff99","#ff9999","#D0A1FF","#C7C7FF","#FFA1FF","#A1FFA1","#FFFFC7","#FFA1A1","#E3FFC7","#A1A1FF","#C7A37F","#A3C77F","#C7C763","#7FC7C7");
    }
    if (index > highlightColors.length)
    {
        index = (index % highlightColors);
    }
    return highlightColors[index];
}

function getKeywordArray()
{
    // get search string
    var strSearchString = new String(documentElement("txtSearch").value);
    if (strSearchString.length == 0)
    {
        return false;
    }

    // make lowercase for easy comparison later on
    strSearchString = strSearchString.toLowerCase();

    // tokenise
    var aTokens = strSearchString.split(" ");
    var nKeyword = 0;

    // build keywords array
    var aKeywords = new Array();
    for (var nToken = 0; nToken < aTokens.length; nToken++)
    {
        if (aTokens[nToken].length > 0)
        {
            var strTok = new String(aTokens[nToken]);

            // strip out any delimiters & whitespace
            strTok = strTok.replace(new RegExp("\'", "ig"), "");
            strTok = strTok.replace(new RegExp("\"", "ig"), "");
            strTok = strTok.replace(new RegExp(",", "ig"), "");

            // add to array
            if (!((strTok == "or") || (strTok == "and")))
            {
                // add to keywords array
                aKeywords[nKeyword] = strTok;
                nKeyword++;
            }
        }
    }

    return aKeywords;
}