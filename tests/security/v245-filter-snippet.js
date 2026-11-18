var _BAD_NAME=/[<>"'`\u0000-\u001f\u007f]/,_BAD_REMOTE=/[<>"`\u0000-\u001f\u007f]/g,NAME_MAX=24;
function _nameError(n){
  if(!n)return 'Vul een naam in.';
  if(_BAD_NAME.test(n))return 'Een naam mag geen < > " \' of ` bevatten.';
  if(n.length>NAME_MAX)return 'Een naam mag maximaal '+NAME_MAX+' tekens zijn.';
  return '';
}
function _remoteNameOk(n){return typeof n==='string'&&n.length>0&&n.length<=60&&n.trim()===n&&!/[<>"`\u0000-\u001f\u007f]/.test(n);}
function _safeId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);}
function _scrub(v,d){
  d=d||0;if(d>12)return null;
  if(typeof v==='string')return v.replace(_BAD_REMOTE,'').slice(0,4000);
  if(typeof v==='number')return isFinite(v)?v:0;
  if(typeof v==='boolean'||v===null)return v;
  if(Array.isArray(v))return v.map(function(x){return _scrub(x,d+1);});
  if(v&&typeof v==='object'){var o={};Object.keys(v).forEach(function(k){var ck=k.replace(_BAD_REMOTE,'');if(ck)o[ck]=_scrub(v[k],d+1);});return o;}
  return null;
}
function _scrubPlayer(p){return (p&&typeof p==='object')?_scrub(p):p;}
function _mkey(e){if(!e)return '';if(e.gid)return 'g:'+e.gid;return 'k:'+[e.ts||'',e.date||'',e.gameType||'',e.darts||0,e.score||0,e.won?1:0,(e.opponents||[]).join('/'),e.legResult||''].join('|');}
