const fs = require('fs');

const MockDB = (function() {
    function MockDB() {
		//Being a mock database, a big JSON object is going to be read in
		const _spec = JSON.parse(fs.readFileSync('./public/data/spec.json'));
		
		this.getLang = function() {
			return {
				thHistCaption: "Document history",
				thTime: "Date",
				thAuthor: "Author",
				thModification: "Last modified",
				thAttrName: "Column",
				thContent: "Content",
				thHistorization: "Historization",
				thBusinessKeys: "Business keys",
				thType: "Type",
				thFormat: "Format",
				thTempTable: "Temporary",
				thFunction: "Function",
				thFuncParamName: "Parameter",
				thFuncParamType: "Type",
				thFuncParamDefault: "Default",
				thFuncParamDesc: "Description",
				thFuncReturnType: "Type",
				thFuncReturnLoad: "Load",
				where: "Filtering",
				join: "Join",
				keySet: "Keyset generation",
				sources: "Source",
				load: "Load",
				trnIf: "IF",
				trnThen: "THEN",
				trnElse: "ELSE",
				thLoad: "Load",
				braThen: "THEN",
				attributes: "Attributes",
				grouping: "Grouping",
				postCondition: "Post condition",
				functionParams: "Parameters",
				functionReturn: "Return"
			};
		};
		
        this.getMeta = function() {
            return _spec.meta;
        };
		
		this.enumTables = function() {
			return _spec.table.filter(e=>e.out).map(e=>e.name);
		};
		
		this.enumColumns = function() {
			return _spec.column.map(e=>e.name);
		};
		
        this.getTableSpec = function(tblName) {
			
			let errorList = [];
			
            let tblObj = _spec.table.filter(e=>(e.name===tblName))[0];
			if(tblObj == null){
				errorList.push(`No header information specified for requested table ${tblName}`);
			}
			
			let tblCols = _spec.column_to_table
						.filter(e=>(e.tables.indexOf(tblName) > -1))
						.map(e=>(_spec.column.filter(c=>(c.name===e.column))[0]))
						;
			if(tblCols == null || tblCols.length==0){
				errorList.push(`No columns listed for requested table ${tblName}`);
			}
			
			let tblSpecObj = _spec.table_spec
						.filter(e=>(e.name === tblName))[0]
						;
			if(tblSpecObj == null){
				errorList.push(`No specification provided for requested table ${tblName}`);
			}
			let tblKG = null;
			let tblKGSrc = null;
			let tblKGLoad = null;
			if(tblSpecObj != null && tblSpecObj.keyGen != null){
				tblKG = tblSpecObj.keyGen;
						
				tblKGLoad = tblKG.load;
				if( tblKG.source.collation == null ){
					//array of {alias:, table: [, whcl: [] ]}
					tblKGSrc = tblKG.source;
				} else {
					//a predefined join should be translated
					let coll = _spec.collation
							 .filter(e=>(e.name === tblKG.source.collation))[0]
							 ;
					//console.log(`  collation: ${coll.type}, length: ${coll.content.length}`);
					tblKGSrc = coll;
				}
			}//key generation
			//console.log(`getTableSpec :: tableName=${tblObj.name}, tblCols.length=${tblCols.length}`);
			//console.log(`getTableSpec :: tableName=${tblObj.name}, 1st col: ${tblCols[0].name}: ${tblCols[0].type}`);
			//console.log(`getTableSpec :: tblKG=${JSON.stringify(tblKG)}`);
			
			let ret = {
				tableName: tblObj.name,
				header: {
					content: tblObj.desc,
					historization: tblObj.historization,
					businessKeys: tblObj.keys
				},
				errorList: errorList
			};
			if(tblKG != null && tblKGSrc != null && tblKGLoad != null){
				ret.keyGen = {source: tblKGSrc, load: tblKGLoad};
			}
			if(tblCols != null){
				ret.attributes = tblCols;
			}
			
			return ret;
        };
		
        this.getColumnSpec = function(colName, tblName) {
			/* Column is part of the business key in that table => should be looked for in the table specification
				Otherwise it is
					either part of a "multidef" page (that defines more than one column at once sharing the same sources and approach)
					or has a proper "source" definition and a "load"
			*/
			let tblNameUse = tblName || _spec.column_to_table.filter(e=>(e.column===colName))[0].tables[0];
			
			let errorList = [];
			
			let tblObj = _spec.table.filter(e=>(e.name===tblNameUse))[0];
			if(tblObj != null && tblObj.keys != null){
				//business key => render the table spec, that should contain the specification of key columns
				let ret = this.getTableSpec(tblNameUse);
				ret.useTemplate = 'tblSpec';
				return ret;
			}
			
			let colHead = _spec.column.filter(e=>(e.name===colName))[0];
			if(colHead==null){
				errorList.push(`No header defined for requested column ${colName}`);
			}
			colHead.tables = _spec.column_to_table
							.filter(e=>(e.column===colName))[0]
							.tables
							;
			if(colHead.tables==null){
				errorList.push(`Column ${colName} does not appear in any table!`);
			}
			let colSpecObj = _spec.column_spec
						.filter(e=>(e.column===colName))[0]
						;
						
			let colSpecObjTbl = null;
			if(colSpecObj == null){
				errorList.push(`No existing specification for requested column ${colName}`);
			} else if(colSpecObj.tables == null){
				errorList.push(`Specification of column ${colName} is not broken down by columns!`);
			} else {
				let colSpecObjTbl = colSpecObj.tables.filter(e=>(e.table===tblNameUse))[0];
				if(colSpecObjTbl.length==0){
					errorList.push(`Specification missing for requested column ${colName} in table ${tblNameUse}`);
				}
			}
			
			//console.log(`colHead :: ${JSON.stringify(colHead)}`);
			//console.log(`colSpecObjTbl :: ${JSON.stringify(colSpecObjTbl)}`);
			if(colSpecObjTbl != null && colSpecObjTbl.multidef != null){
				//TBD: render multidef template
				
				let mdBlocks = _spec.multidef
							 .filter(e=>(e.name === colSpecObjTbl.multidef))[0]
							 .blocks
							 ;
				
				//wherever a block is referencing a predefined collation, the reference should be replaced by the actual source definition
				mdBlocks = mdBlocks.map(function (e){
								if(e.source != null){
									if(e.source.collation != null){
										let collatName = e.source.collation;
										let c = _spec.collation.filter(x=>(x.name===collatName))[0]
											  ;
										//console.log(`mdBlocks :: block type=${e.type} -> collatName=${collatName} -> length: ${c.length}`);
										if(c==null || c.length==0){
											errorList.push(`${tblNameUse}.${colName}: Collation ${collatName} referenced in 'multidef' ${colSpecObjTbl.multidef} is not defined!`);
										}
										e.source = c;
									}
								}
								return e;
							})
							 ;
				
				let ret = {
							tableName: tblNameUse,
							header: colHead,
							blocks: mdBlocks,
							useTemplate: 'multiDef',
							errorList: errorList
						};
				//console.log(`  multidef: header.tables.length=${ret.header.tables.length}`);
				return ret;
			} else if(colSpecObjTbl != null) {
				//TBD: render "vanilla" source+load template which resuses templates from table spec => some transformation is needed
				
				let colSrc = null;
				if( colSpecObjTbl.source.collation == null ){
					//array of {alias:, table: [, whcl: [] ]}
					colSrc = colSpecObjTbl.source;
					if(colSpecObjTbl.source==null){
						errorList.push(`${tblNameUse}.${colName}: source is not defined!`);
					}
				} else {
					//a predefined collation should be translated
					let coll = _spec.collation
							 .filter(e=>(e.name === colSpecObjTbl.source.collation))[0]
							 ;
					if(coll==null || coll.length==0){
						errorList.push(`${tblNameUse}.${colName}: Referenced collation ${colSpecObjTbl.source.collation} is not defined!`);
					}
					//console.log(`  collation: ${coll.type}, length: ${coll.content.length}`);
					colSrc = coll;
				}
				
				let ret = {
							tableName: tblNameUse,
							columnName: colName,
							header: colHead,
							block: {source: colSrc, load: [{column: colName, load: colSpecObjTbl.load}]},
							useTemplate: 'colSpecSimple',
							errorList: errorList
						};
				return ret;
			} else {
				return { errorList: errorList };
			}
        };
		
    }

    return MockDB;
}());

const db = new MockDB();

module.exports = db;
