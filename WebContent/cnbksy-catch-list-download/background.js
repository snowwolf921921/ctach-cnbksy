﻿//需要整理无用语句
var totalInfoAndCurrentDownloadInfo = {
	totalItemsAmount : 0,
	totalPageAmount : 0,
	currentDPageIndex : 0, // 1开始
	currentDItemIndexInTotal : 0,// 1开始
	currentDItemIndexInPage : 0,// 1开始
};
/*
currentDownloadInfo2.pageNo = needDownloadList[currentDownloadPageIndex].pageNo;
currentDownloadInfo2.totalNo = needDownloadList[currentDownloadPageIndex].totalNo;
currentDownloadInfo2.title = needDownloadList[currentDownloadPageIndex].title;
currentDownloadInfo2.pageIndex = currentDownloadPageIndex;
*/
var currentDownloadInfo2 = {};
var totalData = {
	jsonTotalDatas : [],
	downloadStatus : "无",
	catchStatus : "无"
};

var intIntervalNextPage;
totalData.error = "加载中...";
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
	// 获取cs消息组装并记录供下面下载时使用并发送给popup显示
	if (request.type == "wolf-catch-pagedata") {
		totalData.firstAccess = "获取中...";
		totalData.error = false;
		totalData.jsonTotalDatas = totalData.jsonTotalDatas
				.concat(request.data.records);
		totalData.displayData += request.data.pageDispalyText;
		sendMsgToPopup("popup-displayData");
	} else if (request.type == "currentItemInfo-downloadNextItem") {
		totalInfoAndCurrentDownloadInfo = request.data;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		sendMsgToPopup("popup-displayData");
		sendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
		
	} else if (request.type == "msg-totalInfo") {
		//第一次接收，放入本地变量存储：
		totalInfoAndCurrentDownloadInfo=request.data;
		totalInfoAndCurrentDownloadInfo.currentDPageIndex=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage=1;
		//通知cs下载第一条；
		sendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
	}else if(request.type == "askCS-downloadSameItem-afterAWhile"){
//		放到bg 下载后执行，下-页 间隔调用本过程
		// intInterval=window.setInterval("catchAndDownloadOneItem()",2000);
				// 考虑翻页不成功情况？通知bg？记录如较长时间没有到下个item，通知cs重新下载，并记录问题;
		//下面的语句在background中报错，建议还是放到cs中执行。是加到listener里的？？？为什么不行有待确定
//		 intIntervalNextPage=window.setInterval("test()",2000);
	}
});
var flag = false;
var currentTabId;
chrome.browserAction.onClicked.addListener(function(tab) {
	　　console.log('Turning ' + tab.url);
	　　flag = true;
	　　currentTabId = tab.id;
	　　chrome.tabs.getSelected(null, function(tab) {
//	　　　　sendMsg(tab.id);
	　　});
	});


chrome.webNavigation.onCompleted.addListener(function( tab ){
	　　console.log('加载完成***' + tab.tabId );
	　　if( flag ){
		totalInfoAndCurrentDownloadInfo = request.data;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		sendMsgToPopup("popup-displayData");
		sendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
		
	　　}
});



function test() {
//function sendMsgToCSRestartFromNextPage() {
	sendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
	window.clearInterval(intIntervalNextPage);
}
function sendMsgToCS(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.tabs.query({
//		 active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
//			console.log(response.farewell);
		});
	});
};
function sendMsgToPopup(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
};
function bStop() {
	var msg3 = {};
	msg3.type = "wolf-catch-stop";
	chrome.tabs.query({
		// active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg3, function(response) {
//			console.log(response.farewell);
		});
	});
};
function bStart() {
	var msg3 = {};
	msg3.type = "wolf-catch-start";
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg3, function(response) {
//			console.log(response.farewell);
		});
	});
};
chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
	suggest({
		filename : currentDownloadInfo2.totalNo + "-" + item.filename,
		conflict_action : 'overwrite',
		conflictAction : 'overwrite'
	});
	totalData.downloadStatus = "已经下载:" + currentDownloadInfo2.totalNo + "-"
			+ item.filename
	var msgDlNext = {};
	//新改动
	msgDlNext.type = "msg-catch&downloadThisItem-withTotalInfo";
	totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
	msgDlNext.totalInfoAndCurrentDownloadInfo = totalInfoAndCurrentDownloadInfo;
	// 通知cs下载下一个
	chrome.tabs.query({
		// active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msgDlNext, function(response) {
		});
	});
	chrome.tabs.query({
		active : true,
		currentWindow : true
	// url:"about:blank"
	}, function(tabs) {
		// 删除新打开的空白页
		chrome.tabs.remove(tabs[0].id);
	});
	// chrome.runtime.onMessage.addListener(catchStop);
	totalData.downloadStatus = "已经下载: " + currentDownloadInfo2.totalNo + "-"
			+ item.filename + ";" + "将要下载: " + msgDlNext.pageIndex

});
function checkForValidUrl(tabId, changeInfo, tab) {
	if (toolGetDomainFromUrl(tab.url).toLowerCase() == "http://shenbao.egreenapple.com/") {
		chrome.pageAction.show(tabId);
	}
};
function toolGetDomainFromUrl(url) {
	var host = "null";
	if (typeof url == "undefined" || null == url)
		url = window.location.href;
	var regex = /.*\:\/\/([^\/]*).*/;
	var match = url.match(regex);
	if (typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}
