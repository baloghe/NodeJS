const path = require('path');
const express = require('express');
const fs = require('fs');

var app = express();

const approot = 'dwhdoc';

app.use(express.static(__dirname + '/public'));

// view engine setup
app.set('views', path.join(__dirname, './public/views'));
app.set('view engine', 'pug');


// read data (or connect to a database)
const db = require('./public/data/db.js');

/* redirect GET requests */
app.get('/favicon.ico', (req, res) => res.status(204)); /* https://stackoverflow.com/questions/35408729/express-js-prevent-get-favicon-ico */

//serve home
app.get('/'+approot, function(req, res, next) {
	res.render(
		'index.pug',
		{ "approot": approot,
		  lang: db.getLang(),
		  meta: db.getMeta(),
		  navH: db.enumTables(),
		  navV: db.enumColumns()
		}
	);
	console.log(`root called`);
});

//serve table spec
app.get('/'+approot+'/show/table/:tableId', (req, res)=>{
	const tableId = req.params.tableId;
	console.log(`table ${tableId} requested`);
	//console.log(`  result: ${JSON.stringify(getTableSpec(tableId))}`);
	
	let obj = getTableSpec(tableId);
	if(obj.errorList != null && obj.errorList.length > 0){
		res.render('specError', {table: tableId, errorList: obj.errorList} );
		return;
	}
	
	try{
		res.render('tblSpec', obj );
	} catch(err){
		console.log(err);
		res.render('rendError', {table: tableId, error: JSON.stringify(err)});
	}
});

//serve column spec without definite table
app.get('/'+approot+'/show/column/:columnId', (req, res)=>{
	const columnId = req.params.columnId;
	console.log(`column ${columnId} requested WITHOUT table specified`);
	
	let obj = getColumnSpec(columnId);
	if(obj.errorList != null && obj.errorList.length > 0){
		res.render('specError', {column: columnId, errorList: obj.errorList} );
		return;
	}
		
	obj.lang = db.getLang();
	obj.approot = approot;
	let tmpl = obj.useTemplate;
	
	try{
		res.render(tmpl, obj );
	} catch(err){
		console.log(err);
		res.render('rendError', {column: columnId, error: JSON.stringify(err)});
	}
});

//serve column spec for definite table
app.get('/'+approot+'/show/column/:columnId/table/:tableId', (req, res)=>{
	const columnId = req.params.columnId;
	const tableId = req.params.tableId;
	console.log(`column ${tableId}.${columnId} requested`);
	
	let obj = getColumnSpec(columnId, tableId);
	if(obj.errorList != null && obj.errorList.length > 0){
		res.render('specError', {table: tableId, column: columnId, errorList: obj.errorList} );
		return;
	}
	
	obj.approot = approot;
	let tmpl = obj.useTemplate;
	
	try{
		res.render(tmpl, obj );
	} catch(err){
		console.log(err);
		res.render('rendError', {table: tableId, column: columnId, error: JSON.stringify(err)});
	}
});

function getTableSpec(tbl){
	let a = db.getTableSpec(tbl);
	a.lang = db.getLang();
	a.approot = approot;
	return a;
}

function getColumnSpec(col, tbl){
	let a = db.getColumnSpec(col, tbl);
	a.lang = db.getLang();
	return a;
}

module.exports = app;

