function id(el) {
	// console.log("return element whose id is "+el);
	return document.getElementById(el);
}

(function() {
  'use strict';
	
  // GLOBAL VARIABLES	
  var app = {
	db: null,
	logs: [],
	// logList: [],
	log: null,
	logIndex: null,
	tags: [],
	listName: 'Journal',
	searchTag: null,
	searchText: null,
	lastSave: null,
	months: "JanFebMarAprMayJunJulAugSepOctNovDec"
  };

  // EVENT LISTENERS
  document.getElementById("main").addEventListener('click', function() {
	id("menu").style.display="none";
  })
  
  document.getElementById('buttonMenu').addEventListener('click', function() { // MENU BUTTON
		var display = id("menu").style.display;
		if(display == "block") id("menu").style.display = "none";
		else id("menu").style.display = "block";
	});
	
  document.getElementById("import").addEventListener('click', function() { // IMPORT OPTION
  		console.log("IMPORT");
		app.toggleDialog("importDialog", true);
  })
	
  document.getElementById('buttonCancelImport').addEventListener('click', function() { // CANCEL IMPORT DATA
    app.toggleDialog('importDialog', false);
	document.getElementById("menu").style.display="none";
  });
  
  document.getElementById("fileChooser").addEventListener('change', function() { // IMPORT FILE
	var file = id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var logs=json.logs;
		console.log(logs.length+" logs loaded");
		var dbTransaction = app.db.transaction('logs',"readwrite");
		var dbObjectStore = dbTransaction.objectStore('logs');
		for(var i=0;i<logs.length;i++) {
			console.log("add "+logs[i].text);
			var request = dbObjectStore.add(logs[i]);
			request.onsuccess = function(e) {
				console.log(logs.length+" logs added to database");
			};
			request.onerror = function(e) {console.log("error adding log");};
		};
		app.toggleDialog('importDialog',false);
		alert("logs imported - restart");
  	});
  	fileReader.readAsText(file);
  },false);
  
  document.getElementById("export").addEventListener('click', function() { // EXPORT FILE
  	console.log("EXPORT");
	var today= new Date();
	var fileName = "journal" + today.getDate();
	var n = today.getMonth();
	fileName += app.months.substr(n*3,3);
	var n = today.getFullYear() % 100;
	if(n<10) fileName+="0";
	fileName += n + ".json";
	var dbTransaction = app.db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	
	var logs=[];
	var dbTransaction = app.db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	request.onsuccess = function(event) {  
		var cursor = event.target.result;  
    		if (cursor) {
			logs.push(cursor.value);
			console.log("log "+cursor.value.id+", date: "+cursor.value.date+", "+cursor.value.text);
			cursor.continue();  
    		}
		else {
			console.log(logs.length+" logs - sort and save");
    			logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); //chronological order
			var data={'logs': logs};
			var json=JSON.stringify(data);
			var blob = new Blob([json], {type:"data:application/json"});
  			var a =document.createElement('a');
			a.style.display='none';
    			var url = window.URL.createObjectURL(blob);
			console.log("data ready to save: "+blob.size+" bytes");
   			a.href= url;
   			a.download = fileName;
    			document.body.appendChild(a);
    			a.click();
			alert(fileName+" saved to downloads folder");
			document.getElementById("menu").style.display="none";

		}
	}
  })

  document.getElementById('buttonSearch').addEventListener('click', function() { // SEARCH BUTTON
	// show the search dialog
	app.toggleDialog('searchDialog',true);
	id('searchTagChooser').selectedIndex=-1;
	id('searchTextField').value="";
  });
  
  document.getElementById('buttonStartSearch').addEventListener('click', function() { // EXECUTE SEARCH
	app.searchTag = app.tags[id('searchTagChooser').selectedIndex];
	app.searchText = id('searchTextField').value;
	console.log("search by tag "+app.searchTag+"/text: "+app.searchText);
	app.populateList();
    app.toggleDialog('searchDialog', false);
  });
  
  document.getElementById('buttonCancelSearch').addEventListener('click', function() { // CANCEL SEARCH
	app.logList=app.logs;
	id('heading').textContent="Journal";
    app.toggleDialog('searchDialog', false);
	app.populateList();
  });

  document.getElementById('buttonNew').addEventListener('click', function() { // NEW BUTTON
    // show the log dialog
	console.log("show add jotting diaog with today's date, 1 day duration, blank text field and delete button disabled");
    app.toggleDialog('logDialog',true);
	var d=new Date().toISOString();
	id('logDateField').value=d.substr(0,10);
	id('logDaysField').value=1;
	id('logTextField').value="";
	app.log = {};
	app.log.tags = [];
	app.listLogTags();
	app.logIndex= null;
	id("buttonDeleteLog").disabled=true;
	id('buttonDeleteLog').style.color='gray';
  });
  /*
  document.getElementById('logDateField').addEventListener('change', function() { // CHANGE LOG DATE
  	app.resort=true; // ********* NOT NEEDED - POPULATE LIST INSTEAD (INCLUDES SORT) ********
  })
	*/
  document.getElementById('tagChooser').addEventListener('change', function() { // CHOOSE A TAG
	var n=id('tagChooser').selectedIndex;
	var tag=id('tagChooser').options.item(n).text;
	console.log("select tag "+tag);
	if(app.log.tags.indexOf(tag)<0) {
		app.log.tags.push(tag);
		app.listLogTags();
	}
    app.toggleDialog('tagDialog',false);
  });

   document.getElementById('newTagField').addEventListener('change', function() { // INPUT NEW TAG
  	var tag=id('newTagField').value;
	console.log("new tag: "+tag);
	// add to log.tags, log dialog and to tagChooser options
	if(app.tags.indexOf(tag)<0) {
		app.tags.push(tag);
		var opt=document.createElement('option');
		opt.text=tag;
		id('tagChooser').options.add(opt);
		opt=document.createElement('option');
		opt.text=tag;
		id('searchTagChooser').options.add(opt);
		app.log.tags.push(tag);
		app.listLogTags();
	}
	app.toggleDialog('tagDialog',false);
  });

  document.getElementById('buttonCancelTags').addEventListener('click', function() { // CANCEL NEW TAG
    app.toggleDialog('tagDialog', false);
  });

  document.getElementById('buttonSaveLog').addEventListener('click', function() { // SAVE NEW/EDITED LOG
	// if(app.logIndex==null) app.log={}; // adding new log
	app.log.date=id('logDateField').value;
	app.log.days=id('logDaysField').value;
	app.log.text=id('logTextField').value;
    app.toggleDialog('logDialog',false);
	console.log("save log - date: "+app.log.date+" "+app.days+" days text: "+app.log.text);
	var dbTransaction = app.db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	console.log("save log - logIndex is "+app.logIndex);
	if(app.logIndex == null) { // add new log
		var request = dbObjectStore.add(app.log);
		request.onsuccess = function(event) {
			console.log("new log added: "+app.log.text);
			app.populateList();
		};
		request.onerror = function(event) {console.log("error adding new log");};
	}
	else { // update existing log
		var request = dbObjectStore.put(app.log); // update log in database
		request.onsuccess = function(event)  {
			console.log("log "+app.log.id+" updated");
			app.populateList();
		};
		request.onerror = function(event) {console.log("error updating log "+app.log.id);};
	}
		/* old code - populateLogList now sorts into date order
		console.log("insert new log");
		var i=0;
		var found=false;
		while((i<app.logList.length) && !found) {
			console.log("log "+i+" date: "+app.logList[i].date);
			if(app.logList[i].date<=app.log.date) found=true;
			else i++;
		}
		app.logList.splice(i,0,app.log);
		// app.logList.push(app.log);
		if(app.logs.length>250) app.logs.pop(); // discard oldest logs
	}
	else if(app.resort) {
		console.log("date changed: re-sort logs");
		app.logs.sort(function(a,b) { return Date.parse(b.date)-Date.parse(a.date)}); // reverse date order (latest first)
	}
	console.log("date: "+id('logDateField').value);
	app.populateList();
	app.saveLogs();
	*/
  });

  document.getElementById('buttonCancelLog').addEventListener('click', function() { // CANCEL NEW/EDIT LOG
    app.toggleDialog('logDialog', false); // close add new jotting dialog
  });
  
  document.getElementById('buttonDeleteLog').addEventListener('click', function() { // DELETE LOG
	var text=app.log.text; // initiate delete log
	console.log("delete log "+text);
	app.toggleDialog("deleteDialog", true);
	document.getElementById('deleteText').innerHTML = text;
	app.toggleDialog("logDialog", false);
  });
  
  document.getElementById('buttonDeleteConfirm').addEventListener('click', function() { // CONFIRM DELETE
	console.log("delete log "+app.logIndex+" - "+app.log.text); // confirm delete log
	var dbTransaction = app.db.transaction("logs","readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore("logs");
	var request = dbObjectStore.delete(app.log.id);
	request.onsuccess = function(event) {
		console.log("log "+app.log.id+" deleted");
		app.logs.splice(app.logIndex,1); // not needed - rebuilding app.logs anyway
		app.populateList();
	};
	request.onerror = function(event) {console.log("error deleting log "+app.log.id);};
	app.toggleDialog('deleteDialog', false);
  });
  
  document.getElementById('buttonCancelDelete').addEventListener('click', function() { // CANCEL DELETE
    app.toggleDialog('deleteDialog', false); // close delete dialog
  });

  // SHOW/HIDE DIALOGS
  app.toggleDialog = function(d, visible) {
	  if(d=='searchDialog') { // toggle search dialog
	  	 if (visible) {
      		id("searchDialog").classList.add('dialog-container--visible');
    		} else {
      		id("searchDialog").classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='logDialog') { // toggle log dialog
	  	 if (visible) {
      		id("logDialog").classList.add('dialog-container--visible');
			// document.getElementById('newText').value="";
    		} else {
      		id("logDialog").classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='tagDialog') { // toggle TAGS dialog
	  	if (visible) {
      		id('tagDialog').classList.add('dialog-container--visible');
   		 } else {
     		id('tagDialog').classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='deleteDialog') { // toggle DELETE dialog
	  	if (visible) {
      		id('deleteDialog').classList.add('dialog-container--visible');
   		 } else {
     		id('deleteDialog').classList.remove('dialog-container--visible');
    		}
	  }
	  else if(d=='importDialog') { // toggle file chooser dialog
	  	 if (visible) {
      		id('importDialog').classList.add('dialog-container--visible');
    		} else {
      		id('importDialog').classList.remove('dialog-container--visible');
    		}
	  }
  };

  // Save logs to localStorage FOR NOW - LATER USE HOODIE
  app.saveLogs = function() {
    var logs = JSON.stringify(app.logs);
    localStorage.logs = logs;
	console.log("LOGS SAVED: "+logs);
  };
  
  // OPEN SELECTED LOG FOR EDITING
  app.openLog = function() {
	console.log("open log: "+app.logIndex);
//	app.resort=false;
	app.log = app.logs[app.logIndex];
	app.toggleDialog('logDialog',true);
	id('logDateField').value=app.log.date;
	id('logDaysField').value=app.log.days;
	id('logTextField').value=app.log.text;
	if(!app.log.tags) app.log.tags=[];
	app.listLogTags();
	id('buttonDeleteLog').disabled=false;
	id('buttonDeleteLog').style.color='red';
  }
  
  // POPULATE LIST OF TAGS FOR CURRENT LOG
  app.listLogTags = function() {
	var item = null;
  	id('logTagList').innerHTML="";
	  item=document.createElement('li');
	item.textContent="+ NEW TAG"; // add new tag
	item.addEventListener('click', function() {
		app.toggleDialog('tagDialog',true);
		id('tagChooser').selectedIndex=-1;
		id('newTagField').value="";
	});
	id('logTagList').appendChild(item);
	for(var i in app.log.tags) {
		item=document.createElement('li');
		item.addEventListener('click', function() {
			var tag=this.textContent;
			console.log("delete tag "+tag);
			var n=app.log.tags.indexOf(tag)
			app.log.tags.splice(n,1); // remove from log.tags
			app.listLogTags();
		});
		item.textContent=app.log.tags[i];
		id('logTagList').appendChild(item);
	}
  }
  
  // POPULATE LOGS LIST
  app.populateList = function() {
	console.log("popuate log list for search "+app.searchTag+"/"+app.searchText);
	app.logs = [];
	var dbTransaction = app.db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	request.onsuccess = function(event) {  
		var cursor = event.target.result;  
    		if (cursor) {
			if(app.searchTag || app.searchText) {
				if(app.searchTag && (cursor.value.tags.indexOf(app.searchTag)>=0))
				{
					console.log("search tag match in "+cursor.value.text);
					app.logs.push(cursor.value);
				}
					
				else if(app.searchText && (cursor.value.text.indexOf(app.searchText)>=0))
				{
					console.log("search text match in "+cursor.value.text);
					app.logs.push(cursor.value);
				}
					
			}
			else {
				console.log("no search");
				app.logs.push(cursor.value);
			}
			cursor.continue();
		}
		else {
			console.log("list "+app.logs.length+" logs");
			app.logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); // date order
			if(app.searchTag || app.searchText) {
				id('heading').textContent = app.searchTag+"/"+app.searchText;
			}
			console.log("populate list");
			id('list').innerHTML=""; // clear list
			var html="";
			var d="";
			var mon=0;
  			for(var i = app.logs.length-1; i>=0; i--) { // list latest first
  			 	var listItem = document.createElement('li');
				listItem.index=i;
	 		 	listItem.classList.add('log-item');
				listItem.addEventListener('click', function(){app.logIndex=this.index; app.openLog();});
				html=app.logs[i].text+"<br>";
				d=app.logs[i].date;
				mon=parseInt(d.substr(5,2))-1;
				mon*=3;
				// console.log("month: "+app.months.substr(mon,3));
				d=d.substr(8,2)+" "+app.months.substr(mon,3)+" "+d.substr(2,2);
				html+="<span class='log-date'>"+d;
				if(app.logs[i].days>1) html+="...<i>"+app.logs[i].days+" days</i>";
				html+="</span><span class='log-tags'>";
				for(var j in app.logs[i].tags) {
					html+=app.logs[i].tags[j]+" "
				}
				html+="</span><p>";
				listItem.innerHTML=html;
		  		id('list').appendChild(listItem);
  			}
  		}
	}
	request.onerror = function(event) {
		console.log("cursor request failed");
	}
  }

  // START-UP CODE
  var defaultData = {
	  logs: [{text: 'a journal entry', date:'2018-01-01', days:1, tags: []}]
  }
	var request = window.indexedDB.open("journalDB");
	request.onsuccess = function(event) {
		// console.log("request: "+request);
		app.db=event.target.result;
		console.log("DB open");
		var dbTransaction = app.db.transaction('logs',"readwrite");
		console.log("indexedDB transaction ready");
		var dbObjectStore = dbTransaction.objectStore('logs');
		console.log("indexedDB objectStore ready");
		// code to read logs from database
		app.logs=[];
		console.log("logs array ready");
		var request = dbObjectStore.openCursor();
		request.onsuccess = function(event) {  
			var cursor = event.target.result;  
    			if (cursor) {
				app.logs.push(cursor.value);
				// console.log("log "+cursor.key+", id: "+cursor.value.id+", date: "+cursor.value.date+", "+cursor.value.text);
				cursor.continue();  
    			}
			else {
				console.log("No more entries!");
				console.log(app.logs.length+" logs");
				app.logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); // date order
				for(var i in app.logs) { // populate tagChooser
	  				// console.log("log "+i+" has  "+app.logs[i].tags.length+" tags");
  					for(var j in app.logs[i].tags) { // for each tag in each log...
						if(app.tags.indexOf(app.logs[i].tags[j])<0) { // ...if not already in app.tags...
						app.tags.push(app.logs[i].tags[j]); // ...add it
					}
				}
  			}
  			app.tags.sort(); // sort tags alphabetically and populate tag choosers
  			for(var i in app.tags) {
				// console.log("add tag "+app.tags[i]);
  				var tag=document.createElement('option');
				tag.text=app.tags[i];
				document.getElementById('tagChooser').options.add(tag);
				tag=document.createElement('option');
				tag.text=app.tags[i];
				document.getElementById('searchTagChooser').options.add(tag);
  			}
			app.populateList();
			};
		};
	};
	request.onupgradeneeded = function(event) {
		var dbObjectStore = event.currentTarget.result.createObjectStore("logs", { keyPath: "id", autoIncrement: true });
		console.log("new logs ObjectStore created");
	};
	request.onerror = function(event) {
		alert("indexedDB error");
	};
  	// implement service worker if browser is PWA friendly 
	if (navigator.serviceWorker.controller) {
		console.log('Active service worker found, no need to register')
	} else { //Register the ServiceWorker
		navigator.serviceWorker.register('sw.js').then(function(reg) {
			console.log('Service worker has been registered for scope:'+ reg.scope);
		});
	}
})();




