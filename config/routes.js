module.exports = function routes() {
	this.root('pages#main');
	
	this.match('account', 'account#showAccount');
	this.get('login', 'account#loginForm');
	this.post('login', 'account#login');
	this.get('login/:authStrategy', 'account#login');
	this.match('login/:authStrategy/callback', 'account#login');
	this.match('logout', 'account#logout');

	this.get('poll/new', 'poll#new');
	this.post('poll/new', 'poll#create');
	this.match('poll/:id', 'poll#showPoll');
	this.post('poll/:id/vote', 'poll#vote');
	this.post('poll/:id/close', 'poll#close');
	this.get('poll/:id/results', 'poll#showResults');
};
