function getDomainFromUrl(url) {
	var host = "null";
	if (typeof url == "undefined" || null == url)
		url = window.location.href;
	var regex = /.*\:\/\/([^\/]*).*/;
	var match = url.match(regex);
	if (typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
	if (getDomainFromUrl(tab.url).toLowerCase() == "http://shenbao.egreenapple.com/") {
		chrome.pageAction.show(tabId);
	}
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

var currentDownloadInfo2 = {};

var totalData = {
	jsonTotalDatas : [],
	downloadStatus : "无",
	catchStatus : "无"
};
totalData.error = "加载中...";
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
	if (request.type == "wolf-catch-pagedata") {
		totalData.firstAccess = "获取中...";
		totalData.error = false;
		totalData.jsonTotalDatas = totalData.jsonTotalDatas.concat(request.data.records);
		totalData.displayData += request.data.pageDispalyText;

		var msg2 = {};
		msg2.type = "wolf-catch-pagedata-topopup";
		chrome.runtime.sendMessage(msg2);
	} else if (request.type == "current-download-item-info") {
		currentDownloadInfo2 = request.currentDownloadInfo2;
	}

});
function bStop() {
	var msg3 = {};
	msg3.type = "wolf-catch-stop";
	chrome.tabs.query({
		// active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg3, function(response) {
			console.log(response.farewell);
		});
	});
};
// bStop();
function bStart() {
	var msg3 = {};
	msg3.type = "wolf-catch-start";
	chrome.tabs.query({
		active : true,
		currentWindow : true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, msg3, function(response) {
			console.log(response.farewell);
		});
	});
};
chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
	// suggest({filename:
	// currentDownloadInfo2.totalNo+"-"+currentDownloadInfo2.pageNo+"-"+currentDownloadInfo2.title,
	suggest({
		filename : currentDownloadInfo2.totalNo + "-" + item.filename,
		conflict_action : 'overwrite',
		conflictAction : 'overwrite'
	});
	totalData.downloadStatus = "已经下载:" + currentDownloadInfo2.totalNo + "-" + item.filename
	var msgDlNext = {};
	msgDlNext.type = "download-nextPageIndex";
	msgDlNext.pageIndex = Number(currentDownloadInfo2.pageIndex) + 1;
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
	totalData.downloadStatus = "已经下载: " + currentDownloadInfo2.totalNo + "-" + item.filename + ";" + "将要下载: " + msgDlNext.pageIndex

});
