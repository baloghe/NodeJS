var usr = require('../public/js/User');

var user1= new usr('alma','apple');
var user2= new usr('korte','pear');

console.log(usr());

console.log('user1: ' + user1.print());
console.log('user2: ' + user2.print());

user1.id=20;
console.log('user1 updated: ' + user1.print());
