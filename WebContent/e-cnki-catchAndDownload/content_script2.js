/*20200606 1.修改下载cnki页面，单独打开每个item，下载pdf文件，记录是否成功。
*  2.尽量修改成通用程序，即所有网站下载都适用这个一个程序。
*  所以首先要区分下载类型：
*  是否逐项下载or通过整页jasn数据下载（如存包柜）；逐项下载是否需要打开新页面如（读秀下载）
*  3.这次0606暂时修改cnki页面，逐项下载，单独打开新页面下载pdf文件。
*  4.备忘 逐项下载的关键程序：catchAndDownloadOneItem
*  /
//var bAllowNextPage = true;
var bAllowDl = true;
var waitingDownload=false;
var intInterval;
var currentDownloadInfo={};
var needDownloadList=[];
// html&css 相关变量 与页面相关信息

/*与页面相关变量*/
//page css 当前每页显示多少项
var currentPageCount=Number($("#id_grid_display_num a font").text()!=""?$("#id_grid_display_num a font").text():$(window.frames["iframeResult"].document).find("#id_grid_display_num a font").text());
//page css 当前页实际有多少项
var currentPageRowAccount=$("table.GridTableContent tr").length>0?$("table.GridTableContent tr").length:$(window.frames["iframeResult"].document).find("table.GridTableContent tr").length-1;
//下载内容的tr的集合，jquery对象，包括标题	
var trs=$("table.GridTableContent tr").length>0?$("table.GridTableContent tr"):$(window.frames["iframeResult"].document).find("table.GridTableContent tr");



var tagTotalItemsAmount="#queryCount";
var tagItemsAmountPerPage="#srPageCount";
var tagCurrentPageIndex="#resultcontent table:eq(0) li.active";
// $("#resultcontent table:eq(0) li.active").text()
//cs 里的totalInfoAndCurrentDownloadInfo变量似乎可以取消

// 新建页面需要变量
var $divIframe;
var $iframeEmbed;
var totalInfoAndCurrentDownloadInfo = {
		totalItemsAmount : 0,
		totalPageAmount : 0,
		itemsAmountPerPage:0,
		currentDPageIndex : 0, // 1开始
		currentDItemIndexInTotal : 0,// 1开始
		currentDItemIndexInPage : 0,// 1开始
	};
function catchStop(request, sender, sendRequest) {
	if (request.type == "wolf-catch-stop") {
		stopCatchAndDl();
	} else if (request.type == "msg-catch&downloadThisItem-withTotalInfo") {
		// 取得itemIndex，catch一条并下载，
		var totalInfoAndCurrentDownloadInfo2 = {
			};
		totalInfoAndCurrentDownloadInfo2=request.data;
		checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo2);
	} else if (request.type == "firstStart") {
		// 获取总体信息，传到bg存储，以这些信息为循环信息
		var totalInfoAndCurrentDownloadInfo={
				totalItemsAmount : 0,
				totalPagesAmount : 0 ,
				itemsAmountPerPage:0,
				currentDPageIndex:1,  // 1开始
				currentDItemIndexInTotal:1,// 1开始
				currentDItemIndexInPage:0,//1开始
		};
		/*与页面相关变量*/
//		var currentPageCount=Number($("#id_grid_display_num a font").text()!=""?$("#id_grid_display_num a font").text():$(window.frames["iframeResult"].document).find("#id_grid_display_num a font").text());
//		var currentPageRowAccount=$("table.GridTableContent tr").length>0?$("table.GridTableContent tr").length:$(window.frames["iframeResult"].document).find("table.GridTableContent tr").length-1;
	//下载内容的tr的集合，jquery对象，包括标题	
		
		var trs=$("table.GridTableContent tr").length>0?$("table.GridTableContent tr"):$(window.frames["iframeResult"].document).find("table.GridTableContent tr");
		
		

		$("div.pagerTitleCell").eq(0).text()
		totalInfoAndCurrentDownloadInfo.totalItemsAmount=Number($(tagTotalItemsAmount).text());
		
//怎么自动化的取到总数量，和每页数量？和抓取内容循环
		
		// totalCatchjobInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($(tagTotalItemsAmount));
		totalInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($("table.GridTableContent tr").length>0?$("table.GridTableContent tr").length:$(window.frames["iframeResult"].document).find("table.GridTableContent tr").length-1);
		var msg = {};
		msg.type = "totalInfo";
		msg.data=totalInfoAndCurrentDownloadInfo;
		creatIframeAndLoadFunc();
		$("body").append($divIframe);
		chrome.runtime.sendMessage(msg);
	}else{
		return;
	}
};
chrome.runtime.onMessage.addListener(catchStop);
//****************把totalInfoAndCurrentDownloadInfo改成全局变量?需要仔细检查
function checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo2){
// check current page index ==totalInfoAndCurrentDownloadInfo.pageIndex
//	totalInfoAndCurrentDownloadInfo=totalInfoAndCurrentDownloadInfo2;
	totalInfoAndCurrentDownloadInfo2.currentDPageIndex= tCaltulatePageIndex(totalInfoAndCurrentDownloadInfo2.currentDItemIndexInTotal,totalInfoAndCurrentDownloadInfo2.itemsAmountPerPage);
	//
	if(Number($(tagCurrentPageIndex).text())==totalInfoAndCurrentDownloadInfo2.currentDPageIndex){
		catchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo2)
	}else{
//		通知bg 记录，并翻页
		var msgDownload = {};
		tSendMessage("askCS-downloadSameItem-afterAWhile",totalInfoAndCurrentDownloadInfo2);
		tNextPage();
		// 放到bg 过一段时间等cs翻完页在，bg 向cs发消息继续抓取
		// 考虑翻页不成功情况？通知bg？记录如较长时间没有到下个item，通知cs重新下载，并记录问题;
	}	
}
function catchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo2){
	// 计算item在当页第几项，应该和计算第几页currentDPageIndex放到一起，是否放到bg中？
	//计数从1开始，页面元素索引从0开始
	var currentDItemIndexInPage=(totalInfoAndCurrentDownloadInfo2.currentDItemIndexInTotal-1)%totalInfoAndCurrentDownloadInfo2.itemsAmountPerPage;
//	var currentDItemIndexInPage=totalInfoAndCurrentDownloadInfo2.currentDPageIndex
	// 找到这项并catch
	// 下面与css相关
	var trOne=$("table[type-id='1'] .resultRow").eq(currentDItemIndexInPage)[0];
	var itemTrInfo={};
	title1=$(trOne).find("td").eq(1).children("a").eq(0)[0].innerText;
	title2=$(trOne).find("td").eq(1).children("a").length>1?$(trOne).find("td").eq(1).children("a").eq(1)[0].innerText:"";
	
	itemTrInfo.text=title1+"|"+title2+"|"
		+getFormatedAndAuthorAndBookinfo($(".resultRow").eq(currentDItemIndexInPage).find("td").eq(1).find("div"))
		+";\n";// 加；号和换行
//	totalNo=(row.pageNo-1)*currentPageCount+Number(row.no)+1;
//	data.pageDispalyText +=Number(totalNo)+"."+row.text;
//	msgItemInfo.type = "current-download-item-info-waitdownload";
	/*itemTrInfo.text="currentDPageIndex:"+totalInfoAndCurrentDownloadInfo2.currentDPageIndex+";currentDItemIndexInTotal:"+totalInfoAndCurrentDownloadInfo2.currentDItemIndexInTotal
					+";currentDItemIndexInPage:"+currentDItemIndexInPage+itemTrInfo.text;*/
	itemTrInfo.text="p:"+totalInfoAndCurrentDownloadInfo2.currentDPageIndex
	+";n:"+totalInfoAndCurrentDownloadInfo2.currentDItemIndexInTotal
	+";i:"+currentDItemIndexInPage+itemTrInfo.text;
	totalInfoAndCurrentDownloadInfo2.itemTrInfo = itemTrInfo.text;
//	msgItemInfo.data=totalInfoAndCurrentDownloadInfo;
//	chrome.runtime.sendMessage(msgItemInfo);
	var images=$("img[src='/public/portal/image/download.gif']");
	if ($(trOne).find(images).length>0){
		//download item   需要进一步在学校调试和修改   msg 接收端还有没有写
		tSendMessage("currentItemInfo-waitdownload",totalInfoAndCurrentDownloadInfo2);
//		click($(trOne).find(images).parent()[0]);
	}else{
		tSendMessage("currentItemInfo-downloadNextItem",totalInfoAndCurrentDownloadInfo2);
	}
}
/*
 * 新建iframe打开一个新的item的url，在iframe内实现下载。20200606
 */
function creatIframeAndLoadFunc(){
	$divIframe = $( "<div id='divIframe' style='position:absolute;top:900px;left:100px;overflow: scroll; border: 1px solid;'></div>" );
	$iframeEmbed = $( "<iframe id='embedIframe' border='2px' height='1000px' width='1000px' display='inline'></iframe>" );
	$iframeEmbed.attr("src","http://book.duxiu.com/bookDetail.jsp?dxNumber=000001024326&d=6AC52643FD37FE591EF8EFCF8745F095&fenlei=070306091501")
    $divIframe.append($iframeEmbed);
	$("body").append($divIframe);
	$iframeEmbed.load(function(){
		var itemTrInfo={};
		var t1="";
		t1=$iframeEmbed.contents().find('.card_text dl dt').text().trim();
		/*var t2=$iframeEmbed.contents().find('.card_text dl dd').eq(0).text().trim();
		var t3=$iframeEmbed.contents().find('.card_text dl dd').eq(1).text().trim();
		var t4=$iframeEmbed.contents().find('.card_text dl dd').eq(2).text().trim();*/
		if(t1.length>0){
			itemTrInfo.text=t1
			$iframeEmbed.contents().find('.card_text dl dd:not(.bnt_content)').each(function(){
				itemTrInfo.text+="|"+(removeHTMLTag($(this).text().trim()).length>0?removeHTMLTag($(this).text().trim()):"");
			})
			itemTrInfo.text+=";\n";
			var cPicName=t1;
			totalInfoAndCurrentDownloadInfo.itemTrInfo = itemTrInfo.text;
			totalInfoAndCurrentDownloadInfo.cPicName = cPicName;
			tSendMessage("currentItemInfo-downloadNextItem",totalInfoAndCurrentDownloadInfo);
		}else{
			//没取到标题信息，很大可能是出现了验证码
			tSendMsgToPopup("popup-displayThisInfo",{info:"没取到标题信息，很大可能是出现了验证码"});
		}
	});
}
function tSendMessage(msgType,data){
	var msg = {};
	msg.type=msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
}
function tCaltulatePageIndex(itemIndex,amountPerPage){
	if (amountPerPage!=0){
		return Math.ceil(itemIndex/amountPerPage);
	}else{
		return 0;
	}
}

function removeHTMLTag(str) {
	str = str	; // 去除HTML tag
	str = str.replace(/[ | ]*\n/g, '\n'); // 去除行尾空白
	// str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
	str = str.replace(/ /ig, '');// 去掉
	return str;
}
function clickDownloadYesOrWait(){
	// 需要有暂停
	if($(".xubox_yes,.xubox_botton2").text()!="确定下载"){
		setTimeout("clickDownloadYesOrWait()", 2000);
	}else{
		click($(".xubox_yes,.xubox_botton2")[0])
		return;
	}
}

function getFormatedAndAuthorAndBookinfo(dObject){
	divObject=$(dObject);
// var title=divObject.find("a").eq(0)[0].innerText;
	var authors="";
	authors=divObject.find("a").eq(0)[0].innerText+"、"+divObject.find("a").eq(1)[0].innerText+"、"+divObject.find("a").eq(2)[0].innerText
	var authorsAndBookinfoText=divObject[0].innerText;
	if(authorsAndBookinfoText.indexOf("《")>0){// 中文期刊
		var bookInfoText=authorsAndBookinfoText.substr(authorsAndBookinfoText.indexOf("《"),authorsAndBookinfoText.length);
	}else{// 英文期刊 如下例
		var bookInfoText=authorsAndBookinfoText.substr(divObject.find("i").eq(0)[0].innerText,authorsAndBookinfoText.length);
	}
	return authors+"|"+bookInfoText;
}
function download(currentDownloadPageIndex){
// currentDownloadInfo2 {pageNo,totalNo,pageIndex}
// 初步想法：将下载的总信息放在 bg中，因为cs每次激活都会从新执行，以总信息作为循环依据，并修改成单项下载
	var currentDownloadInfo2={}
	currentDownloadInfo2.pageNo=needDownloadList[currentDownloadPageIndex].pageNo;
	currentDownloadInfo2.totalNo=needDownloadList[currentDownloadPageIndex].totalNo;
	currentDownloadInfo2.title=needDownloadList[currentDownloadPageIndex].title;
	currentDownloadInfo2.pageIndex=currentDownloadPageIndex;
	currentDownloadPageNo=currentDownloadInfo2.pageNo;
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
// 问题处

function tNextPage() {
//	if ( bAllowNextPage == true) {
		click($("#resultcontent").find("table").eq(0).find("li").last().prev().find("a")[0]);
//	} 
}
/*
function getCurrentPageData(){
	if(bAllowNextPage){	
		var msg = {};
				msg.type = "wolf-catch-pagedata";
				// 当前在第几页
				var currentPageNo =$("#resultcontent").find("table").eq(0).find("li.active").text()
				var data = {
					records : [],
					pageDispalyText : ''
				};
		// 容错处理
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
	var match = url.match(regex);
	if(typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}

function finishLoad(){
	return !($(".xubox_msg,.xubox_text").text()=="正在检索中...");
}
function checkForValidUrl(tabId, changeInfo, tab) {
	if(toolGetDomainFromUrl(tab.url).toLowerCase()=="www.cnblogs.com"){
		chrome.pageAction.show(tabId);
	}
};	

function haveNextPage(){
	// needchange
	if($("#resultcontent").find("table").eq(0).find("li").last().find("a").hasClass("next")){
		return true;
	}else{
		return false;
	}
};
function  checkGetDataDlAndNextPage(){
	if (finishLoad()){
		getCurrentPageData();
		
		if(!haveNextPage()){
			// 没有下页，但是可能仍在下载，只停止抓取，所以不停止下载，让消息进程去停止下载
			stopCatch();
		}else if(bAllowNextPage){
			// 可以下页的情况
			nextPage();
		}else{
			// 有下一页不容许，下页的请，可能是在下载，只停止抓取，所以不停止下载，让消息进程去停止下载
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
// window.stop();
	window.clearInterval(intInterval);
}*/