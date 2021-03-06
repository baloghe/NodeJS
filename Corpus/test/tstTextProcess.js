
/*
https://en.wikisource.org/wiki/The_Adventures_of_Sherlock_Holmes/The_Adventure_of_the_Speckled_Band
*/

const replaceRules = {
	remove: [ /\.(.*?[0-9]*)/g, /\,(.*?[0-9]*)/g, /\d+/g ],
	toSpace: [ /(<([^>]+)>)/ig, /[\W_]+/g ],
	toDelete: ['aren','ah','wasn','ve','tdd','tbd','pcs','pct','dr','re','foohsh','hkely','mr','mrs','roylotts','roylott','holmes','watson','hudson','grimesby','helen','honoria','westphail'],
	noValidPlurals: ['yes','was','this','series','researches','perhaps','metropolis','matches','lives','lies','ourselves','has','gives','goes','christmas','bushes','breaches','basis','alas','afterwards','dies'],
	specialPlurals: [
		{singular: 'mouse', plural: 'mice'}
	],
	noValidPasts: ['red','bed','led','fed','hundred'],
	specialPasts: [
		{present: 'eye', past: 'eyed'},
		{present: 'tie', past: 'tied'},
		{present: 'die', past: 'died'}
	],
	noValidLy: ['ally','untimely','supply','reply','fly','early','family'],
	specialLy: [
		{orig:'full', adjective: 'fully'}/*,
		{orig:'probable', adjective: 'probably'},
		{orig:'imperturbable', adjective: 'imperturbably'},*/
	],
	noValidIsh: ['fish','dish','wish','establish','parish','distinguish'],
	specialIsh: [
		{orig:'snake', adjective: 'snakish'}
	]
};

let TEXT_WORDS = null;			//Array of {pos: int, word: String, count: int}, includes both original words and Derivatives
let TEXT_ORIGS = null;			//Array of String
let TEXT_DERIVATIVES = null;	//Array of {word: String, orig: String, derived: String, rule: String}

let TEXT_META = {
	author: "Arthur Conan Doyle",
	title: "The Speckled Band",
	url: "https://en.wikisource.org/wiki/The_Adventures_of_Sherlock_Holmes/The_Adventure_of_the_Speckled_Band"
};

function JSONout(dstElem){
	let txt = "{\n"
			+ "meta: {\n"
			+ "  author: '" + TEXT_META.author + "',\n"
			+ "  title: '" + TEXT_META.title + "',\n"
			+ "  url: '" + TEXT_META.url + "\n"
			+ "},\n"
			+ "orig: {[" + TEXT_ORIGS.map(e=>"'"+e+"'").join(',')
			+ "]},\n"
			+ "derivatives: {[" + TEXT_DERIVATIVES.map(e=>(
					"{word:'"+e.word+"',"
					+"orig:'"+e.orig+"',"
					+"derived:'"+e.derived+"',"
					+"rule:'"+e.rule+"'}"
				)).join(',')
			+ "]}\n"
			+ "}"
			;
	
	$('#'+dstElem).val(txt);
}

function processText(txt){
	console.log(`processText :: txt.length=${txt.length} characters`);
	
	let m = new Map();
	
	let s = sanitize(txt);
	countWords(m, s.split(' '));
	let a = mapToArray(m, false);			//returned: Array of {pos: int, word: String, count: int}
	console.log(`distinct words: ${a.length}`);
	TEXT_ORIGS = a.map(e=>(e.word));
	
	let d = createDerivatives(a);			//returned: Array of {word: String, orig: String, derived: String, rule: String}
	console.log(`derivatives: ${d.length}`);
	countWords(m, d.map(e=>(e.word)));
	let x = mapToArray(m, false);
	
	a = sortArray(x);	
	
	console.log(`start rendering... number of distinct words: ${a.length}`);
	let html=$.templates('#tmplWordCount').render( {elems: a} );
	$('#dvOutput').html(html);
	
	//$('#dvOutput').append(a.map(e=>"'"+e.word+"'").join(','));
	
	TEXT_WORDS = a;
	TEXT_DERIVATIVES = d;
}

function createDerivatives(a){
	
	//plurals: end with a single (!) s
	let plurals = a
		.filter(e=>e.word.match(/.[^s][s]$/) && !e.word.match(/.[o][u][s]$/))
		.filter(e=>(replaceRules.noValidPlurals.indexOf(e.word) < 0
					&& replaceRules.specialPlurals.map(x=>x.past).indexOf(e.word) < 0))
		.map(e=>(removePlural(e.word, false)))
		;
	/*
	console.log('createDerivatives :: plurals');
	for(const e of plurals){
		console.log(`  ${e.orig} -> ${e.derivative}`);
	}
	*/
	
	//add special plural forms
	let specplurals = replaceRules.specialPlurals
		.filter(e=>( a.map(w=>w.word).indexOf(e.plural) >= 0 ))
		.map(e=>({"word":e.singular, "orig": e.plural, derived: "plural", rule: "special"}))
		;
	
	//regular past tense: ends with -ed
	let pasts = a
		.filter(e=>e.word.match(/.[e][d]$/) && (!e.word.match(/.[e][e][d]$/)))				//e.g. deed is not past tense!
		.filter(e=>(replaceRules.noValidPasts.indexOf(e.word) < 0
					&& replaceRules.specialPasts.map(x=>x.past).indexOf(e.word) < 0))
		.map(e=>(pastToPresent(e.word, false)))
		;
	/*
	console.log('createDerivatives :: pasts');
	for(const e of pasts){
		console.log(`  ${e.orig} -> ${e.derivative}`);
	}
	*/
	
	//add special past tenses
	let specpasts = replaceRules.specialPasts
		.filter(e=>( a.map(w=>w.word).indexOf(e.past) >= 0 ))
		.map(e=>({"word":e.present, "orig": e.past, derived: "past", rule: "special"}))
		;
		
	//adverbials of manner/probability: -ly removal
	let ly = a
		.filter(e=>e.word.match(/.[l][y]$/))
		.filter(e=>(replaceRules.noValidLy.indexOf(e.word) < 0
					&& replaceRules.specialLy.map(x=>x.adjective).indexOf(e.word) < 0))
		.map(e=>(removeLy(e.word, false)))
		;
	
	//add special -ly cases
	let speclys = replaceRules.specialLy
		.filter(e=>( a.map(w=>w.word).indexOf(e.adjective) >= 0 ))
		.map(e=>({"word":e.orig, "orig": e.adjective, derived: "adv.-ly", rule: "special"}))
		;
	
	//-ish removal
	let ish = a
		.filter(e=>e.word.match(/.[i][s][h]$/))
		.filter(e=>(replaceRules.noValidIsh.indexOf(e.word) < 0
					&& replaceRules.specialIsh.map(x=>x.adjective).indexOf(e.word) < 0))
		.map(e=>(removeIsh(e.word, false)))
		;
	
	//add special -ish cases
	let specish = replaceRules.specialIsh
		.filter(e=>( a.map(w=>w.word).indexOf(e.adjective) >= 0 ))
		.map(e=>({"word":e.orig, "orig": e.adjective, derived: "adv.-ish", rule: "special"}))
		;
	
	//merge result
	return plurals.concat(specplurals).concat(pasts).concat(specpasts).concat(ly).concat(speclys).concat(ish).concat(specish);
}

function removeIsh(word,verbose){
	if(verbose)console.log(`removeLy :: ${word}`);
	let ret = {"word":word, "orig": word, derived: "adv.-ish", rule: ""};
	
	ret.word = word.substr(0,word.length-3);
	ret.rule = "chop -ish";
	if(verbose)console.log(`  1: ${ret.rule}`);
	
	if(verbose)console.log(` ${word} -> ${ret}`);
	return ret;
}

function removeLy(word,verbose){
	if(verbose)console.log(`removeLy :: ${word}`);
	let ret = {"word":word, "orig": word, derived: "adv.-ly", rule: ""};
	
	if( word.match(/.[i][l][y]$/) ){				//speedily -> speedy
		ret.word = word.substr(0,word.length-3)+'y';
		ret.rule = "-ily to -y";
		if(verbose)console.log(`  1: ${ret.rule}`);
	} else if( word.match(/.[b][l][y]$/) ){			//regrettably -> regrettable
		ret.word = word.substr(0,word.length-1)+'e';
		ret.rule = "-bly to -ble";
		if(verbose)console.log(`  2: ${ret.rule}`);
	} else {
		ret.word = word.substr(0,word.length-2);
		ret.rule = "chop -ly";
		if(verbose)console.log(`  3: ${ret.rule}`);
	}
	
	if(verbose)console.log(` ${word} -> ${ret}`);
	return ret;
}

function pastToPresent(word, verbose){
	if(verbose)console.log(`pastToPresent :: ${word}`);
	let ret = {"word":word, "orig": word, derived: "past", rule: ""};
	
	if( word.match(/.[i][e][d]$/) ){
		ret.word = word.substr(0,word.length-3)+'y';					//change -ied to -y, e.g. satisfied -> satisfy BUT not tied, died!!
		ret.rule = "-ied to -y";
		if(verbose)console.log(`  1: ${ret.rule}`);
	} else if(   word.match(/.[nv][e][l][l][e][d]$/)					//panelled, travelled
			  || (1==0) ){												//??any other rule?
		ret.word = word.substr(0,word.length-3);
		ret.rule = "-elled to -el";
		if(verbose)console.log(`  2: ${ret.rule}`);
	} else if(   word.match(/.[a][i][lnr][e][d]$/)						//failed, gained, repaired
			  || word.match(/.[e][ai][lmnrt][e][d]$/)					//healed, screamed, gleaned, feared, veiled, heated, forfeited
			  || word.match(/.[e][e][d][e][d]$/)						//succeeded
			  || word.match(/.[u][r][l][e][d]$/) 						//hurled
			  || word.match(/.[o][u][r][e][d]$/) 						//poured
			  || word.match(/.[o][o][kml][e][d]$/)						//looked, boomed, fooled
			  || word.match(/.[eiu][l][l][e][d]$/)						//filled, hulled
			  || word.match(/.[m][u][r][e][d]$/) ){						//murmured
		ret.word = word.substr(0,word.length-2);
		ret.rule = "-XYZed to -XYZ";
		if(verbose)console.log(`  3: ${ret.rule}`);
	} else if(   word.match(/.[cbhl][o][n][e][d]$/)						//honed, cloned, boned, coned
			  || word.match(/.[e][ai][szv][e][d]$/)						//teased, seized, deceived
			  || word.match(/.[u][bp][l][e][d]$/)						//troubled, coupled
			  || word.match(/.[i][t][h][e][d]$/)						//writhed
			  || word.match(/.[a][i][s][e][d]$/)						//raised
			  || word.match(/.[r][t][l][e][d]$/) ){						//startled
		ret.word = word.substr(0,word.length-1);
		ret.rule = "-XYZed to -XYZe";
		if(verbose)console.log(`  4: ${ret.rule}`);
	} else if(   word.match(/.[p][p][e][d]$/)							//chopped chop
			  || word.match(/.[r][r][e][d]$/)							//parred par
			  || word.match(/.[b][b][e][d]$/)							//stabbed stab
			  || word.match(/.[d][d][e][d]$/)							//nodded nod
			  || word.match(/.[g][g][e][d]$/)							//dragged drag
			  || word.match(/.[t][t][e][d]$/)							//squatted squat
			  || word.match(/.[m][m][e][d]$/) ){						//trimmed trim
		ret.word = word.substr(0,word.length-3);
		ret.rule = "-XXed to -X";
		if(verbose)console.log(`  5: ${ret.rule}`);
	} else if(   word.match(/.[s][s][e][d]$/)							//passed
			  || word.match(/.[r][kl][e][d]$/)							//remarked, snarled
			  || word.match(/.[w][l][e][d]$/) ){						//crawled
		ret.word = word.substr(0,word.length-2);
		ret.rule = "-XYed to -XY";
		if(verbose)console.log(`  6: ${ret.rule}`);
	} else if(   word.match(/.[bgklnrt][cglsv][e][d]$/)					//enabled, mingled, speckled, convulsed, changed, pierced, forged, reserved, curved, revolved, startled
			  || word.match(/.[u][crs][e][d]$/) 						//deduced, assured, used
			  || word.match(/.[e][t][e][d]$/)							//completed
			  || word.match(/.[i][bcdglnrvz][e][d]$/)					//described, noticed, glided, obliged, smiled, examined, hired, deprived, recognized
			  || word.match(/.[o][ksv][e][d]$/)							//choked, closed, moved
			  || word.match(/.[a][cglmnprstvz][e][d]$/) ){				//faced, aged, tamed, waned, impaled, gaped, flared, based, hated, caved, glazed
		ret.word = word.substr(0,word.length-1);
		ret.rule = "-XYed to -XYe";
		if(verbose)console.log(`  7: ${ret.rule}`);
	} else if(   word.match(/.[u][e][d]$/)								//continued
			  || (1==0) ){												//??any other rule?
		ret.word = word.substr(0,word.length-1);
		ret.rule = "-ued to -ue";
		if(verbose)console.log(`  8: ${ret.rule}`);
	} else {
		ret.word = word.substr(0,word.length-2);
		ret.rule = "-ed to -";
		if(verbose)console.log(`  9: ${ret.rule}`);
	}
	
	if(verbose)console.log(`  ret=${ret}`);
	return ret;
}

function removePlural(word, verbose){
	if(verbose)console.log(`removePlural :: ${word}`);
	let ret = {"word":word, "orig": word, derived: "plural", rule: ""};
	
	if(word.match(/.[i][e][s]$/) ){
		ret.word = word.substr(0,word.length-3)+'y';
		ret.rule = "-ies to -y";
		if(verbose)console.log(`  1: ${ret.rule}`);
	} else if(word.match(/.[v][e][s]$/) ){
		ret.word = word.substr(0,word.length-3)+'f'
		ret.rule = "-ves to -f";
		if(verbose)console.log(`  2: ${ret.rule}`);
	} else {
		ret.word = word.substr(0,word.length-1);
		ret.rule = "chop -s";
		if(verbose)console.log(`  3: ${ret.rule}`);
	}
	
	if(verbose)console.log(`  ret=${ret}`);
	return ret;
}

function mapToArray(m,verbose){
	console.log(`mapToArray`);
	let raw = Array.from(m, function(e,i){
					if(verbose) console.log(`  ${i+1} -> word: ${e[0]}, count: ${e[1]}, length: ${e[0].length}`);
					return {pos:i+1,word:e[0],count:e[1]};
				});
	console.log(`  raw[0]: ${typeof raw[0]}, { pos: ${raw[0].pos}, word: ${raw[0].word}, count: ${raw[0].count} }`);
	return raw.filter(e => e.word.length > 1);
}

function sortArray(a){
	function f(a,b){
		return a.word < b.word
				? -1
				: 1
				;
	}
	return a.sort(f);
}

function countWords(m, arr){
	console.log('countWords');
	console.log(`  arr[0]: ${typeof arr[0]}, ${arr[0]}`);
	let x = 1;
	for(const w of arr){
		if(replaceRules.toDelete.indexOf(w) < 0){
			let cnt = m.get(w) || 0;
			m.set(w, cnt+1);
			x++;
		} else {
			//console.log(`excluded: ${w}`);
		}
		if(!(x%1000)){
			console.log(`  ${x}`);
		}
	}//next word
}

function sanitize(txt){
	
	let ret = txt;
	
	//removal
	for(const r of replaceRules.remove){
		ret = ret.replace(r,'');
	}//next replacement
	
	//replace with space
	for(const r of replaceRules.toSpace){
		ret = ret.replace(r,' ');
	}//next replacement
	
	//to lowercase
	ret = ret.toLowerCase();
	
	return ret;
}

$( document ).ready(function(){
	$('#btnProcess').unbind().click(
		function(evt){
			let txt = $('#taInput').val();
			processText(txt);
			
			JSONout("taJSONout");
		}
	);
});

