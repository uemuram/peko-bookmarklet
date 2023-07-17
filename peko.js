// 先頭および末尾の空白を削除する機能
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
}

//アルファベッドにマッチする正規表現
var reg1 = /[A-Za-z]+/i;

//一文字を受け取って、全角かどうかを判別
// "あ" → true
// "a"  → false
function isZenkaku(char){
	var c = char.charCodeAt(0);
	// Shift_JIS: 0x0 ～ 0x80, 0xa0 , 0xa1 ～ 0xdf , 0xfd ～ 0xff
	// Unicode : 0x0 ～ 0x80, 0xf8f0, 0xff61 ～ 0xff9f, 0xf8f1 ～ 0xf8f3
	if ( (c >= 0x0 && c < 0x81) || (c == 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
		return false;	//半角
	}else{
		return true;	//全角
	}
}

//置換対象外文字の定義
var excludeStr = ["。","、","っ","ッ","（","）","・","「","」","【","】","ー","～","！","？","☆","★","『","』","※","→","←","↑","↓","：","　",
                  "０","１","２","３","４","５","６","７","８","９","○","●","□","■","△","▲","▽","▼","×","＆","．","〒","－","＞","＜","♪",
                  "￥","＊","◆","◇","◎","÷","＝","…","％","＠","＋","─","／"];
//一文字を受け取って、置換対象外文字かどうかを判別0
// "。" → true
// "あ" → false
function isExcludeChar(char){
	var i=0;
	for(i=0;i<excludeStr.length;i++){
		if(char == excludeStr[i]){
			return true;
		}
	}
	return false;
}

//文字列を受け取って、homu化して返す
// "" → ""
// "a","ab"         → ho
// "abc","abcd"     → homu
// "abcde","abcdef" → homuho 
function abToHomu(str){
	var n = Math.round(str.length/2);
	var str2 = "";
	for(var i=0;i<n;i++){
		if(i%2==0){
			str2 += "ho";
		}else{
			str2 += "mu";
		}
	}
	return str2;
}

//文字列を受け取って、ほむ化して返す
// "" → ""
// "あ","ああ"         → ほむ
// "あああ","ああああ" → ほむほむ
function zenkakuToHomu(str){
	var len = str.length;
	if(len%2==1)len ++;		//長さを偶数にする
	len /= 2;				//半分にする
	var str2 = "";
	for(var i=0;i<len;i++){
		str2 += "ほむ";
	}
	return str2;
}

//文字列を受け取って、最初に出てくるアルファベッド部分を抽出する
//例) あ,い。、[うabcかきくdef。
//①str1 : あ,い。、[う     → ・・・
//②str2 : abc          → ほむ化
//③str3 : かきくdef。  → 自分を再度呼び出し
function pickAb(str){
	if(str.length>0){
		var str1,str2,str3;
		//文字列内のアルファベッドを探す
		var matchIdx = str.search(reg1);
		// str = str1 + str2 + str3に分解
		// "( あ,い。、[うabcかきくdef。" = "あ,い。、[う" + "abc" + "かきくdef。"
		if(matchIdx!=-1){
			str2 = str.match(reg1) + "";
			str1 = str.substring(0,matchIdx);
			str3 = str.substring(matchIdx+str2.length);
		}else{
			str1 = str;
			str2 = "";
			str3 = "";
		}
		return pickExclude(str1) + abToHomu(str2) + pickAb(str3);
	}else{
		return "";
	}
}

//文字列を受け取って、最初に出てくる置換対象外部分を抽出する
//例) ( あ,い。、[う
//①str1 : ( あ,い → 全角部分をほむ化
//②str2 : 。、    → 何もしない
//③str3 : [う     → 自分を再度呼び出し
function pickExclude(str){
	if(str.length>0){
		var str1,str2,str3;
		//開始位置、終了位置を調査
		var i;
		var startIdx=-1,endIdx=str.length;
		for(i=0; i<str.length; i++){
			var c = str.charAt(i);
			if(startIdx == -1){
				//まだ対象外文字列が見つかっていない場合
				if(isExcludeChar(c)) startIdx = i;
			}else{
				//対象外文字列が見つかっている場合
				if(!isExcludeChar(c)) {
					endIdx = i;
					break;
				}
			}
		}
		if(startIdx != -1){
			str1 = str.substring(0,startIdx);
			str2 = str.substring(startIdx,endIdx);
			str3 = str.substring(endIdx);
		}else{
			str1 = str;
			str2 = "";
			str3 = "";
		}
		return pickZenkaku(str1) + str2 + pickExclude(str3);
	}else{
		return "";
	}
}

//文字列を受け取って、最初に出てくる全角部分を抽出する
//例) /;:あいう;:,ああ
//①str1 : /;:     → 何もしない
//②str2 : あいう  → ほむ化
//③str3 : ;:,ああ → 自分を再度呼び出し
function pickZenkaku(str){
	if(str.length>0){
		var str1,str2,str3;
		//開始位置、終了位置を調査
		var i;
		var startIdx=-1,endIdx=str.length;
		for(i=0; i<str.length; i++){
			var c = str.charAt(i);
			if(startIdx == -1){
				//まだ対象外文字列が見つかっていない場合
				if(isZenkaku(c)) startIdx = i;
			}else{
				//対象外文字列が見つかっている場合
				if(!isZenkaku(c)) {
					endIdx = i;
					break;
				}
			}
		}
		if(startIdx != -1){
			str1 = str.substring(0,startIdx);
			str2 = str.substring(startIdx,endIdx);
			str3 = str.substring(endIdx);
		}else{
			str1 = str;
			str2 = "";
			str3 = "";
		}
		return str1 + zenkakuToHomu(str2) + pickZenkaku(str3);
	}else{
		return "";
	}
}

//文字列を受け取り、ほむ,homu化して返す
function toHomu(str){
	//文字列前後の空白を削除
	var str2 = str.trim();
	//文字列長が1以上の場合のみ変換を実施
	if(str2.length==0) return(str);
	return(pickAb(str));
}

//オブジェクトを受け取って文字列部分を置き換える
function replaceObj(r){
	var o,i=0;
	while(o=r.childNodes[i++]){
		replaceObj(o);
	}
	//現在のオブジェクトが文字列(nodeType3)だったときのみほむ化
	if(r.nodeType==3) {
		r.nodeValue=toHomu(r.nodeValue);
	}
}

//メイン部分
(function main(w){
	var o,i=0;
	//フレームが複数ある場合を考慮してmainを再帰的に実行
	while(o=w.frames[i++]) try{main(o)} catch(o){}
	//body内の文字列を変換
	replaceObj(w.document.body);
})(window);
