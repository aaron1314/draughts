function Pieces(x, y){
  this.width = 60;
  this.height = 60;
  this.playerId = 0;//0 blank 1 p1 2 p2
  createjs.Container.call(this);
  var p = new createjs.Shape();
  p.graphics.beginFill('#000000').drawCircle(this.width/2, this.width/2, 30);
  this.bg = p;
  this.addChild( p );


  this.hoverFlag = new createjs.Shape();
  this.hoverFlag.x = (this.width-48)/2;
  this.hoverFlag.y = (this.width-48)/2;
  this.hoverFlag.graphics.beginStroke('#ffffff').rect(0, 0, 48, 48).endStroke();
  this.addChild( this.hoverFlag );

  //left0,right0
  this.posX = x;
  this.posY = y;
  this.isKing = false;
  this.clearHover();
  this.addEventListener('_move', _.bind(this._onMove, this));
  this.addEventListener('mouseover', _.bind(this.setHover, this));
  this.addEventListener('mouseout', _.bind(this.clearHover, this));
}
Pieces.prototype = new createjs.Container();
Pieces.prototype.constructor = Pieces;
Pieces.prototype.setKing = function(){
  if ( this.playerId == 1 ){
    this.bg.image = res.getResult('rk');
    this.isKing = true;
  }else if ( this.playerId == 2 ){
    this.bg.image = res.getResult('wk');
    this.isKing = true;
  }
};
Pieces.prototype.setHover = function(){
  this.hoverFlag.visible = true;
};
Pieces.prototype.clearHover = function(){
  this.hoverFlag.visible = false;
};
Pieces.prototype.setBlank = function(){
  this.bg.alpha = 0.01;
};
Pieces.prototype.setPlayer1 = function(){
  var parent = this.bg.parent;
  parent && parent.removeChild(this.bg);
  this.bg = new createjs.Bitmap(res.getResult('rs'));
  this.bg.x = this.bg.y = ( this.width - this.bg.image.width )/2;
  parent && parent.addChild(this.bg);
};
Pieces.prototype.setPlayer2 = function(){
  var parent = this.bg.parent;
  parent && parent.removeChild(this.bg);
  this.bg = new createjs.Bitmap(res.getResult('ws'));
  this.bg.x = this.bg.y = ( this.width - this.bg.image.width )/2;

  parent && parent.addChild(this.bg);
};
Pieces.prototype._onMove = function(){
  this.x = this.posX * this.width;
  this.y = this.posY * this.width;
};

function PlayerBoard(playerId){
  createjs.Container.call(this);

  this.width = 70;
  this.height = 100;
  if(playerId == 1){
    this.avatar = new createjs.Bitmap(res.getResult('rs'));
  }else if ( playerId == 2){
    this.avatar = new createjs.Bitmap(res.getResult('ws'));
  }else{
    throw 'playerid error'
  }
  this.avatar.y = this.avatar.x = 10;
  this.addChild( this.avatar );

  this.status = new createjs.Text('undefined');
  this.status.y = 70;
  this.addChild( this.status );
  this.setStatus('');
}
PlayerBoard.prototype = new createjs.Container();
PlayerBoard.prototype.constructor = PlayerBoard;
PlayerBoard.prototype.setStatus = function(text){
  this.status.text = text;

  this.status.x = (this.width - this.status.getMeasuredWidth())>>1;
};

function GameBoard(){
  createjs.Container.call(this);
  var w = 60;
  this.height = this.width = 535;
  this.regY = this.regX = this.width/2;
  var bg = new createjs.Bitmap(res.getResult('qipan'));
  this.addChild( bg );
  bg.cache(0, 0, w * 10, w * 10);

  this.pieceContainer = new createjs.Container();
  this.pieceContainer.x = 27;
  this.pieceContainer.y = 27;
  this.addChild(this.pieceContainer);
}
GameBoard.prototype = new createjs.Container();
GameBoard.prototype.constructor = GameBoard;
GameBoard.prototype.addPiece = function(p){
  this.pieceContainer.addChild(p);
};


function Game(stage){
  this.myId = 1;
  this.stage = stage;
  this.pieces = [];
  //0 not ready 1 connecting
  // 11 等待p1操作 12等待p2操作
  // 20 游戏结束
  this.status = 0;
  this.showWait();

  this.stage.x = 40;

  this.board = new GameBoard();
  this.stage.addChild( this.board );

  this.board.x = 350;
  this.board.y = 300;

  this.p1Board = new PlayerBoard(1);
  this.stage.addChild( this.p1Board );

  this.p2Board = new PlayerBoard(2);
  this.stage.addChild( this.p2Board );


  this.hide();
}
Game.prototype = {
  constructor: Game,
  init: function(playerId){

    var left = {
      x: 0, y: 180
    };
    var right = {
      x: 650, y: 360
    };
    if ( playerId == 1 ){
      this.setPlayer1();
      this.p1Board.set(right);
      this.p2Board.set(left);
    }else{
      this.setPlayer2();
      this.p1Board.set(left);
      this.p2Board.set(right);
      this.board.rotation = 180;
    }
    //
    //this.startWithPlayer2();
  },
  show: function(){
    this.board.visible = this.p1Board.visible = this.p2Board.visible = true;
    $("#log").show();
  },
  hide: function(){
    this.board.visible = this.p1Board.visible = this.p2Board.visible = false;
    $("#log").hide();
  },
  getPlayerPiece: function(x, y){
    for(var i = 0;i < this.pieces.length;i ++){
      if ( this.pieces[i].playerId != 0 &&  this.pieces[i].posX == x
        && this.pieces[i].posY == y ){
        return this.pieces[i];
      }
    }
    return null;
  },
  removePiece: function(p){
    p.parent.removeChild(p);
    var i = _.indexOf(this.pieces, p);
    if ( i >= 0 ){
      this.pieces.splice(i, 1);
    }
  },
  movePiece: function(piece, pos, sync){
    if( !this.getPlayerPiece(pos.x, pos.y) ){
      if (sync !== false)
        this.sendMessage([30010, piece.posX, piece.posY, pos.x, pos.y]);

      piece.posX = pos.x;
      piece.posY = pos.y;
      piece.dispatchEvent('_move');
    }
  },
  /**
   * 吃子
   * @param piece 移动的棋子
   * @param capturedPiece 被吃掉的
   * @param pos 目的位置
   * @param [sync]
   */
  capturePiece: function(piece, capturedPiece, pos, sync){
    this.removePiece(capturedPiece);
    if ( sync !== false ){
      this.sendMessage([30020, piece.posX, piece.posY
        , capturedPiece.posX, capturedPiece.posY
        , pos.x, pos.y]);
    }

    this.movePiece(piece, pos, false);
  },
  _checkControlEnable: function(){
    return this.myId === 1 && this.status === 11 ||
      this.myId === 2 && this.status === 12;
  },
  /**
   * 只检测方向
   * @param piece
   * @param to
   * @returns {boolean}
   * @private
   */
  _checkMoveDirection: function(piece, to){
    if ( piece.playerId == 1 && to.y - piece.posY == -1 ||
      piece.playerId == 2 && to.y - piece.posY == 1){
      if ( Math.abs(piece.posX - to.x) == 1 ){
        return true;
      }
    }else if ( piece.isKing && (Math.pow(piece.posX - to.x, 2) + Math.pow(piece.posY - to.y,2) == 2)){
      return true;
    }
    return false;
  },
  /**
   * 检测移动方向和距离是否合法
   * @param piece
   * @param to
   * @returns {boolean}
   * @private
   */
  _checkMoveStep: function(piece, to){
    if( to.x < 0 || to.x >= 8 || to.y < 0 || to.y >= 8 ){
      return false;
    }
    if ( this.getPlayerPiece(to.x, to.y) ){
      return null;
    }

    return this._checkMoveDirection(piece, to);
  },
  /**
   * 计算a，b之间的空格、棋子个数.不包含ab
   * @param a
   * @param b
   * @private
   */
  _countIntersect: function(a, b){
    var minX = _.min([a.x, b.x]);
    var maxX = _.max([a.x, b.x]);
    var minY = _.min([a.y, b.y]);
    var maxY = _.max([a.y, b.y]);
    var blankCount = 0;
    var pieceCount = 0;
    var pieceList = [];
    for(var i = minX+1;i < maxX;i ++){
      for(var t = minY+1;t < maxY; t++){
        if ( this.getPlayerPiece(i, t) ){
          pieceCount++;
          pieceList.push(this.getPlayerPiece(i, t));
        }else{
          blankCount++;
        }
      }
    }
    return {
      blank: blankCount,
      piece: pieceCount,
      pieceList: pieceList
    }
  },
  /**
   * 检测到某个点是否可以吃子
   * @param piece
   * @param to
   * @returns {*}
   * @private
   */
  _checkCapture: function(piece, to){
    if( to.x < 0 || to.x >= 8 || to.y < 0 || to.y >= 8 ){
      return null;
    }
    if ( this.getPlayerPiece(to.x, to.y) ){
      return null;
    }

    //落点距离一定是 sqrt8
    if (Math.pow(to.x - piece.posX, 2) + Math.pow(to.y - piece.posY, 2) != 8){
      return null;
    }

    var intersect = this._countIntersect({
      x: piece.posX, y: piece.posY
    }, to);
    var capturedPiece = intersect.pieceList[0];
    //英国跳棋只能吃相邻的
    //被吃掉的子应该在移动范围内
    if ( capturedPiece
      //只能吃对手的棋子。传入的piece可能是对手的
      && capturedPiece.playerId == (piece.playerId ==1?2:1)
      && this._checkMoveDirection(piece, {x: capturedPiece.posX, y: capturedPiece.posY}) ){
      return capturedPiece;
    }else{
      return null;
    }
  },
  _onBlankClick: function(e){
    if ( !this._checkControlEnable() ){
      return;
    }

    if ( !this.holdPiece ){
      return;
    }

    //移动
    var hp = this.holdPiece;
    var target = {
      x: e.target.posX,
      y: e.target.posY
    };
    var moveInvalid = !this._checkMoveStep(hp, target);

    //连跳只能吃子
    if ( moveInvalid || this.continuousStep || this.needsCapture ){
      //判断吃子
      var capturedPiece = this._checkCapture(hp, target);
      //英国跳棋只能吃相邻的
      //被吃掉的子应该在移动范围内
      if ( capturedPiece ){
        this.capturePiece(hp, capturedPiece, target);
        this._captureEnd();
      }
    }else{
      this.movePiece(hp, target);
      this.endTurn();
    }
  },
  _findSquareToMove: function(piece){
    for(var x = -1;x <= 1;x += 2){
      for(var y = -1;y <= 1;y += 2){
        if ( this._checkMoveStep(piece, {
          x: piece.posX + x,
          y: piece.posY + y
        }) ){
          return {x: piece.posX + x, y: piece.posY + y};
        }
      }
    }
    return null;
  },
  _findPieceToCapture: function(piece){
    for(var x = -2;x <= 2;x += 4){
      for(var y = -2;y <= 2;y += 4){
        if ( this._checkCapture(piece, {
          x: piece.posX + x,
          y: piece.posY + y
        }) ){
          return {x: piece.posX + x, y: piece.posY + y};
        }
      }
    }
    return null;
  },
  /**
   * 是否需要连跳
   * @private
   */
  _captureEnd: function(){
    //是否连跳
    if ( this._findPieceToCapture(this.holdPiece) ){
      this.log('连跳');
      this.continuousStep = true;
    }else{
      this.endTurn();
    }
  },
  _onPieceClick: function(e){
    if( !this._checkControlEnable() ){
      this.log('没轮到你点的');
      return;
    }
    var piece = e.target;
    if ( piece.playerId === 0 ){
      this._onBlankClick(e);
      return;
    }

    //连跳过程不允许更换持子
    if ( this.continuousStep ){
      return;
    }

    var that = this;
    if ( piece.playerId != this.myId ){
      this.log('不是你的棋');
      return;
    }

    var p, needsCapture = false;
    for(var x = 0;x < 8; x++){
      for(var y = 0;y < 8;y++){
        p = this.getPlayerPiece(x, y);
        if (p && p.playerId === this.myId){
          //无法移动仍然游戏结束
          if ( this._findPieceToCapture(p) ){
            needsCapture = true;
            break;
          }
        }
      }
      if ( needsCapture ){
        break;
      }
    }
    if ( needsCapture && !this._findPieceToCapture(piece) ){
      this.info('Jump required!');
      return;
    }

    this.needsCapture = needsCapture;
    this.holdPiece && this.holdPiece.clearHover();
    this.holdPiece = piece;
    this.holdPiece.setHover();

  },
  _createPieces: function(x, y, playerId){
    var p = new Pieces(x, y);
    p.playerId = playerId;

    this.my = p.playerId === this.myId;

    switch ( playerId ){
      case 0://落子点标记
        p.setBlank();
        break;
      case 1:
        p.setPlayer1();
        break;
      case 2:
        p.setPlayer2();
        break;
    }

    p.addEventListener('click', _.bind(this._onPieceClick, this));
    p.addEventListener('mouseout', _.bind(function(){
      if( this.holdPiece == p ){
        this.holdPiece.setHover();
      }
    }, this));
    this.pieces.push(p);
    this.board.addPiece(p);
    return p;
  },
  _createBlankSquare: function(){
    var p;
    for(var i = 0;i < 8;i ++){
      for(var t = 0; t < 8; t ++){
        if ( i + t & 1 ){
          p = this._createPieces(i, t, 0);
          p.dispatchEvent('_move');
        }
      }
    }
  },
  _createPlayer1Pieces: function(){
    //创建者始终是p1
    var p;
    for(var i = 0;i < 8;i ++){
      for(var t = 5; t < 8; t ++){
        if ( i + t & 1 ){
          p = this._createPieces(i, t, 1);
          p.dispatchEvent('_move');
        }
      }
    }
  },
  _createPlayer2Pieces: function(){
    var p;
    for(var i = 0;i < 8;i ++){
      for(var t = 0; t < 3; t ++){
        if ( i + t & 1 ){
          p = this._createPieces(i, t, 2);
          p.dispatchEvent('_move');
        }
      }
    }
  },
  showWait: function(){
  },
  beginTurn: function(){
    if ( this.myId == 1 ){
      this.status = 11;
      this.p1Board.setStatus('Turn');
      this.p2Board.setStatus('');
    }else{
      this.status = 12;
      this.p2Board.setStatus('Turn');
      this.p1Board.setStatus('');
    }
  },
  endTurn: function(){
    this.log('turn end');
    //兵的升级
    var p;
    for(var x = 0;x < 8;x ++){
      //this.myId = 1 || 2, y = 0 || 7
      p = this.getPlayerPiece(x, (this.myId - 1) * 7);
      if ( p && !p.isKing && p.playerId == this.myId ){
        p.setKing();
        this.sendMessage([30030, p.posX, p.posY]);
      }
    }
    this.continuousStep = false;
    this.needsCapture = false;
    this.holdPiece && this.holdPiece.clearHover();
    this.holdPiece = null;

    //游戏结束
    var gameOver = true;
    for(var x = 0;x < 8; x++){
      for(var y = 0;y < 8;y++){
        p = this.getPlayerPiece(x, y);
        if (p && p.playerId === this.opponentId){
          //无法移动仍然游戏结束
          if ( this._findPieceToCapture(p)
            || this._findSquareToMove(p) ){

            gameOver = false;
          }
        }
      }
    }

    if ( gameOver ){
      this.log('游戏结束');
      this.status = 20;
      this.gameEnd(true);
      this.sendMessage([40010]);
    }else{
      if ( this.myId == 1 ){
        this.status = 12;
        this.p1Board.setStatus('');
        this.p2Board.setStatus('Turn');
        this.sendMessage([20030]);
      }else{
        this.status = 11;
        this.p1Board.setStatus('Turn');
        this.p2Board.setStatus('');
        this.sendMessage([20020]);
      }
    }
  },
  onPiecesUpdate: function(){

  },
  onConnect: function(info){

  },
  onDisconnect: function(){
    this.showWait();
  },
  /**
   *
   * @param data
   */
  onMessage: function(data){
    this.log.apply(this,data);
    switch( data[0] ){
      case 10010://请求连接游戏
        if ( this.status === 0 ){
          this.sendMessage([10011]);
          this.gameStart();
          vex.close();
        }else{
          this.sendMessage([10012]);
        }
        break;
      case 10011://允许开始游戏
        this.log('连接成功');
        this.show();
        break;
      case 10012://无法与对方开始游戏
        this.log('无法与对方开始游戏');
        break;
      case 20010://初始化游戏
        vex.close();
        this.startWithPlayer1();
        break;
      case 20020://p1开始,只有p1能收到这个消息
        this.log('p1');
        this.beginTurn();
        break;
      case 20030://p2开始,只有p2能收到这个消息
        this.log('p2');
        this.beginTurn();
        break;
      case 30010://移动
        var p = this.getPlayerPiece(data[1], data[2]);
        if (p){
          this.movePiece(p, {x: data[3], y: data[4]}, false);
        }else{
          this.error('错误的命令', data);
        }
        break;
      case 30020://跳吃
        var pa = this.getPlayerPiece(data[1], data[2]);
        var pb = this.getPlayerPiece(data[3], data[4]);
        this.capturePiece(pa, pb, {x: data[5], y: data[6]}, false);
        break;
      case 30030://兵升级
        var p = this.getPlayerPiece(data[1], data[2]);
        p.setKing();
        break;
      case 40010://游戏结束,我输了
        this.gameEnd(false);
        break;
    }
  },
  _startGame: function(){
    this.pieces.forEach(function(p){
      p.parent && p.parent.removeChild(p);
    });
    this.pieces.length = 0;
    this.continuousStep = false;
    this.needsCapture = false;
    this._createBlankSquare();
    this._createPlayer1Pieces();
    this._createPlayer2Pieces();
  },
  startWithPlayer2: function(){
    //发送初始化的数据
    this._startGame();
    //开始选择棋子
    this.status = 11;

    this.p1Board.setStatus('Turn');
    this.p2Board.setStatus('');

  },
  startWithPlayer1: function(){
    this._startGame();
    //等待对方走
    this.status = 11;
    this.p1Board.setStatus('Turn');
    this.p2Board.setStatus('');
  },
  setOpponent: function(conn){
    this._opponentConn = conn;
    conn.on('data', _.bind(this.onMessage, this));
  },
  sendMessage: function(msg){
    this.log('send', msg);
    this._opponentConn.send(msg);
  },
  setPlayer1: function(){
    this.myId = 1;
    this.opponentId = 2;
  },
  setPlayer2: function(){
    this.myId = 2;
    this.opponentId = 1;
  },
  ready: function(){
    this.status = 0;
  },
  gameStart: function(){
    if ( this.myId == 1 ){
      this.startWithPlayer2();
      this.sendMessage([20010])
    }else{
      this.log('等待对方开始');
    }
  },
  gameRestart: function(){
    this.gameStart();
  },
  gameEnd: function(winner){
    winner?this.log('我赢了'):this.log('我输了');
    this.status = 20;
    var options = {
      message: winner?'我赢啦！': '你输了。',
      escapeButtonCloses: false,
      showCloseButton: false,
      overlayClosesOnClick: false,
      callback: _.bind(this.gameRestart, this)
    };
    if ( this.myId == 2 ){
      options.buttons = [];
      options.message += '请等待对方重新开始。'
    }else{
      options.buttons = [{
          text: 'OK',
          type: 'button',
          className: 'vex-dialog-button-primary',
          click: function($vexContent, event) {
            $vexContent.data().vex.value = false;
            return vex.close($vexContent.data().vex.id);
          }
      }];
      options.message += '是否重新开始？';
    }
    vex.dialog.open(options);
  },
  console: function(flag, args){
    if ( typeof console != undefined && typeof console[flag] == 'function' ){
      console[flag].apply(console, args);
    }
  },
  error: function(){
    this.console('error', [].slice.call(arguments));
  },
  debug: function(){
    this.console('debug', [].slice.call(arguments));
  },
  info: function(str){
    this.console('info', [].slice.call(arguments));
    if (_.isString(str)){
      $('#log').text(str + ' - '+ new Date() + '\n' + $('#log').text());
    }
  },
  log: function(){
    this.console('log', [].slice.call(arguments));
  },
  loop: function(){

  }
};