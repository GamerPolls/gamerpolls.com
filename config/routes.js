module.exports = function routes() {
	this.root('pages#main');
	
	this.match('account', 'account#showAccount');
	this.get('login', 'account#loginForm');
	this.post('login', 'account#login');
	this.match('login/:authStrategy/callback', 'account#login');
	this.match('logout', 'account#logout');
};
