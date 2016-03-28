
/*
  Global stuff
*/

//Create the global Scout object
window.scout = {
    "helpers": {},
    "projects": [],
    "versions": {
        "nodeSass": "",
        "libSass": "",
        "scout": ugui.app.version
    }
};

//Format time as 03:14:15
Date.prototype.timeNow = function(){
    return ((this.getHours() < 10)?"0":"") + ((this.getHours()>12)?(this.getHours()-12):this.getHours()) + ":" +
    ((this.getMinutes() < 10)?"0":"") + this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") +
    this.getSeconds() + ((this.getHours()>12)?(' PM'):' AM');
};

//Set up ability to use "startsWith" and "endsWith"
String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
};

String.prototype.endsWith = function (str){
    return this.slice(-str.length) == str;
};

//Move stuff around in Arrays
Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

//Remove an item from an array by passing in the index of that item
Array.prototype.remove = function (itemToRemove) {
    this.splice(itemToRemove, 1);
};