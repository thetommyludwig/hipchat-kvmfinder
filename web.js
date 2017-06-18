/* Author: Tom Ludwig
   Date: 11/15/2015
   Project: A Hipchat integration to help us DC techs
            locate and update locations for KVM's
   NOTES: one must run kvms() to store all KVM ID's in array before any calls
*/

/*   PACKAGE IMPORTS   */
var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg);
var request = require('request');
var track = require('ac-koa-hipchat-keenio').track;
var Notifier = require('ac-koa-hipchat-notifier').Notifier;
var Commands = require('./lib/commands');
/*   GLOBAL VARIABLES   */
var sessionCookie;
var rackID;
var kvmArray = [];
var leroom;
var command;

var addon = app.addon()
  .hipchat()
  .allowRoom(true)
  .scopes('send_notification');
  
track(addon);

var notifier = Notifier({format: 'html', dir: __dirname + '/messages'});
var commands = Commands(notifier); 

/*   SEND MESSAGES TO ROOM   */
function messageRoom(message){  leroom.sendNotification(message); }

/*   AUTHENTICATE WITH HARD CODED LOGIN - bad idea? yes   */
function getSessID(callBack){
   var uName=encodeURIComponent("EMAILHERE");
   var uPass=encodeURIComponent("PASSWORDHERE");

   var params = "?username="+uName+"&password="+uPass+"&submit_login_form=1";
   var theurl = "https://domainredacted.com/auth/login"+params;
   
   request.post({
      headers: {  'Content-Type' : 'application/x-www-form-urlencoded',
	              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
		           'Connection':'keep-alive',
                   'Content-Length': 0  
	  },
      url : theurl,
	  followRedirect: true,
   }, function(error, response, body) {
	  //console.log(response);
	  //console.log(body);
      sessionCookie = response.headers['set-cookie'][response.headers['set-cookie'].length - 1];
      sessionCookie = sessionCookie.split(';');
      sessionCookie = sessionCookie[0];
      //console.log(sessionCookie);
	  //console.log(body);
      callBack();
});
}

/*   REMOVE THE KVM FROM THE RACK   */
function removeFromRack(kvmNumber){
   var kvmID = kvmArray[kvmNumber];
   var theurl = "https://domainredacted.com/devices2/profile?device_return_id=" + kvmID + "&device_id=" + kvmID + "&remove_device_rack=1";
   
   request.get({
      headers: {  'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8', 
	              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
		          'Connection':'keep-alive',
		          'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		          'Cookie' : sessionCookie 
	  },
      url : theurl,
	  followRedirect: true,
   }, function(error, response, body) {
	  //console.log(response);
	  //console.log(body);
      console.log("KVM " + kvmID + " should be reclaimed");
});
}

/*   MESSAGE THE KVM'S IP ADDRESS   */
function messageKVMIP(kvmID){
   var theurl = "https://domainredacted.com/devices2/tabload/profile/main_profile/" + kvmID;
   
   request.post({
      headers: {  'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8', 
	              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
		          'Connection':'keep-alive',
                  'Content-Length': 0,
		          'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		          'Cookie' : sessionCookie  
	  },
      url : theurl,
	  followRedirect: true,
   }, function(error, response, body) {
	  //console.log(response);
	  //console.log(body);
	  var startIndex = body.indexOf("Hostname");
	  var leIP = body.substr(startIndex);
	  leIP = leIP.substr(10);
	  leIP = leIP.substr(0, leIP.indexOf("<"));
	  messageRoom("The KVM's IP is: <a href>http://" + leIP + "</a>");
      //console.log("The KVM's IP is " + leIP);
});
}

/*   SET THE KVM'S RACK LOCATION IN ITS PROFILE   */
function setRackID(kvmNumber, rackID){
   var kvmID = kvmArray[kvmNumber];
   var theurl = "https://domainredacted.com/devices2/profile?device_return_id=" + kvmID + "&device_id=" + kvmID + "&edit_device_rack=1&selected_option_id=0&rack_id=" + rackID;
   
   request.post({
      headers: {  'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8', 
	              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
		          'Connection':'keep-alive',
                  'Content-Length': 0,
		          'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		          'Cookie' : sessionCookie  
	  },
      url : theurl,
	  followRedirect: true,
   }, function(error, response, body) {
	  //console.log(response);
	  //console.log(body);
	  messageKVMIP(kvmID);
      console.log("KVM " + kvmID + " should be set to rack " + rackID);
});
}

/*   GET THE RACK ID AND THEN SET IT BY CALLING SETRACKID FUNCTION   */
function getAndSetRackID(kvmNumber, rack, rackCallBack ){
	var rack = rack.toUpperCase();
	
	request.get({
       headers: {  'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8', 
	               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',	  
		           'Connection':'keep-alive',
		           'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		           'Cookie' : sessionCookie
	},
	url : 'https://domainredacted.com/devices2/async?sEcho=4&iColumns=6&sColumns=&iDisplayStart=0&iDisplayLength=500&iSortingCols=2&iSortCol_0=3&sSortDir_0=ASC&iSortCol_1=1&sSortDir_1=ASC&bSortable_0=false&bSortable_1=true&bSortable_2=true&bSortable_3=true&bSortable_4=true&bSortable_5=false&retrieve_data_table=true&device_name=&device_types=%5B%223%22%5D&device_subzones=%5B%2212%22%5D&device_owners=%5B%5D&device_assets=%5B%5D&device_asset_tags=%5B%5D&device_racks=%5B%5D&device_service='
	}, function(error, response, body) {
	   body = JSON.parse(body);
	   //console.log(body);
	   console.log(body.iTotalRecords);
		if(rack === "BIN" || rack === "BOX"){
			removeFromRack(kvmNumber);
			messageRoom("This KVM has been reclaimed.");
		}
		else{
		for(i = 0; i < body.iTotalRecords; i++) {
			if(((body["aaData"][i][1]).toUpperCase()).indexOf(rack) != -1){
				var startindex = (body["aaData"][i][1]).indexOf("profile") + 8;
				rackID = body["aaData"][i][1].substr(startindex);
				var endindex = rackID.indexOf(">");
				rackID = rackID.substr(0, endindex-1);					
				setRackID(kvmNumber, rackID);
				rackCallBack("This KVM is now in rack " + rack);
				console.log("rackid " + rackID);
                return;
			}
		}
		rackCallBack("Sir, I cannot find this rack...");	
        }		
	  //console.log(error)
});	
}

/*   CRITICAL FUNCTION MUST BE RUN FIRST TO SET THE IDS IN THE KVMARRAY   */
function findKVMs() {
    var queryURL = "https://domainredacted.com/devices2/async?sEcho=3&iColumns=6&sColumns=&iDisplayStart=0&iDisplayLength=20&iSortingCols=2&iSortCol_0=3&sSortDir_0=ASC&iSortCol_1=1&sSortDir_1=ASC&bSortable_0=false&bSortable_1=true&bSortable_2=true&bSortable_3=true&bSortable_4=true&bSortable_5=false&retrieve_data_table=true&device_name=&device_types=%5B%226%22%5D&device_subzones=%5B%2212%22%5D&device_owners=%5B%2279%22%5D&device_assets=%5B%5D&device_asset_tags=%5B%5D&device_racks=%5B%5D&device_service=";
    var kvmLocStr = "";
   
	request.get({
      headers: {  'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8', 
	              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',	  
		          'Connection':'keep-alive',
		          'Accept':  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
		          'Cookie' : sessionCookie
    },
	url : 'https://domainredacted.com/devices2/async?sEcho=7&iColumns=6&sColumns=&iDisplayStart=0&iDisplayLength=20&iSortingCols=2&iSortCol_0=3&sSortDir_0=ASC&iSortCol_1=1&sSortDir_1=ASC&bSortable_0=false&bSortable_1=true&bSortable_2=true&bSortable_3=true&bSortable_4=true&bSortable_5=false&retrieve_data_table=true&device_name=&device_types=%5B%226%22%5D&device_subzones=%5B%2212%22%5D&device_owners=%5B%2279%22%5D&device_assets=%5B%5D&device_asset_tags=%5B%5D&device_racks=%5B%5D&device_service='
    }, function(error, response, body) {
	   body = JSON.parse(body);
	   //console.log(body);
	   //console.log(body.iTotalRecords);

		for(i = 0; i < body.iTotalRecords; i++) {
			var kvmID;
			var startindex = (body["aaData"][i][1]).indexOf(">") + 1;
			var kvmname = body["aaData"][i][1].substr(startindex);
			var endindex = kvmname.indexOf("</a>");
			kvmname = kvmname.substr(0, endindex);			
			var startindex2 = (body["aaData"][i][1]).indexOf("profile") + 8;
			kvmID = body["aaData"][i][1].substr(startindex2);
			var endindex2 = kvmID.indexOf(">");
			kvmID = kvmID.substr(0, endindex2-1);			
			kvmArray[i+1]=kvmID;
			//console.log("kvm id is " + kvmID);
			kvmLocStr += kvmname + " : " + body["aaData"][i][5] + "<br>";		
		}
		
		messageRoom(kvmLocStr);						
	    //console.log(error)
}); 
}

/*   /KVMS LIST WEBHOOK   */
addon.webhook('room_message', /^\/(kvms)$/i, function *() {
   // get the room handle
   leroom = this.roomClient;
   getSessID(findKVMs);
});

/*   HUMOR WEBHOOK   */
addon.webhook('room_message', /^.*(daddy).*$/i, function *() {
   // get the room handle
   leroom = this.roomClient;
   messageRoom('Well ' + this.sender.name + "...In a galaxy far far away...Actually, the people who work nightshift created me: Cameron & Hanson's excellent ideas & Tommy borrowing code from Sassy");
}); 

/*   HUMOR WEBHOOK   */
addon.webhook('room_message', /^.*(where's waldo).*$/i, function *() {
   // get the room handle
   leroom = this.roomClient;
   messageRoom("Right here! Where's Crystal???");
}); 

/*   HELP WEBHOOK   */
addon.webhook('room_message', /^.*(waldo help).*$/i, function *() {
   // get the room handle
   leroom = this.roomClient;
   return yield this.roomClient.sendNotification('Maybe I can help? Here are the commands that I support: <br> /kvms - lists all KVMs\' locations <br> /kvm(1-16) to (rack name) - moves KVM to rack <br> /kvm to box - reclaims <br><br> For example, "/kvm1 to A3" would move KVM1 to rack A3'); 
});

/*   MOVE KVM WEBHOOK   */
addon.webhook('room_message', /^\/(?:kvm[1-9][0-6]?)(?:\s+(.+?)\s*$)?/i, function *() {  //  /^\/(?:kvm1?)(?:\s+(.+?)\s*$)?/
   // get the room handle
   leroom = this.roomClient;

   if (!this.match[1] || /^help\b/.test(this.match[1])) {
      return yield this.roomClient.sendNotification('Try again with the following format: <br> /kvms - lists all KVMs\' locations <br> /kvm(1-16) to (rack name) - moves KVM to rack <br> /kvm to box - reclaims <br><br> For example, "/kvm1 to A3" would move KVM1 to rack A3'); 
   }
   //console.log(this.match[0]);
   var kvmNumMatcher = new RegExp('(?:\/kvm)(\\d+)');
   //console.log(kvmNumMatcher);
   var numFromMatch = this.match[0];
   var KVMnum = kvmNumMatcher.exec(numFromMatch);
   KVMnum = KVMnum[1];
   //console.log(KVMnum[1]);
   var matcher = new RegExp('^(' + Object.keys(commands).join('|') + ')\\s+(.+?)\\s*$');
   //console.log(matcher);
   var match = matcher.exec(this.match[1]);
   //console.log(match);
  
   if (match && match[1]) {
	  rackID = null;
	  console.log("match is " + match[2]);
	     // must login to get sessID
		 // match[2] is the rack name
	     function moveKVM(){		
            //console.log("KVMnum is " + KVMnum);	 
			getAndSetRackID(KVMnum, match[2], callBackMessage)	
          }
	   
	   getSessID(moveKVM);
   }
  
   function callBackMessage(ledata){
      messageRoom(ledata);
   }
});


app.listen();
