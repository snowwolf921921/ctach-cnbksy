var bAllowNextPage = true;
var bAllowDl = true;
var waitingDownload=false;
var intInterval;
var currentDownloadInfo={};
var needDownloadList=[];
function haveNextPage(){
	//needchange
	if($("#resultcontent").find("table").eq(0).find("li").last().find("a").hasClass("next")){
		return true;
	}else{
		return false;
	}
};
function finishLoad(){
	return !($(".xubox_msg,.xubox_text").text()=="正在检索中...");
}
function nextPage() {
	if ( bAllowNextPage == true) {
		click($("#resultcontent").find("table").eq(0).find("li").last().prev().find("a")[0]);
	} 
}
/*function  checkAndNextPageIfNotWaitThenNext(){
	if (haveNextPage()){
		nextPage();
	}else{
		setTimeout(checkAndNextPageIfNotWaitThenNext(), 4000);
	}
}
function  checkWhileAndNextPageIfNotWaitThenNext(){
	if (haveNextPage()){
		nextPage();
	}else{
		setTimeout(checkAndNextPageIfNotWaitThenNext(), 4000);
	}
}*/
function  checkGetDataDlAndNextPage(){
	if (finishLoad()){
		getCurrentPageData();
		
		if(!haveNextPage()){
			//没有下页，但是可能仍在下载，只停止抓取，所以不停止下载，让消息进程去停止下载
			stopCatch();
		}else if(bAllowNextPage){
			//可以下页的情况
			nextPage();
		}else{
			//有下一页不容许，下页的请，可能是在下载，只停止抓取，所以不停止下载，让消息进程去停止下载
			stopCatch();
		}
	}
}

function stopCatch(){
	bAllowNextPage = false;
	window.clearInterval(intInterval);
}
function stopCatchAndDl(){
	bAllowNextPage = false;
	bAllowDl = false;
//	window.stop();
	window.clearInterval(intInterval);
}
function catchStop(request, sender, sendRequest) {
//	alert(2);
	if (request.type == "wolf-catch-stop") {
		stopCatchAndDl();
	} else if (request.type == "wolf-catch-start") {
		bAllowNextPage = true;
		//修改成 ajax方式
		intInterval=window.setInterval("checkGetDataDlAndNextPage()",2000);
	} else if (request.type == "download-nextPageIndex") {
//		alert(1);
		if(request.pageIndex<needDownloadList.length&&bAllowDl){
//			window.opener=null;window.close();
			download(request.pageIndex);
		}else{//wenti
			if(!request.pageIndex<needDownloadList.length){
				//已经下载完本页，需求需要进入下一页。如果还有下页，进入抓取数据并下载。
				bAllowNextPage = true;
				waitingDownload=false;
				if (bAllowNextPage&&haveNextPage()){
					bAllowDl = true;
					nextPage();
					intInterval=window.setInterval("checkGetDataDlAndNextPage()",2000);
				}else{
					stopCatchAndDl();
				}
			}else {
				//if (request.pageIndex<needDownloadList.length&&!bAllowDl) 还没下载完就暂停下载的情况
				stopCatchAndDl();
			}
			
		}
	}else{
		return;
	}
	
};
//test
/*chrome.runtime.onConnect.addListener(function(port) {  console.assert(port.name == "con1")}); 
var port = chrome.runtime.connect({name: "con1"});
port.onMessage.addListener(catchStop);*/
//testwan
chrome.runtime.onMessage.addListener(catchStop);
//chrome.tabs.onActivated.addListener(catchStop);
/*chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {   
	  stopTimer();   
	  checkByTabid(tabId);   
	}); */
function removeHTMLTag(str) {
	str = str	; //去除HTML tag
	str = str.replace(/[ | ]*\n/g, '\n'); //去除行尾空白
	//str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
	str = str.replace(/ /ig, '');//去掉 
	return str;
}
function clickDownloadYesOrWait(){
	//需要有暂停
	if($(".xubox_yes,.xubox_botton2").text()!="确定下载"){
		setTimeout("clickDownloadYesOrWait()", 2000);
	}else{
		click($(".xubox_yes,.xubox_botton2")[0])
		return;
	}
}
function getTableDataAndDl(currentPageNo){
	var rowEmpty=false
	data = {
			records : [],
			pageDispalyText : '',
			rowEmpty:false	
		};

	var jStop=0;
	var currentPageCount=Number($("#srPageCount").val());
	waitingDownload=false;
	needDownloadList=[];
	var totalNo=0;
	var title1="";
	var title2="";
	//考虑到最后一页的情况 增加 $(".resultRow").length<currentPageCount? $(".resultRow").length:currentPageCount
	var currentPageRowAccount=$("table[type-id='1']").find(".resultRow").length<currentPageCount?$("table[type-id='1']").find(".resultRow").length:currentPageCount;
	for(var i=0;i<currentPageRowAccount;i++){
		var row = {};
		row.pageNo = currentPageNo;
		row.no=i;
		//第一tab，正文
		trOne=$("table[type-id='1']").find(".resultRow").eq(i)[0];
		/*代码示例
		 * <div class="resultRow">
        <table class="fullwidth">
            <tbody><tr>
                <td class="srLineSelected">
                        <input type="checkbox" dataid="58fb46508fefac485987448ab9a9f4bb" laid="8">
                </td>
                <td>
                    <a href="/search/detail/58fb46508fefac485987448ab9a9f4bb/8/4833584" target="_blank">基于Pareto最优解的梯级泵站双目标优化调度</a><br>
                    <div class="fr" style="color:#505050;text-align: right;min-width: 350px;">
                        <a href="javascript:void(0);" onclick="searchAuthor('梁兴')">梁兴</a>
                        <a href="javascript:void(0);" onclick="searchAuthor('刘梅清')">刘梅清</a>
                        <a href="javascript:void(0);" onclick="searchAuthor('燕浩')">燕浩</a>
                              <!-- 现刊 -->
                        &nbsp;&nbsp;《武汉大学学报:工学版》&nbsp;&nbsp;
                        2015年 [48卷 2期，156-159,165页]
                    </div>
                </td>
            </tr>
        </tbody></table>
    </div>
		 */
		//title	
//		$(".resultRow").eq(5).find("td").eq(1).find("a").eq(0)[0].innerText
		//		多个作者，等 如 ：梁兴 刘梅清 燕浩   《武汉大学学报:工学版》   2015年 [48卷 2期，156-159,165页]
//		$(".resultRow").eq(5).find("td").eq(1).find("div")[0].innerText
//无格式		row.text=removeHTMLTag(trOne.innerText);
//加入|格式
		title1=$(trOne).find("td").eq(1).children("a").eq(0)[0].innerText;
		title2=$(trOne).find("td").eq(1).children("a").length>1?$(trOne).find("td").eq(1).children("a").eq(1)[0].innerText:"";
		row.text=title1+"|"+title2+"|"
					+getFormatedAndAuthorAndBookinfo($(".resultRow").eq(i).find("td").eq(1).find("div"))
					+";\n";//加；号和换行
		data.records.push(row);
		totalNo=(row.pageNo-1)*currentPageCount+Number(row.no)+1;
//		data.pageDispalyText +=row.pageNo+"."+row.no+"."+(totalNo+1)+"."+row.text;
		data.pageDispalyText +=Number(totalNo)+"."+row.text;
		var images=$("img[src='/public/portal/image/download.gif']");
		if ($(trOne).find(images).length>0){
//			click($(trOne).find(images).parent()[0]);
			//保存待下载信息
			var currentDownloadInfo={};
			//保存下载项的 野内编号，总编号，题目，
			currentDownloadInfo.pageNo=i;
			currentDownloadInfo.totalNo=totalNo;
			var as=$("a");
//			alert($(trOne).find(as).eq(0).text());
			currentDownloadInfo.title=$(trOne).find(as).eq(0).text()
			needDownloadList.push(currentDownloadInfo);
			waitingDownload=true;
//			clickDownloadYesOrWait();
		}
	}
	var currentDownloadPageIndex=-1;
	if(waitingDownload){
		stopCatch();
		bAllowDl=true;
//		currentDownloadPageNo=needDownloadList[0];
		currentDownloadPageIndex=0;
		download(currentDownloadPageIndex);
		
	}
/*	pageNo pageIndex  totalNo 
       0
       1
	   2 * 0          13
	   3
	   4 * 1          15*/

	
	return data;
};
function getFormatedAndAuthorAndBookinfo(dObject){
	divObject=$(dObject);
//	var title=divObject.find("a").eq(0)[0].innerText;
	var authors="";
	authors=divObject.find("a").eq(0)[0].innerText+"、"+divObject.find("a").eq(1)[0].innerText+"、"+divObject.find("a").eq(2)[0].innerText
	var authorsAndBookinfoText=divObject[0].innerText;
	if(authorsAndBookinfoText.indexOf("《")>0){//中文期刊
		var bookInfoText=authorsAndBookinfoText.substr(authorsAndBookinfoText.indexOf("《"),authorsAndBookinfoText.length);
	}else{//英文期刊 如下例
		/*<div class="fr" style="color:#505050;text-align: right;min-width: 350px;">
        <a href="javascript:void(0);" onclick="searchAuthor('')"></a>
        <a href="javascript:void(0);" onclick="searchAuthor('')"></a>
        <a href="javascript:void(0);" onclick="searchAuthor('')"></a>
              <!-- 中文报纸 或者 外文报纸 -->
        &nbsp;&nbsp;<a target="_blank" href="/literature/newspaper/2fd3595d726520b71f6296be0751145d">
        <i>The North-China Herald and Supreme Court &amp; Consular Gazette(1870-1941)</i>
        </a>&nbsp;&nbsp;
        1923年9月1日
        [042版]
        <br>
        </div>*/
		var bookInfoText=authorsAndBookinfoText.substr(divObject.find("i").eq(0)[0].innerText,authorsAndBookinfoText.length);

	}
	
//	$(".resultRow").eq(5).find("td").eq(1).find("div")[0].innerText.indexOf("《")
//	$(".resultRow").eq(5).find("td").eq(1).find("div")[0].innerText.substr(12,$(".resultRow").eq(5).find("td").eq(1).find("div")[0].innerText.length)
//	return title+"|"+authors+"|"+bookInfoText;
	return authors+"|"+bookInfoText;
}
function download(currentDownloadPageIndex){
//	currentDownloadInfo2 {pageNo,totalNo,pageIndex}
	var currentDownloadInfo2={}
	currentDownloadInfo2.pageNo=needDownloadList[currentDownloadPageIndex].pageNo;
	currentDownloadInfo2.totalNo=needDownloadList[currentDownloadPageIndex].totalNo;
	currentDownloadInfo2.title=needDownloadList[currentDownloadPageIndex].title;
	currentDownloadInfo2.pageIndex=currentDownloadPageIndex;
	currentDownloadPageNo=currentDownloadInfo2.pageNo;
	
//	var images=$("img[src='/static/images/download.gif']");
	var images=$("img[src='/public/portal/image/download.gif']");
	var trOneJ=$(".resultRow").eq(currentDownloadPageNo);
	if (trOneJ.find(images).length>0){
		click(trOneJ.find(images).parent()[0]);
	}
	
	var msgDownload = {};
	msgDownload.type = "current-download-item-info";
	msgDownload.currentDownloadInfo2=currentDownloadInfo2;
	chrome.runtime.sendMessage(msgDownload);
	
}
function click(el) {
	var e = document.createEvent('MouseEvent');
	e.initEvent('click', false, false);
	el.dispatchEvent(e);
};
//问题处
function getCurrentPageData(){
	if(bAllowNextPage){	
		var msg = {};
				msg.type = "wolf-catch-pagedata";
				var currentPageNo =$("#resultcontent").find("table").eq(0).find("li.active").text()
				var data = {
					records : [],
					pageDispalyText : ''
				};
		//容错处理
		var rowEmpty=false;
		data=getTableDataAndDl(currentPageNo);
		if(!data.rowEmpty){
			msg.data = data;
			chrome.runtime.sendMessage(msg);
		}
		if (waitingDownload){stopCatch()};
	}	
}
function getDomainFromUrl(url){
	var host = "null";
	if(typeof url == "undefined" || null == url)
		url = window.location.href;
	var regex = /.*\:\/\/([^\/]*).*/;
	var match = url.match(regex);
	if(typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
	if(getDomainFromUrl(tab.url).toLowerCase()=="www.cnblogs.com"){
		chrome.pageAction.show(tabId);
	}
};	

/*chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
//	suggest({filename: item.filename,
	  suggest({filename: "test.txt",
	           conflict_action: 'overwrite',
	           conflictAction: 'overwrite'});
	  // conflict_action was renamed to conflictAction in
	  // https://chromium.googlesource.com/chromium/src/+/f1d784d6938b8fe8e0d257e41b26341992c2552c
	  // which was first picked up in branch 1580.
	});

*/
//$(document).ready(getDataAndNextPage)
