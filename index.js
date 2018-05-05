var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);

server.listen(process.env.PORT || 8080);

function player(in_username, in_password, in_status, in_opponent, in_rank, in_exp, in_win, in_lose, in_history, in_friend){
	this.username = in_username; // tên đăng nhập
	this.password = in_password; // mật khẩu
	this.status = in_status; // trạng thái hiện tại: offline/online/busy (busy là đang bắt trận vs người khác)
	this.opponent = in_opponent; // đối thủ đang đánh hiện tại: none/tên 1 người chơi khác
	this.rank = in_rank; // mức rank hiện tại của người chơi
	this.exp = in_exp; // điểm kinh nghiệm 
	this.win = in_win; // số trận thắng
	this.lose = in_lose; // số trận thua
	this.history = in_history; // lịch sử đánh
	this.friends = in_friend;	// danh sách bạn của người chơi
}

// Lấy tên đăng nhập
player.prototype.getUsername = function(){
	return this.username;
}

// Lấy mật khẩu
player.prototype.getPassword = function(){
	return this.password;
}

// Lấy trạng thái
player.prototype.getStatus = function(){
	return this.status;
}

// Lấy tên đối thủ
player.prototype.getOpponent = function(){
	return this.opponent;
}

// Lấy mức rank
player.prototype.getRank = function(){
	return this.rank;
}

// Lấy điểm kinh nghiệm
player.prototype.getExp = function(){
	return this.exp;
}

// Lấy số trận thắng
player.prototype.getWin = function(){
	return this.win;
}

// Lấy số trận thua
player.prototype.getLose = function(){
	return this.lose;
}

// Lấy lịch sử đấu
player.prototype.getHistory = function(){
	return this.history;
}

// lấy danh sách bạn
player.prototype.getFriends = function(){
	return this.friends;
}

// Set lịch sử
player.prototype.setHistory = function(in_history){
	if(this.history == ""){
		this.history = in_history ;
	}
	else
		this.history = this.history + "-" + in_history;
}

player.prototype.addResultInHistory = function(in_something){
	this.history = this.history + ":" + in_something;
}

// Xóa người chơi gần nhất trong lịch sử đấu
player.prototype.removeOnePlayerInHistoryList = function(){
	var data = this.history.split("-");
	if(data.length==1){
		this.history = "";
	}
	else{
		var newHistory = data[0];
		if(newHistory.length>1){
			for(var i = 1; i<data.length-1; i++){
				newHistory = newHistory + "-" + data[i];
			}
			this.history = newHistory;
		}
	}	
}

// set 1 đối thủ mới
player.prototype.setOpponent = function(in_Opponent){
	this.opponent = in_Opponent;
}

// set trạng thái 
player.prototype.setStatus = function(in_status){
	this.status = in_status;
}

// set mức rank
player.prototype.setRank = function(in_rank){
	this.rank = in_rank;
}

// set điểm kinh nghiệm
player.prototype.addExp = function(in_exp){
	this.exp = this.exp + in_exp;
	if(this.exp >= 10 && this.rank <5){
		this.exp = 0;
		this.rank = this.rank + 1;
	}
}

player.prototype.minusExp = function(in_exp){
	this.exp = this.exp - in_exp;
	// Nếu điểm kinh nghiệm
	if(this.exp <0 ){
		if(this.rank >=2){
			this.exp = 9;
			this.rank = this.rank - 1;
		}else{
			this.exp = 0;
		}
	}
}

// cộng số trận thắng
player.prototype.adjustWin = function(){
	this.win = this.win +1;
}

// cộng số trận thua
player.prototype.adjustLose = function(){
	this.lose = this.lose +1;
}

// thêm bạn vào danh sách
player.prototype.addFriend = function(in_friend){
	if(this.friends == ""){
		this.friends = in_friend;
	}
	else{
		var x = this.friends.split("-");
		var exist = false
		for(var i = 0; i<x.length; i++){
			if(x[i] == in_friend){
				exist = true;
			}
		}
		if(exist == false)
			this.friends = this.friends + "-" + in_friend;
	}
}

// Kiểm tra tên đăng nhập
player.prototype.CheckSignInAccount = function(in_username){
	if(this.username == in_username )
		return true;
	else
		return false;
}

// Kiểm tra tên đăng nhập và mật khẩu khi login
player.prototype.CheckAccount = function(in_username, in_password){
	if(this.username == in_username && this.password == in_password)
		return true;
	else
		return false;
	
}

// hàm random số
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

playerList = []; // danh sách người chơi đã đăng ký tài khoản
users = {}; // danh sách các user đã login vào (chỉ chứa socket.id)

console.log("CARO IS RUNNING");

io.sockets.on('connection', function(socket){
	console.log("Device connected");
	
	// Bắt sự kiện khi đăng ký tài khoản mới
	socket.on('CreateAccount', function(data){
		var x = data.split("-");
		if(playerList.length==0){
			// danh sách rỗng => chưa có tài khoản nào được tạo
			// thêm mới tài khoản vào danh sách
			//console.log('new account: ' + x[0] + '-' + x[1]);
			var newPlayer = new player(x[0], x[1], "offline", "none", 1, 0, 0, 0, "", "");
			playerList.push(newPlayer);
			console.log("Tao tai khoan thanh cong: ");
			console.log("username: "+newPlayer.getUsername());
			console.log("password: "+newPlayer.getPassword());
			var success = true;
			// gởi thông tin về cho người chơi là tạo tài khoản thành công
			socket.emit('CreateAccoutFeedBack', {feedback:success});
		}else{
			// danh sách không rỗng
			// kiểm tra xem tài khoản (kiểm tra username) yêu cầu đăng ký có bị trùng hay không
			var exist = false;
			for(var i = 0; i<playerList.length; i++){
				var currentPlayer = playerList[i];
				var in_username = x[0];
				var in_password = x[1];
				if(currentPlayer.CheckSignInAccount(in_username, in_password)){
					exist = true;
					break;
				}
			}
			if(exist == false){
				// chưa tồn tại tài khoản
				// tạo tài khoản mới
				//console.log('new account: ' + x[0] + '-' + x[1]);
				var in_status = "offline";
				var in_opponent = "none";
				var in_rank = 1;
				var in_exp = 0;
				var in_history = "test";
				var newPlayer = new player(x[0], x[1], "offline", "none", 1, 0, 0, 0, "", "");
				playerList.push(newPlayer);
				console.log("Tao tai khoan thanh cong: ");
				console.log("username: "+newPlayer.getUsername());
				console.log("password: "+newPlayer.getPassword());
				var success = true;
				// gởi thông tin về cho người chơi là tạo tài khoản thành công
				socket.emit('CreateAccoutFeedBack', {feedback:success});
			}else{
				// username đã tồn tại => yêu cầu client đổi username
				var success = false;
				// gởi thông tin về cho người chơi là không thể tạo tài khoản
				socket.emit('CreateAccoutFeedBack', {feedback:success});
			}
		}
	});
	
	// bắt sự kiện đăng nhập của người chơi
	socket.on('Login', function(data){
		// Tìm trong danh sách người chơi xem có tồn tại tài khoản hay không
		var x = data.split("-");
		var found = false;
		for(var i = 0; i<playerList.length; i++){
			var currentPlayer = playerList[i];
			var in_username = x[0];
			var in_password = x[1];
			if(playerList[i].getStatus() != "online"){
				if(currentPlayer.CheckAccount(in_username, in_password)){
					// Khi tìm thấy tài khoản người chơi => người chơi đăng nhập thành công => set trạng thái là online
					found = true;
					var in_status = "online";
					users[currentPlayer.getUsername()] = socket.id;
					currentPlayer.setStatus(in_status);
					console.log("Dang nhap thanh cong voi username la: "+in_username);
					break;
				}
			}
		}
		// gởi thông tin về cho người chơi là tìm thấy hay không
		socket.emit('LoginFeedback', {feedback:found});
	});


	// bắt sự kiện tìm kiếm người chơi ngẫu nhiên
	socket.on('FindRandomPlayer', function(data){
			// player1: người chơi đã bấm tìm ngẫu nhiên
			// player2: người chơi tìm đượcs
			var opponent = "none";
			var x;
			var y;
			var found = false;
			do{
				var i = getRndInteger(0, playerList.length);
				opponent = "none";
				x = "";
				y = "";
				if(i>=0&&i<=playerList.length){
					var currentPlayerStatus = playerList[i].getStatus();
					if(currentPlayerStatus == "online" && currentPlayerStatus != "busy"){
						var currentPlayerUsername = playerList[i].getUsername();
						if(currentPlayerUsername != data){
							// Tìm thấy người chơi phù hợp (player2)
							// set đối thủ của player2 là player1
							// set trạng thái lúc này là busy
							found = true;
							playerList[i].setOpponent(data);
							playerList[i].setHistory(data);
							playerList[i].addResultInHistory("O");
							var newStatus = "busy";
							playerList[i].setStatus("busy");
							y = playerList[i].getOpponent();
							y = y+"-O-"+playerList[i].getStatus();
							opponent = currentPlayerUsername;
							for(var j = 0; j<playerList.length; j++){
								var currentPlayer = playerList[j];
								if(currentPlayer.getUsername() == data){
									// set đối thủ của player1 là player2
									playerList[j].setOpponent(opponent);
									playerList[j].setHistory(opponent);
									playerList[j].addResultInHistory("X");
									playerList[j].setStatus("busy");
									x = playerList[j].getOpponent();
									x = x+"-X-"+playerList[j].getStatus();
								}
							}
						}	
					}
				}
			}while(found == false);
			// gởi thông tin về cho player1 username của player2
			socket.emit('FindRandomPlayerFeedback', {feedback:x});
			// gởi thông tin về cho player2 username của player1
			io.to(users[opponent]).emit('FindRandomPlayerFeedback', {feedback:y});
		
	});


	// Bắt sự kiện 1 người chơi chấp nhận trận đấu
	socket.on('Accept', function(data){
		var opponent = "none";
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				opponent = playerList[i].getOpponent();
				break;
			}
		}
		//socket.emit('AcceptFeedback', {feedback:data});
		io.to(users[opponent]).emit('AcceptFeedback', {feedback:data});
	});

	socket.on('Cancel', function(data){
		var opponent = "none";
		var x;
		var y;
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				opponent = playerList[i].getOpponent();
				var tmp = "none";
				var newStatus = "online";
				playerList[i].setStatus("online");
				playerList[i].removeOnePlayerInHistoryList();
				playerList[i].setOpponent("none");
				x = playerList[i].getHistory();
				break;
			}
		}
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == opponent){
				var tmp = "none";
				var newStatus = "online";
				playerList[i].setStatus("online");
				playerList[i].removeOnePlayerInHistoryList();
				playerList[i].setOpponent("none");
				y = playerList[i].getHistory();
			}
		}
		socket.emit('CancelFeedback', {feedback:x});
		io.to(users[opponent]).emit('CancelFeedback', {feedback:y});
	});

	// Bắt sự kiện khi người chơi đi một nước đi mới
	socket.on('NewMovement', function(data){
		var x = data.split("-");
		var thisPlayer;
		var opponent;
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(x[2] == currentPlayerUsername){
				// Tìm username của đối thủ để sử dụng username đó cho việc tìm socket chứa username trong mảng users để gởi dữ liệu
				thisPlayer = playerList[i];
				opponent = thisPlayer.getOpponent();
				break;
			}
		}
		// gởi dữ liệu cho đối thủ của người chơi
		io.to(users[opponent]).emit('NewMovementFeedback', {feedback:data});
	});

	// Bắt sự kiện thoát khỏi 1 trận đấu
	socket.on('Quit', function(data){
		var opponent;
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				// set lại đối thủ của người chơi là none, tức là hiện tại không còn đấu với ai
				var in_opponent = "none";
				playerList[i].setOpponent("none");
				var newStatus = "online";
				playerList[i].setStatus("online");
				var x = playerList[i].getOpponent()+"-"+playerList[i].getStatus();
				// gởi dữ liệu về cho người chơi để người chơi biết là quit thành công
				socket.emit('QuitFeedback',{feedback:x});
			}
		}
	});

	// Sự kiện thoát giữa trận đấu
	socket.on('QuitMiddle', function(data){
		var opponent;
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				// Tìm ra người chơi bấm thoát đồng thời lưu lại username của đối thủ
				opponent = playerList[i].getOpponent();
				var in_opponent = "none";
				var newStatus = "online";
				var expPoint = getRndInteger(1,2);
				playerList[i].minusExp(expPoint);
				playerList[i].setStatus("online");
				playerList[i].setOpponent("none");
				var in_result = "L";
				playerList[i].addResultInHistory("L");
				var expPoint1 = getRndInteger(1,2);
				playerList[i].minusExp(expPoint1);
				playerList[i].adjustLose();
				var x = "QuitMiddle: "+playerList[i].getOpponent()+"-"+playerList[i].getStatus()+"-"+playerList[i].getExp();
				// gởi thông tin cho người chơi để biết là thoát thành công
				socket.emit('QuitMiddleFeedback',{feedback:x});
				break;
			}
		}
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == opponent){
				// Tìm dữ liệu dựa vào username của đối thủ
				var in_opponent = "none";
				var newStatus = "online";
				playerList[i].setStatus("online");
				playerList[i].setOpponent("none");
				var in_result = "W";
				playerList[i].addResultInHistory("W");
				var x = playerList[i].getOpponent()+"-"+playerList[i].getStatus();
				// Gởi thông tin cho đối thủ và cho họ biết là trậu đấu đã kết thúc
				io.to(users[opponent]).emit('QuitMiddleFeedback', {feedback:x});
				break;
			}
		}
	});
	

	socket.on('Winning', function(data){
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				playerList[i].adjustWin();
				var x = playerList[i].getWin();
				socket.emit('WinningFeedback', {feedback:x});
			}
		}
	});


	// Bắt sự kiện cập nhật kết quả sau khi trận đấu kết thúc
	socket.on('Result', function(data){
		// data sẽ là username của 2 người chơi
		// vd: player1-player2-win/draw
		// player1 luôn là player thắng game
		// player2 là player thua game
		var opponent = "none";
		var x = data.split("-");
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == x[0]){
				for(var j = 0; j<playerList.length; j++){
					var currentPlayerUsername2 = playerList[j].getUsername();
					if(currentPlayerUsername2 == x[1]){
						// người chơi thắng
						// Cộng số trận thắng của người chơi này
						// Cộng thêm số điểm kinh nghiệm
						var expPoint = getRndInteger(2,4);
						if(x[2]=="win"){
							playerList[i].adjustWin();
							playerList[i].addResultInHistory("W");
							playerList[i].addExp(expPoint);
						}
						else{
							playerList[i].adjustWin();
							playerList[i].addResultInHistory("D");
							playerList[i].addExp(1);
						}
						var x = playerList[i].getWin();
						x = x + "-" + playerList[i].getLose() + "-" + playerList[i].getRank() +"-"+playerList[i].getExp();
						//  người chơi thua
						// Cộng số trận thua của người chơi này
						// Trừ điểm kinh nghiệm
						opponent = playerList[j].getUsername();
						var expPoint1 = getRndInteger(1,2);
						if(x[2] == "draw"){
							playerList[j].adjustWin();
							playerList[j].addExp(1);
							playerList[j].addResultInHistory("D");
						}
						else{
							playerList[j].adjustLose();
							playerList[j].addResultInHistory("L");
							playerList[j].minusExp(expPoint1);
						}
						var y = playerList[j].getWin();	
						y = y + "-" + playerList[j].getLose() + "-" + playerList[j].getRank() +"-"+playerList[j].getExp();
						// gởi thông tin về cho người chơi để họ biết là họ đã được cộng thêm 1 trận thắng + kinh nghiệm
						socket.emit('ResultFeedback', {feedback:x});
						// gởi thông tin về cho đổi thủ để họ biết là họ đã được cộng thêm 1 trận thua và trừ kinh nghiệm
						io.to(users[opponent]).emit('ResultFeedback', {feedback:y});
					}
				}				
			}
		}
	});

	// Bắt sự kiện lấy lịch sử đấu của người chơi
	socket.on('HistoryList', function(data){
		// data là username của người chơi
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				var x = playerList[i].getHistory();
				socket.emit('HistoryListFeedback', {feedback:x});
			}
		}
	});

	// Bắt sự kiện thoát khỏi server của người chơi
	socket.on('GoingOffline', function(data){
		if(data!=""){
			var status;
			for(var i = 0; i<playerList.length; i++){
				var currentPlayerUsername = playerList[i].getUsername();
				if(currentPlayerUsername == data){
					var newStatus = "offline";
					playerList[i].setStatus("offline");
					status = playerList[i].getStatus();
					break;
				}
			}
			//delete users[data];
			var x = "Nguoi choi: " + data + "- offline";
			console.log(x);
			//socket.emit('GoingOfflineFeedback', {feedback:x});
		}
	});

	socket.on('GoingOnline', function(data){
		for(var i = 0; i<playerList.length; i++){
			if(data == playerList[i].getUsername()){
				playerList[i].setStatus("online");
				break;
			}
		}
	});

	// Bắt sự kiện lấy thông tin đối thủ
	socket.on('OpponentInfo', function(data){
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				// username-win-lose-rank
				var x = data+"-"+playerList[i].getWin()+"-"+playerList[i].getLose()+"-"+playerList[i].getRank();
				socket.emit('OpponentInfoFeedback', {feedback:x});
				break;
			}
		}
	});

	// bắt sự kiện thêm bạn vào danh sách bạn
	socket.on('AddFriend', function(data){
		var x = data.split("-");
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == x[0]){
				playerList[i].addFriend(x[1]);
				break;
			}
		}	
	});

	// Bắt sự kiện lấy danh sách bạn
	socket.on('GetFriends', function(data){
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				var x = playerList[i].getFriends();
				var status = "";
				var y = "";
				var data = x.split("-");
				for(var j = 0; j<data.length; j++){
					for(var k = 0; k<playerList.length; k++){
						if(data[j] == playerList[k].getUsername()){
							if(y == "")
								y = playerList[k].getUsername();
							else
								y = y + "-" + playerList[k].getUsername();

							y = y + ":" + playerList[k].getStatus(); 
							break;
						}	
					}
				}
				socket.emit('GetFriendsFeedback', {feedback:y});
				break;
			}
		}
	});

	socket.on('ChallengeAFriend', function(data){
		var x = data.split("-");
		var y;
		var z;
		for(var  i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == x[0]){
				playerList[i].setOpponent(x[1]);
				playerList[i].setHistory(x[1]);
				playerList[i].addResultInHistory("X");
				playerList[i].setStatus("busy");
				y = playerList[i].getOpponent()+"-X-"+playerList[i].getStatus();
				for(var j = 0; j<playerList.length; j++){
					if(playerList[j].getUsername() == x[1]){
						playerList[j].setOpponent(x[0]);
						playerList[j].setHistory(x[0]);
						playerList[j].addResultInHistory("O");
						playerList[j].setStatus("busy");
						z = playerList[j].getOpponent()+"-O-"+playerList[j].getStatus();
						break;
					}
				}
				break;
			}
		}
		socket.emit('ChallengeAFriendFeedback', {feedback:y});
		io.to(users[x[1]]).emit('ChallengeAFriendFeedback', {feedback:z});
	});

	socket.on('GetPlayerInfo', function(data){
		for(var i = 0; i<playerList.length; i++){
			var currentPlayerUsername = playerList[i].getUsername();
			if(currentPlayerUsername == data){
				// username-win-lose-rank
				var x = data+"-"+playerList[i].getWin()+"-"+playerList[i].getLose()+"-"+playerList[i].getRank()+"-"+playerList[i].getExp();
				socket.emit('GetPlayerInfoFeedback', {feedback:x});
				break;
			}
		}
	});

});