function id(el) {
	// console.log("return element whose id is "+el);
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var dragStart={};
var drag={};
// db=null;
logData=null;
logs=[]; // all logs
list=[]; // listed logs
log=null;
logIndex=null;
tags=[];
searchTag=null;
searchText=null;
currentDialog=null;
// var thisWeek; // weeks since 1st Sept 1970
// var backupWeek=0; // week of last backup;
months="JanFebMarAprMayJunJulAugSepOctNovDec";

var root; // OPFS root directory

// EVENT LISTENERS
// SWIPE LEFT TO CLOSE DIALOGS
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x>50)&&(currentDialog)) toggleDialog(currentDialog,false); // drag left to close dialogs
})
// TAP ON HEADER
id('headerTitle').addEventListener('click',function() {
	toggleDialog('dataDialog',true);
});
// SEARCH BUTTON
id('buttonSearch').addEventListener('click', function() { // show the search dialog
	toggleDialog('searchDialog',true);
	id('searchTagChooser').selectedIndex=-1;
	id('searchTextField').value="";
	console.log('search - tags: '+id('searchTagChooser').options.length);
});
// EXECUTE SEARCH
id('buttonStartSearch').addEventListener('click', function() {
	searchTag=tags[id('searchTagChooser').selectedIndex];
	searchText=id('searchTextField').value;
	console.log("search by tag "+searchTag+"/text: "+searchText);
	populateList();
    toggleDialog('searchDialog', false);
});
function display(message) {
	id('message').innerText=message;
	toggleDialog('messageDialog',true);
}
// NEW BUTTON
id('buttonNew').addEventListener('click', function() { // show the log dialog
	console.log("show add jotting dialog with today's date, 1 day duration, blank text field and delete button disabled");
    toggleDialog('logDialog',true);
	var d=new Date().toISOString();
	id('logDateField').value=d.substr(0,10);
	id('logDaysField').value=1;
	id('logTextField').value="";
	log={};
	log.tags=[];
	listLogTags();
	logIndex=null;
	id("buttonDeleteLog").style.display='none';
	id('buttonSaveLog').style.display='none';
	id('buttonAddLog').style.display='block';
});
// CHOOSE A TAG
id('tagChooser').addEventListener('change', function() {
	var n=id('tagChooser').selectedIndex;
	var tag=id('tagChooser').options.item(n).text;
	console.log("select tag "+tag);
	if(tag.startsWith('+')) { // define a new tag
		toggleDialog('newTagDialog',true);
		return;
	}
	else if(log.tags.indexOf(tag)<0) {
		log.tags.push(tag);
		listLogTags();
	}
    // toggleDialog('tagDialog',false);
    toggleDialog('logDialog',true);
});
//  INPUT NEW TAG
id('newTagField').addEventListener('change', function() {
  	var tag=id('newTagField').value;
	console.log("new tag: "+tag);
	if(tags.indexOf(tag)<0) {
		console.log('define new tag: '+tag);
		tags.push(tag);
		var opt=document.createElement('option');
		opt.text=tag;
		id('tagChooser').options.add(opt);
		opt=document.createElement('option');
		opt.text=tag;
		id('searchTagChooser').options.add(opt);
		log.tags.push(tag);
		console.log(tag+' added to tag list, tag search and log tags');
		listLogTags();
	}
	toggleDialog('logDialog',true);
});
// ADD NEW LOG
id('buttonAddLog').addEventListener('click',function() {
	saveLog(true);
})
// UPDATE LOG
id('buttonSaveLog').addEventListener('click', function() {
	saveLog(false);
})
// SAVE LOG
function saveLog(adding) {
	log.date=id('logDateField').value;
	log.days=id('logDaysField').value;
	log.text=id('logTextField').value;
    toggleDialog('logDialog',false);
	console.log("save log - date: "+log.date+" "+log.days+" days text: "+log.text);
	if(adding) logs.push(log);
	else logs[logIndex]=log;
	writeData();
	populateList();
};
// DELETE LOG
id('buttonDeleteLog').addEventListener('click', function() {
	logs.splice(logIndex,1);
	toggleDialog('logDialog',false);
	writeData();
});
// SHOW/HIDE DIALOGS
function  toggleDialog(d, visible) {
    console.log('toggle '+d+' - '+visible);
    if(currentDialog) id(currentDialog).style.display='none';
    if(visible) {
    	currentDialog=d;
    	id(d).style.display='block';
    }
  	/* id('buttonNew').style.display=(visible)?'none':'block';
	if(d=='searchDialog') { // toggle search dialog
	    if(visible) {
      		id("searchDialog").style.display='block';
    	} else {
      		id("searchDialog").style.display='none';
    	}
	}
	else if(d=='logDialog') { // toggle log dialog
	    if (visible) {
      		id("logDialog").style.display='block';
    	} else {
      		id("logDialog").style.display='none';
    	}
	}
	else if(d=='tagDialog') { // toggle TAGS dialog
	  	if (visible) {
      		id('tagDialog').style.display='block';
   		} else {
     		id('tagDialog').style.display='none';
    	}
	}
	else if(d=='deleteDialog') { // toggle DELETE dialog
	  	if(visible) {
      		id('deleteDialog').style.display='block';
   		} else {
     		id('deleteDialog').style.display='none';
    	}
	}
	else if(d=='dataDialog') {
	  	if(visible) {
      		id('dataDialog').style.display='block';
    	} else {
      		id('dataDialog').style.display='none';
    	}
	}
	else if(d=='importDialog') { // toggle file chooser dialog
	  	if(visible) {
      		id('importDialog').style.display='block';
    	} else {
      		id('importDialog').style.display='none';
    	}
	}
	*/
}
// OPEN SELECTED LOG FOR EDITING
function openLog() {
	console.log("open log: "+logIndex);
	log=logs[logIndex];
	toggleDialog('logDialog',true);
	id('logDateField').value=log.date;
	id('logDaysField').value=log.days;
	id('logTextField').value=log.text;
	if(!log.tags) log.tags=[];
	listLogTags();
	id('buttonAddLog').style.display='none';
	id('buttonSaveLog').style.display='block';
	id('buttonDeleteLog').style.display='block';
}
// POPULATE LIST OF TAGS FOR CURRENT LOG
function listLogTags() {
	var item=null;
  	id('logTagList').innerHTML="";
	item=document.createElement('li');
	item.textContent="+ NEW TAG"; // add new tag
	item.addEventListener('click', function() {
		toggleDialog('tagDialog',true);
		id('tagChooser').selectedIndex=-1;
		id('newTagField').value="";
	});
	id('logTagList').appendChild(item);
	for(var i in log.tags) {
		item=document.createElement('li');
		item.addEventListener('click', function() {
			var tag=this.textContent;
			console.log("delete tag "+tag);
			var n=log.tags.indexOf(tag)
			log.tags.splice(n,1); // remove from log.tags
			listLogTags();
		});
		item.textContent=log.tags[i];
		id('logTagList').appendChild(item);
	}
}
// POPULATE LOGS LIST
function populateList() {
	console.log("populate log list for search "+searchTag+"/"+searchText);
	if(searchTag || searchText) id('headerTitle').textContent=searchTag+"/"+searchText;
	else id('headerTitle').textContent='Logbook';
	logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); // date order
	list=[];
	for(var i=0;i<logs.length;i++) { // build list of logs to show
		if(searchTag || searchText) { // list logs matching search
			if(searchTag && (logs[i].tags.indexOf(searchTag)>=0))
			{
				console.log("search tag match in "+logs[i].text);
				list.push(i);
			}
			else if(searchText && (logs[i].text.indexOf(searchText)>=0))
			{
				console.log("search text match in "+logs[i].text);
				list.push(i);
			}
		}
		else { // no search - list all logs
			console.log("no search");
			list.push(i);
		}
	}
	console.log('list '+list.length+' logs');
	id('list').innerHTML=""; // clear list
	var html="";
	var d="";
	var mon=0;
	for(var i=list.length-1; i>=0; i--) { // build list - latest first
  		var listItem = document.createElement('li');
		listItem.index=list[i]; // index of listed log
		log=logs[list[i]]; // listed log
	 	listItem.classList.add('log-item');
		listItem.addEventListener('click', function(){logIndex=this.index; openLog();});
		html="<span class='log-text'>"+log.text+"</span><br>";
		d=log.date;
		mon=parseInt(d.substr(5,2))-1;
		mon*=3;
		d=d.substr(8,2)+" "+months.substr(mon,3)+" "+d.substr(2,2);
		html+="<span class='log-date'>"+d;
		if(log.days>1) html+="...<i>"+log.days+" days</i>";
		html+="</span><span class='log-tags'>";
		for(var j in log.tags) {
			html+=log.tags[j]+" "
		}
		html+="</span><p>";
		listItem.innerHTML=html;
		id('list').appendChild(listItem);
  	}
}
// DATA
id('backupButton').addEventListener('click',function() {toggleDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {toggleDialog('importDialog',true)});
id("fileChooser").addEventListener('change',function() {
    var file=id('fileChooser').files[0];
    console.log("file: "+file+" name: "+file.name);
    var fileReader=new FileReader();
    fileReader.addEventListener('load', function(evt) {
	    console.log("file read: "+evt.target.result);
    	var data=evt.target.result;
    	var json=JSON.parse(data);
    	console.log("json: "+json);
    	logs=[];
    	for(var i=0;i<json.logs.length;i++) { // discard redundant log IDs
    		logs[i]={};
    		logs[i].tags=json.logs[i].tags;
    		logs[i].date=json.logs[i].date;
    		logs[i].days=json.logs[i].days;
    		logs[i].text=json.logs[i].text;
    		console.log('log '+i+': '+logs[i].text);
    	}
    	console.log(logs.length+" logs loaded");
    	logData=JSON.stringify(logs);
    	writeData();
    	toggleDialog('importDialog',false);
    	display("logs imported - restart");
    });
    fileReader.readAsText(file);
});
function backup() {
  	console.log("save backup");
  	var fileName="LogbookData.json"
  	/*
	var dbTransaction=db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var logs=[];
	var request=dbObjectStore.openCursor();
	request.onsuccess = function(event) {  
		var cursor=event.target.result;  
    	if(cursor) {
		    logs.push(cursor.value);
			// console.log("log "+cursor.value.id+", date: "+cursor.value.date+", "+cursor.value.text);
			cursor.continue();  
    	}
		else {
		*/
	console.log(logs.length+" logs - sort and save");
    logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); //chronological order
	var data={'logs': logs};
	var json=JSON.stringify(data);
	var blob=new Blob([json],{type:"data:application/json"});
  	var a=document.createElement('a');
	a.style.display='none';
    var url=window.URL.createObjectURL(blob);
	console.log("data ready to save: "+blob.size+" bytes");
   	a.href=url;
   	a.download=fileName;
    document.body.appendChild(a);
    a.click();
	display(fileName+" saved to downloads folder");
}
async function readData() {
	root=await navigator.storage.getDirectory();
	console.log('OPFS root directory: '+root);
	var handle=await root.getFileHandle('LogbookData');
	var file=await handle.getFile();
	var loader=new FileReader();
    	loader.addEventListener('load',function(evt) {
        	var data=evt.target.result;
        	console.log('data: '+data.length+' bytes');
      		logs=JSON.parse(data);
      		console.log(logs.length+' logs read');
      		for(var i in logs) console.log('log '+i+': '+logs[i].text);
      		// build tag list
			tags=[];
			for(var i=0;i<logs.length;i++) {
				// console.log('log '+i+' has '+logs[i].tags.length+' tags');
				for(var j in logs[i].tags) { // for each tag in each log...
					if(tags.indexOf(logs[i].tags[j])<0) { // ...if not already in tags...
						tags.push(logs[i].tags[j]); // ...add it
						console.log('tag added');
					}
				}
			}
			tags.sort(); // sort tags alphabetically and populate tag choosers
  			for(i in tags) {
				var tag=document.createElement('option');
				tag.text=tags[i];
				tag=document.createElement('option');
				tag.text=tags[i];
				id('tagChooser').options.add(tag);
				var stag=document.createElement('option');
				stag.text=tags[i];
				stag=document.createElement('option');
				stag.text=tags[i];
				id('searchTagChooser').options.add(stag);
  			}
  			tag=document.createElement('option');
  			tag.text='+NEW';
  			id('tagChooser').options.add(tag);
  			console.log('search tags: '+id('searchTagChooser').options.length);
			populateList();
    	});
    	loader.addEventListener('error',function(event) {
        	console.log('load failed - '+event);
    	});
    	loader.readAsText(file);
}
async function writeData() {
	var handle=await root.getFileHandle('LogbookData',{create:true});
	// var file=await fileHandle.getFile();
	var data=JSON.stringify(logs);
	var writable=await handle.createWritable();
    await writable.write(data);
    await writable.close();
	console.log('data saved to LogbookData');
}
// START-UP CODE
readData();
// implement service worker if browser is PWA friendly 
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Logbook/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}
