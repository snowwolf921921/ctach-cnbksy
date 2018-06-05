//restart 需要读取全局变量
var totalInfoAndCurrentDownloadInfo = {
	totalItemsAmount : 0,
	totalPageAmount : 0,
	currentDPageIndex : 0, // 1开始
	currentDItemIndexInTotal : 0,// 1开始
	currentDItemIndexInPage : 0,// 1开始
};
var currentDownloadInfo2 = {};
var totalData = {
	jsonTotalDatas : [],
	downloadStatus : "无",
	catchStatus : "无"
};
//默认可以翻页
var nextPageEnableFlag = true;
var intIntervalNextPage;
totalData.error = "加载中...";
//chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.runtime.onMessage.addListener(function(request, sender, sendRequest) {
	// 获取cs消息组装并记录供下面下载时使用并发送给popup显示
	if (request.type == "wolf-catch-pagedata") {
		totalData.firstAccess = "获取中...";
		totalData.error = false;
		totalData.jsonTotalDatas = totalData.jsonTotalDatas
				.concat(request.data.records);
		totalData.displayData += request.data.pageDispalyText;
		tSendMsgToPopup("popup-displayData");
	} else if (request.type == "totalInfo") {
		//第一次接收，放入本地变量存储：
		totalInfoAndCurrentDownloadInfo=request.data;
		totalInfoAndCurrentDownloadInfo.currentDPageIndex=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal=1;
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInPage=1;
		//totalItemsAmount 已经在cs页中放入了
		//通知cs下载第一条；
		tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
	} else if (request.type == "currentItemInfo-downloadNextItem") {
		totalInfoAndCurrentDownloadInfo = request.data;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
		tSendMsgToPopup("popup-displayData");
		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		var bFlagIndexNeedNextPage=tCaltulatePageIndex(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal,totalInfoAndCurrentDownloadInfo.itemsAmountPerPage)>totalInfoAndCurrentDownloadInfo.currentDPageIndex;
//		alert(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+","+totalInfoAndCurrentDownloadInfo.itemsAmountPerPage+","+totalInfoAndCurrentDownloadInfo.currentDPageIndex);
		if((totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal<=totalInfoAndCurrentDownloadInfo.totalItemsAmount)){
			if(!(!nextPageEnableFlag&&bFlagIndexNeedNextPage)){
				tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
			}	
		}
	} else if (request.type == "currentItemInfo-waitdownload") {
		//待确定
		totalInfoAndCurrentDownloadInfo = request.data;
		totalData.displayData += totalInfoAndCurrentDownloadInfo.itemTrInfo;
//在下载文件后2秒或其他时间触发，下载下一条，
//		totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
		tSendMsgToPopup("popup-displayData");
//		tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
		
	}else if(request.type == "askCS-downloadSameItem-afterAWhile"){
		if(nextPageEnableFlag){
			totalInfoAndCurrentDownloadInfo = request.data;
			//setInterval定时不断执行，setTimeout只执行一次
			var t=setTimeout(function(){
				tSendMsgToPopup("popup-displayData");
				tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totalInfoAndCurrentDownloadInfo);
			},2000)
		}
	}
});

function bStop() {
	nextPageEnableFlag=false;
};
function bStart() {
	nextPageEnableFlag = true;
	tSendMsgToCS("firstStart",{});
};
function bResume() {
	nextPageEnableFlag = true;
	tSendMsgToCS("msg-catch&downloadThisItem-withTotalInfo",totalInfoAndCurrentDownloadInfo);
};
chrome.downloads.onDeterminingFilename.addListener(function(item, suggest) {
	suggest({
		filename : totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal + "-" + item.filename,
		conflict_action : 'overwrite',
		conflictAction : 'overwrite'
	});
//	totalData.downloadStatus = "已经下载:" + totalInfoAndCurrentDownloadInfo.totalNo + "-"+ item.filename

	
	// chrome.runtime.onMessage.addListener(catchStop);
	totalData.downloadStatus = "已经下载: " + totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal + "-"
			+ item.filename + ";" + "将要下载: " +(totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal+1);
	var msgDlNext = {};
	//新改动
	msgDlNext.type = "msg-catch&downloadThisItem-withTotalInfo";
	
	totalInfoAndCurrentDownloadInfo.currentDItemIndexInTotal++;
//	tSendMsgToCS('msg-catch&downloadThisItem-withTotalInfo',totAlInfoAndCurrentDownloadInfo);
	closeTabAndNext();
//	var t=setTimeout(closeTabAndNext,800);
	
});
chrome.commands.onCommand.addListener(function(command){
//	console.log("commmand",command);
	if(command =="toggle-stop-cn"){
		bStop();
	}
})
function closeTabAndNext(){
	chrome.tabs.query({
		active : true,
		currentWindow : true
	// url:"about:blank"
	}, function(tabs) {
		// 删除新打开的空白页
		if(tabs.length>0){
			chrome.tabs.remove(tabs[0].id);
			if(nextPageEnableFlag){
				t=setTimeout(nextItemToCS,800);
			}
		}
	});
	
}

function nextItemToCS(){
	tSendMsgToCS("msg-catch&downloadThisItem-withTotalInfo",totalInfoAndCurrentDownloadInfo)
}

function tCaltulatePageIndex(itemIndex,amountPerPage){
	if (amountPerPage!=0){
		return Math.ceil(itemIndex/amountPerPage);
	}else{
		return 0;
	}
}
function tSendMsgToCS(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.tabs.query({
//		 active : true,
		currentWindow : true
	}, function(tabs) {
	if(tabs.length>0){
		chrome.tabs.sendMessage(tabs[0].id, msg, function(response) {
//			console.log(response.farewell);
		});
	}	
	});
};

function tSendMsgToPopup(msgType,data) {
	var msg = {};
	msg.type = msgType;
	msg.data=data;
	chrome.runtime.sendMessage(msg);
};
