function id(el) {
	// console.log("return element whose id is "+el);
	return document.getElementById(el);
}

'use strict';
	
// GLOBAL VARIABLES	
var dragStart={};
var drag={};
db=null;
logs=[];
log=null;
logIndex=null;
tags=[];
searchTag=null;
searchText=null;
currentDialog=null;
var thisWeek; // weeks since 1st Sept 1970
var backupWeek=0; // week of last backup;
months="JanFebMarAprMayJunJulAugSepOctNovDec";

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

/* CANCEL NEW TAG
id('buttonCancelTags').addEventListener('click', function() {
    toggleDialog('tagDialog', false);
});
*/
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
	var dbTransaction=db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	console.log("save log - logIndex is "+logIndex);
	if(adding) { // add new log
		var request=dbObjectStore.add(log);
		request.onsuccess=function(event) {
			console.log("new log added: "+log.text);
			populateList();
		};
		request.onerror=function(event) {console.log("error adding new log");};
	}
	else { // update existing log
		var request=dbObjectStore.put(log); // update log in database
		request.onsuccess=function(event)  {
			console.log("log "+log.id+" updated");
			populateList();
		};
		request.onerror = function(event) {console.log("error updating log "+log.id);};
	}
};

/* CANCEL NEW/EDIT LOG
id('buttonCancelLog').addEventListener('click', function() {
    toggleDialog('logDialog',false); // close add new jotting dialog
});
*/  
// DELETE LOG
id('buttonDeleteLog').addEventListener('click', function() {
	// var text=log.text; // initiate delete log
	// console.log("delete log "+text);
	// id('deleteText').innerHTML=text;
	var dbTransaction=db.transaction("logs","readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore("logs");
	var request=dbObjectStore.delete(log.id);
	request.onsuccess=function(event) {
		console.log("log "+log.id+" deleted");
		logs.splice(logIndex,1); // not needed - rebuilding logs anyway
		populateList();
	};
	request.onerror=function(event) {console.log("error deleting log "+log.id);};
	toggleDialog('logDialog',false);
});

/* CONFIRM DELETE
id('buttonDeleteConfirm').addEventListener('click', function() {
	console.log("delete log "+logIndex+" - "+log.text); // confirm delete log
	var dbTransaction=db.transaction("logs","readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore("logs");
	var request=dbObjectStore.delete(log.id);
	request.onsuccess=function(event) {
		console.log("log "+log.id+" deleted");
		logs.splice(logIndex,1); // not needed - rebuilding logs anyway
		populateList();
	};
	request.onerror=function(event) {console.log("error deleting log "+log.id);};
	toggleDialog('deleteDialog', false);
});
*/
/* CANCEL DELETE
id('buttonCancelDelete').addEventListener('click', function() {
    toggleDialog('deleteDialog', false); // close delete dialog
});
*/
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
	logs=[];
	var dbTransaction=db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    	if(cursor) {
			if(searchTag || searchText) {
				if(searchTag && (cursor.value.tags.indexOf(searchTag)>=0))
				{
					console.log("search tag match in "+cursor.value.text);
					logs.push(cursor.value);
				}
				else if(searchText && (cursor.value.text.indexOf(searchText)>=0))
				{
					console.log("search text match in "+cursor.value.text);
					logs.push(cursor.value);
				}
					
			}
			else {
				console.log("no search");
				logs.push(cursor.value);
			}
			cursor.continue();
		}
		else {
			console.log("list "+logs.length+" logs");
			logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); // date order
			if(searchTag || searchText) {
				id('headerTitle').textContent=searchTag+"/"+searchText;
			}
			else id('headerTitle').textContent='Pepys';
			console.log("populate list");
			id('list').innerHTML=""; // clear list
			var html="";
			var d="";
			var mon=0;
  			for(var i=logs.length-1; i>=0; i--) { // list latest first
  			 	var listItem = document.createElement('li');
				listItem.index=i;
	 		 	listItem.classList.add('log-item');
				listItem.addEventListener('click', function(){logIndex=this.index; openLog();});
				html="<span class='log-text'>"+logs[i].text+"</span><br>";
				d=logs[i].date;
				mon=parseInt(d.substr(5,2))-1;
				mon*=3;
				d=d.substr(8,2)+" "+months.substr(mon,3)+" "+d.substr(2,2);
				html+="<span class='log-date'>"+d;
				if(logs[i].days>1) html+="...<i>"+logs[i].days+" days</i>";
				html+="</span><span class='log-tags'>";
				for(var j in logs[i].tags) {
					html+=logs[i].tags[j]+" "
				}
				html+="</span><p>";
				listItem.innerHTML=html;
		  		id('list').appendChild(listItem);
  			}
  			thisWeek=Math.floor(new Date().getTime()/604800000); // weeks since Jan 1st 1970
  			if(thisWeek>backupWeek) backup();
	        // var thisMonth=new Date().getMonth();
	        // if(thisMonth!=lastSave) backup(); // monthly backups
  		}
	}
	request.onerror=function(event) {
		console.log("cursor request failed");
	}
}

// DATA
id('backupButton').addEventListener('click',function() {toggleDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {toggleDialog('importDialog',true)});
// id('dataCancelButton').addEventListener('click',function() {toggleDialog('dataDialog',false)});

// IMPORT FILE
id("fileChooser").addEventListener('change',function() {
    var file=id('fileChooser').files[0];
    console.log("file: "+file+" name: "+file.name);
    var fileReader=new FileReader();
    fileReader.addEventListener('load', function(evt) {
	    console.log("file read: "+evt.target.result);
    	var data=evt.target.result;
    	var json=JSON.parse(data);
    	console.log("json: "+json);
    	var logs=json.logs;
    	console.log(logs.length+" logs loaded");
    	var dbTransaction=db.transaction('logs',"readwrite");
    	var dbObjectStore=dbTransaction.objectStore('logs');
    	for(var i=0;i<logs.length;i++) {
    		console.log("add "+logs[i].text);
    		var request = dbObjectStore.add(logs[i]);
    		request.onsuccess = function(e) {
    			console.log(logs.length+" logs added to database");
    		};
    		request.onerror = function(e) {console.log("error adding log");};
    	}
    	toggleDialog('importDialog',false);
    	display("logs imported - restart");
    });
    fileReader.readAsText(file);
});
  
/* CANCEL IMPORT DATA
id('buttonCancelImport').addEventListener('click',function() {
    console.log('cancel import');
    toggleDialog('importDialog', false);
});
*/
// BACKUP
function backup() {
  	console.log("save backup");
  	backupWeek=thisWeek;
  	var fileName="Pepys-"+backupWeek+".json"
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
			console.log('save backupWeek: '+backupWeek);
			window.localStorage.setItem('backupWeek',backupWeek); // remember week of backup...
		}
	}
}

// START-UP CODE
backupWeek=window.localStorage.getItem('backupWeek'); // get week of last backup
console.log('backupWeek: '+backupWeek);
var request=window.indexedDB.open("journalDB",2);
request.onsuccess=function(event) {
    db=event.target.result;
    console.log("DB open");
    var dbTransaction=db.transaction('logs',"readwrite");
    console.log("indexedDB transaction ready");
    var dbObjectStore=dbTransaction.objectStore('logs');
    console.log("indexedDB objectStore ready");
    // code to read logs from database
    logs=[];
    console.log("logs array ready");
    var request=dbObjectStore.openCursor();
    request.onsuccess = function(event) {  
	    var cursor=event.target.result;  
        if (cursor) {
		    logs.push(cursor.value);
	    	cursor.continue();  
        }
	    else {
		    console.log("No more entries!");
		    console.log(logs.length+" logs");
		    if(logs.length<1) { // no logs: offer to restore backup
		        toggleDialog('importDialog',true);
		        return
		    }
		    logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); // date order
		    for(var i in logs) { // populate tagChooser
  			    for(var j in logs[i].tags) { // for each tag in each log...
				    if(tags.indexOf(logs[i].tags[j])<0) { // ...if not already in tags...
					    tags.push(logs[i].tags[j]); // ...add it
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
	    }
    };
};
request.onupgradeneeded=function(event) {
	db=event.currentTarget.result;
	if(!db.objectStoreNames.contains('logs')) {
		var dbObjectStore=db.createObjectStore("logs",{ keyPath:"id",autoIncrement:true });
		console.log("logs store created");
	}
	else console.log("logs store exists");
	console.log("database ready");
};
request.onerror=function(event) {
	alert("indexedDB error");
};
// implement service worker if browser is PWA friendly 
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('diarySW.js', {
		scope: '/pepys/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}
