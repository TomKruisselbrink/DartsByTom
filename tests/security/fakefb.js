(function(){
  // Minimal Firestore compat fake; state shared across pages via window.__bus (exposed by Playwright)
  var listeners=[];
  function bus(){return window.__fsBus;}
  function docRef(path){
    return {
      id:path.split('/').pop(),
      collection:function(c){return colRef(path+'/'+c);},
      set:function(d,o){return window.__fsSet(path,JSON.stringify(d),!!(o&&o.merge)).then(function(){});},
      delete:function(){return window.__fsDel(path).then(function(){});},
      get:function(){return window.__fsGet(path).then(function(v){return {exists:v!=null,data:function(){return v?JSON.parse(v):null;},id:path.split('/').pop()};});},
      onSnapshot:function(cb){var l={type:'doc',path:path,cb:cb};listeners.push(l);window.__fsGet(path).then(function(v){cb({exists:v!=null,data:function(){return v?JSON.parse(v):null;}});});return function(){listeners.splice(listeners.indexOf(l),1);};}
    };
  }
  function colRef(path){
    return {
      doc:function(id){return docRef(path+'/'+id);},
      onSnapshot:function(cb){var l={type:'col',path:path,cb:cb};listeners.push(l);
        window.__fsList(path).then(function(arr){cb({docChanges:function(){return arr.map(function(x){return {type:'added',doc:{id:x[0],data:function(){return JSON.parse(x[1]);}}};});},forEach:function(f){arr.forEach(function(x){f({id:x[0],data:function(){return JSON.parse(x[1]);}});});}});});
        return function(){listeners.splice(listeners.indexOf(l),1);};},
      get:function(){return Promise.resolve({docs:[],forEach:function(){}});},
      where:function(){return this;},orderBy:function(){return this;},limit:function(){return this;}
    };
  }
  window.__fsEvent=function(kind,path,val){
    listeners.forEach(function(l){
      var parent=path.substring(0,path.lastIndexOf('/'));
      if(l.type==='col'&&l.path===parent){l.cb({docChanges:function(){return [{type:kind,doc:{id:path.split('/').pop(),data:function(){return val?JSON.parse(val):null;}}}];}});}
      if(l.type==='doc'&&l.path===path){l.cb({exists:val!=null,data:function(){return val?JSON.parse(val):null;}});}
    });
  };
  var fs={collection:function(c){return colRef(c);},batch:function(){var ops=[];return {set:function(r,d,o){ops.push(function(){return r.set(d,o);});},delete:function(r){ops.push(function(){return r.delete();});},commit:function(){return ops.reduce(function(p,f){return p.then(f);},Promise.resolve());}};}};
  var FV={arrayUnion:function(){return {__au:[].slice.call(arguments)};},arrayRemove:function(){return {__ar:[].slice.call(arguments)};},serverTimestamp:function(){return Date.now();}};
  var firestore=function(){return fs;};firestore.FieldValue=FV;
  var U=window.__fakeUser||null;var _acb=[];var authObj={onAuthStateChanged:function(cb){_acb.push(cb);setTimeout(function(){cb(U);},window.__authDelay||0);return function(){};},createUserWithEmailAndPassword:function(e){var u={uid:'uNew',email:e};U=u;authObj.currentUser=u;setTimeout(function(){_acb.forEach(function(c){c(u);});},50);return Promise.resolve({user:u});},currentUser:U,signOut:function(){return Promise.resolve();}};var auth=function(){return authObj;};
  window.firebase={initializeApp:function(){return {};},firestore:firestore,auth:auth,apps:[]};
})();
