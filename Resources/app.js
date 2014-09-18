var superMenu = require('/supermenu');

var win = Ti.UI.createWindow({
	backgroundColor: '#fff',
	fullscreen: false,
	exitOnClose: true
});
var menu = superMenu.createMenu({
	buttonImage: 'images/add.png',
	iconList: [
		{ image: 'images/add-text.png', id: 'facebook' },
		{ image: 'images/add-photo.png', id: 'pridat' },
		{ image: 'images/add-button.png', id: 'twitter' },
		{ image: 'images/add-link.png', id: 'vimeo' },
		{ image: 'images/add-video.png', id: 'youtube' }
	],
	iconSize: 80,
	buttonSize: 80,
	hRadius: 120,
	vRadius: 100,
	arc: 180,
	iconRotation: 180,
	bottom: 0,
	left: 120,
	iconsBottom: 0
});
var label = Ti.UI.createLabel({
	text: 'index: ???\nid: ???',
	color: '#222',
	font: {
		fontSize: 24,
		fontWeight: 'bold'	
	},
	textAlign: 'center'
});

menu.addEventListener('iconClick', function(e) {
	Ti.API.info(e.source);
	Ti.API.info(e.index);
	Ti.API.info(e.id);
	label.text = 'index: ' + e.index + '\nid: ' + (e.id ? e.id : 'undefined');
});

var button = Ti.UI.createButton({
	title: 'reset menu',
	width: 120,
	height: 40,
	top: 20
});
button.addEventListener('click', function(e) {
	menu.initMenu();
	label.text = 'index: ???\nid: ???';
});

win.add(label);
win.add(button);
win.add(menu);

win.open();