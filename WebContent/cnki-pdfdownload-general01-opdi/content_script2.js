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
//cs 里的totalInfoAndCurrentDownloadInfo变量似乎可以取消
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
		totalInfoAndCurrentDownloadInfo.totalItemsAmount=Number($(tagTotalItemsAmount).text());
		// totalCatchjobInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($(tagTotalItemsAmount));
		totalInfoAndCurrentDownloadInfo.itemsAmountPerPage=Number($(tagItemsAmountPerPage).val());
		var msg = {};
		msg.type = "totalInfo";
		msg.data=totalInfoAndCurrentDownloadInfo;
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
function  checkWhileAndNextPageIfNotWaitThenNext(){
	if (haveNextPage()){
		nextPage();
	}else{
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
		//download item
//		tSendMessage("currentItemInfo-waitdownload",totalInfoAndCurrentDownloadInfo2);
		tSendMessage("currentItemInfo-waitdownload",totalInfoAndCurrentDownloadInfo2);
		click($(trOne).find(images).parent()[0]);
		//下载完，在++，下载下一条，在监听器中实现
		
//		var t=setTimeout(tSendMessage("currentItemInfo-waitdownload",totalInfoAndCurrentDownloadInfo2),2000);
		
	}else{//没有下载的情况
		tSendMessage("currentItemInfo-downloadNextItem",totalInfoAndCurrentDownloadInfo2);
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

function removeHTMLTag(str) {
	str = str	; // 去除HTML tag
	str = str.replace(/[ | ]*\n/g, '\n'); // 去除行尾空白
	// str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
	str = str.replace(/ /ig, '');// 去掉
	return str;
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