﻿//var bAllowNextPage = true;
var bAllowDl = true;
var waitingDownload=false;
var intInterval;
var currentDownloadInfo={};
var needDownloadList=[];
// html&css 相关变量 与页面相关信息
var tagTotalItemsAmount="#queryCount";
var tagItemsAmountPerPage="#srPageCount";
var tagCurrentPageIndex="#resultcontent table:eq(0) li.active";
// $("#resultcontent table:eq(0) li.active").text()
var totalInfoAndCurrentDownloadInfo = {
		totalItemsAmount : 0,
		totalPageAmount : 0,
		currentDPageIndex : 0, // 1开始
		currentDItemIndexInTotal : 0,// 1开始
		currentDItemIndexInPage : 0,// 1开始
	};

function catchStop(request, sender, sendRequest) {
// 
	if (request.type == "wolf-catch-stop") {
		stopCatchAndDl();
	} else if (request.type == "msg-catch&downloadThisItem-withTotalInfo") {
// 取得itemIndex，catch一条并下载，
		var totalInfoAndCurrentDownloadInfo = {
				totalItemsAmount : 0,
				totalPageAmount : 0,
				currentDPageIndex : 0, // 1开始
				currentDItemIndexInTotal : 0,// 1开始
				currentDItemIndexInPage : 0,// 1开始
			};
		totalInfoAndCurrentDownloadInfo=request.data;
		checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo);
	} else if (request.type == "wolf-catch-start") {
		// 获取总体信息，传到bg存储，以这些信息为循环信息
		var totalInfoAndCurrentDownloadInfo={
				totalItemsAmount : 0,
				totalPagesAmount : 0 ,
				itemsAmountPerPage:0,
				currentDPageIndex:1,  // 1开始
				currentDItemIndexInTotal:1,// 1开始
// currentDItemIndexInPage:0,//1开始
		};
		totalInfoAndCurrentDownloadInfo.totalItemsAmount=Number($(tagTotalItemsAmount).text());
		// totalCatchjobInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($(tagTotalItemsAmount));
		totalInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($(tagItemsAmountPerPage).val());
		var msg = {};
		msg.type = "msg-totalInfo";
		msg.data=totalInfoAndCurrentDownloadInfo;
		chrome.runtime.sendMessage(msg);
// bAllowNextPage = true;
// intInterval=window.setInterval("checkGetDataDlAndNextPage()",2000);
	} else if (request.type == "download-nextPageIndex") {
		/*if(request.pageIndex<needDownloadList.length&&bAllowDl){
			download(request.pageIndex);
		}else{// wenti
			if(!request.pageIndex<needDownloadList.length){
				// 已经下载完本页，需求需要进入下一页。如果还有下页，进入抓取数据并下载。
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
				// if (request.pageIndex<needDownloadList.length&&!bAllowDl)
				// 还没下载完就暂停下载的情况
				stopCatchAndDl();
			}
		}*/
	}else{
		return;
	}
};
chrome.runtime.onMessage.addListener(catchStop);
//****************难道需要把totalInfoAndCurrentDownloadInfo改成全局变量
function checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo){
// check current page index ==totalInfoAndCurrentDownloadInfo.pageIndex
	totalInfoAndCurrentDownloadInfo.currentDPageIndex= tCaltulatePageIndex(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal,totalInfoAndCurrentDownloadInfo.itemsAmountPerPage);
	//
	if(Number($(tagCurrentPageIndex).text())==totalInfoAndCurrentDownloadInfo.currentDPageIndex){
		window.clearInterval(intInterval);
		catchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo)
	}else{
//		通知bg 记录，并翻页
		var msgDownload = {};
//		msgDownload.type = "askCS-downloadSameItem-afterAWhile";
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
//		msgDownload.totalInfoAndCurrentDownloadInfo=totalInfoAndCurrentDownloadInfo;
//		chrome.runtime.sendMessage(msgDownload);
		tSendMessage("askCS-downloadSameItem-afterAWhile",totalInfoAndCurrentDownloadInfo);
//		intInterval=window.setInterval("checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo)",2000);
		tNextPage();
//		checkCPageThenCatchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo);
// 放到bg 下载后执行，下-页 间隔调用本过程
// intInterval=window.setInterval("catchAndDownloadOneItem()",2000);
		// 考虑翻页不成功情况？通知bg？记录如较长时间没有到下个item，通知cs重新下载，并记录问题;
	}	
}
function catchAndDownloadOneItem(totalInfoAndCurrentDownloadInfo){
	// 计算item在当页第几项
	var currentDItemIndexInPage=totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal%totalInfoAndCurrentDownloadInfo.itemsAmountPerPage;
	// 找到这项并catch
	// i
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
	var msgItemInfo = {};
//	msgItemInfo.type = "current-download-item-info-waitdownload";
	
	totalInfoAndCurrentDownloadInfo.itemTrInfo = itemTrInfo.text;
//	msgItemInfo.data=totalInfoAndCurrentDownloadInfo;
//	chrome.runtime.sendMessage(msgItemInfo);
	var images=$("img[src='/public/portal/image/download.gif']");
	if ($(trOne).find(images).length>0){
		//download item   需要进一步在学校调试和修改   msg 接收端还有没有写
		tSendMessage("currentItemInfo-waitdownload",totalInfoAndCurrentDownloadInfo);
//		click($(trOne).find(images).parent()[0]);
	}else{
		tSendMessage("currentItemInfo-downloadNextItem",totalInfoAndCurrentDownloadInfo);
	}
	
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
function tNextPage() {
	if(tHaveNextPage()){
		click($("#resultcontent").find("table").eq(0).find("li").last().prev().find("a")[0]);
	}else{
		window.clearInterval(intInterval);
	}
}
function tHaveNextPage(){
	// needchange
	if($("#resultcontent").find("table").eq(0).find("li").last().find("a").hasClass("next")){
		return true;
	}else{
		return false;
	}
};
function tStopCatchAndDl(){
	window.clearInterval(intInterval);
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
//will download
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
	// 考虑到最后一页的情况 增加 $(".resultRow").length<currentPageCount?
	// $(".resultRow").length:currentPageCount
	var currentPageRowAccount=$("table[type-id='1']").find(".resultRow").length<currentPageCount?$("table[type-id='1']").find(".resultRow").length:currentPageCount;
	for(var i=0;i<currentPageRowAccount;i++){
		var row = {};
		row.pageNo = currentPageNo;
		row.no=i;
		// 第一tab，正文
		trOne=$("table[type-id='1']").find(".resultRow").eq(i)[0];
		title1=$(trOne).find("td").eq(1).children("a").eq(0)[0].innerText;
		title2=$(trOne).find("td").eq(1).children("a").length>1?$(trOne).find("td").eq(1).children("a").eq(1)[0].innerText:"";
		row.text=title1+"|"+title2+"|"
					+getFormatedAndAuthorAndBookinfo($(".resultRow").eq(i).find("td").eq(1).find("div"))
					+";\n";// 加；号和换行
		data.records.push(row);
		totalNo=(row.pageNo-1)*currentPageCount+Number(row.no)+1;
// data.pageDispalyText +=row.pageNo+"."+row.no+"."+(totalNo+1)+"."+row.text;
		data.pageDispalyText +=Number(totalNo)+"."+row.text;
		var images=$("img[src='/public/portal/image/download.gif']");
		if ($(trOne).find(images).length>0){
// click($(trOne).find(images).parent()[0]);
			// 保存待下载信息
			var currentDownloadInfo={};
			// 保存下载项的 野内编号，总编号，题目，
			currentDownloadInfo.pageNo=i;
			currentDownloadInfo.totalNo=totalNo;
			var as=$("a");
			currentDownloadInfo.title=$(trOne).find(as).eq(0).text()
			needDownloadList.push(currentDownloadInfo);
			waitingDownload=true;
// clickDownloadYesOrWait();
		}
	}
	var currentDownloadPageIndex=-1;
	if(waitingDownload){
		stopCatch();
		bAllowDl=true;
		currentDownloadPageIndex=0;
		download(currentDownloadPageIndex);
	}
/*
 * pageNo pageIndex totalNo 0 1 2 * 0 13 3 4 * 1 15
 */
	return data;
};
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
	var regex = /.*\:\/\/([^\/]*).*/;
	var match = url.match(regex);
	if(typeof match != "undefined" && null != match)
		host = match[1];
	return host;
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
function finishLoad(){
	return !($(".xubox_msg,.xubox_text").text()=="正在检索中...");
}
function nextPage() {
	if ( bAllowNextPage == true) {
		click($("#resultcontent").find("table").eq(0).find("li").last().prev().find("a")[0]);
	} 
}

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
}