module.exports = function routes() {
	this.root('pages#main');

	this.match('privacy', 'pages#privacy');

	this.match('account', 'account#showAccount');
	this.get('login', 'account#loginForm');
	this.post('login', 'account#login');
	this.get('login/:authStrategy', 'account#login');
	this.match('login/:authStrategy/callback', 'account#login');
	this.match('logout', 'account#logout');

	this.get('poll/new', 'poll#new');
	this.post('poll/new', 'poll#create');
	this.match('poll/:id', 'poll#showPoll');
	this.get('poll/:id/edit', 'poll#showEdit');
	this.post('poll/:id/edit', 'poll#edit');
	this.post('poll/:id/vote', 'poll#vote');
	this.post('poll/:id/close', 'poll#close');
	this.get('poll/:id/results', 'poll#showResults');
	this.get('poll/:id/copy', 'poll#copy');
};
