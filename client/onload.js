var canvas = document.getElementById('canvas');
var stage = new createjs.Stage(canvas);
stage.width = canvas.getAttribute('width');
stage.height = canvas.getAttribute('height');
stage.enableMouseOver();
//stage.addChild(shape);
var load = function(onComplete){
    var queue = new createjs.LoadQueue();
    queue.addEventListener("complete", handleComplete);
    queue.loadManifest([
      {id:"qipan", src:"res/qipan.png"},
      {id:"rk", src:"res/rk.png"},
      {id:"rs", src:"res/rs.png"},
      {id:"wk", src:"res/wk.png"},
      {id:"ws", src:"res/ws.png"}
    ]);
    var loadingText = new createjs.Text('Loading...');
    loadingText.x = stage.width/2 - loadingText.getMeasuredWidth()/2;
    loadingText.y = stage.height/2 - loadingText.getMeasuredHeight()/2;
    stage.addChild( loadingText );
    function handleComplete() {
      loadingText.parent.removeChild(loadingText);
      onComplete && onComplete(queue);
    }
};

load(function(res){
  window.res = res;
  vex.defaultOptions.className = 'vex-theme-flat-attack';
  vex.defaultOptions.escapeButtonCloses = false;
  vex.defaultOptions.overlayClosesOnClick = false;

  var game = new Game(stage, res);

  var room = location.search && location.search.split('?')[1];
  var peerOption = {
//  debug: 3,
    key: '2s9y01le8ao1dcxr'
//    host: '192.168.3.77'
  };
  vex.dialog.open({
    message: '请稍候...',
    escapeButtonCloses: false,
    showCloseButton: false,
    overlayClosesOnClick: false,
    buttons: []
  });
  var peer = new Peer(peerOption);
  function onConnectionClose(){
      vex.dialog.alert({
        message: '与对方的链接中断',
        escapeButtonCloses: false,
        showCloseButton: false,
        bottons: [{
          text: 'OK',
          type: 'button',
          className: 'vex-dialog-button-secondary',
          click: function() {
          }
        }],
        callback: function(){
          var s = location.search;
          var h = location.href;
          if ( s && h.indexOf(s) > -1 ){
            h = h.slice(0, h.indexOf(s));
          }
          location.href = h;
        },
        overlayClosesOnClick: false
      });
  }
  peer.on('open', function(id){
    if ( room ){
    }else{
      vex.close();
      room = id;
      $dialog = vex.dialog.prompt({
        message: '请把邀请链接发送给朋友',
        buttons: [],
        escapeButtonCloses: false,
        showCloseButton: false,
        input: '<input class="invite-link" value="' + location.href+ '?' + id + '">',
        overlayClosesOnClick: false
      });
      console.log(location.href+ '?' + id);
    }
  });
  if ( room ){
    game.init(2);
    conn = peer.connect(room);
    game.setOpponent(conn);
    conn.on('close', onConnectionClose);
    conn.on('open', function(){
      console.log('connect to ', room);
      conn.send([10010]);
    });
  }else{
    game.init(1);
    peer.on('connection', function(conn) {
      if ( peer.connections.length ){
        conn.close();
        return;
      }
      console.log('get connection', conn);
      game.setOpponent(conn);
      game.show();
      conn.on('close', onConnectionClose);
    });
  }
});
createjs.Ticker.addEventListener("tick", function(){
  stage.update();
});
