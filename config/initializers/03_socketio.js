var socketio = require('socket.io');

module.exports = function() {
	this.io = socketio.listen(3001);
};
