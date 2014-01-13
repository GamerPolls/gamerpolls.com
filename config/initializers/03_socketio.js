var socketio = require('socket.io');

module.exports = function() {
	this.io = socketio.listen(3001);
	this.io.set('log level', 1);
};
