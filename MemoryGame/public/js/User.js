//user ID generator (Closure)
var userSeq = (function(){
var currentValue = 0;
return {
	nextVal: function(){return ++currentValue;}
}
})();

//User class - getId() being a closure over local id
var User = (function (){
function User (name, avatar){
	var id=userSeq.nextVal();

	this.getId = function(){return id;};

	this.name = name;
	this.avatar = avatar;
	this.strJSON = JSON.stringify({"name": name, "avatar": avatar});

	this.print = function(){
		return `id=${this.getId()}, name=${this.name}, avatar=${this.avatar}`;
	};
}
return User;
})();
var CURRENT_USER = null;

//Module export
try {
	module.exports = User;
} catch (error) {
	//do nothing, locally this makes no sense
}
