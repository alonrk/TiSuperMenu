// Path menu for Titanium
// Tony Lukasavage - @tonylukasavage

// There MUST be more than 1 icon or the math breaks
var DEFAULTS = {
	ICON_IMAGE: '/images/star.png',
	ICON_SIZE: Ti.Platform.displayCaps.platformWidth > 600 ? 80 : 40,
	ICON_NUMBER: 6,
	ICON_ROTATION: 360,
	BUTTON_IMAGE: '/images/add.png',
	BUTTON_SIZE: Ti.Platform.displayCaps.platformWidth > 600 ? 80 : 40,
	MENU_DURATION: 500,
	FADE_DURATION: 500,
	BOUNCE_DISTANCE: 25,
	STAGGER: 50
};
var isAndroid = Ti.Platform.osname === 'android';
var isIOS = Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad';

/////////////////////////////////////////
////////// Module dependencies //////////
/////////////////////////////////////////
if (isIOS) {
	var pathAnimator = require('path.animator');
}

/////////////////////////////////////////
////////// "Private" variables //////////
/////////////////////////////////////////
var settings = {},
	isAnimating = false,
	menu, 
    menuButton,
    menuIcons,
    fadeOut,
    fadeIn;

//////////////////////////////////////
////////// "Public" members //////////
//////////////////////////////////////
exports.EVENT_ICONCLICK = 'iconClick';
exports.createMenu = function(o) {
	// Configure the settings for the menu
	settings.iconList = o.iconList || createDefaultIconList();
	settings.iconRotation = o.iconRotation || DEFAULTS.ICON_ROTATION;
	settings.iconSize = o.iconSize || DEFAULTS.ICON_SIZE;
	settings.buttonImage = o.buttonImage || DEFAULTS.BUTTON_IMAGE;
	settings.buttonSize = o.buttonSize || DEFAULTS.BUTTON_SIZE;
	settings.menuDuration = o.menuDuration || DEFAULTS.MENU_DURATION;
	settings.fadeDuration = o.fadeDuration || DEFAULTS.FADE_DURATION;
	settings.hRadius = o.hRadius || (Ti.Platform.displayCaps.platformWidth/2 - settings.iconSize/2);
	settings.vRadius = o.vRadius || (Ti.Platform.displayCaps.platformWidth/2 - settings.iconSize/2);
	settings.bounceDistance = o.bounceDistance || DEFAULTS.BOUNCE_DISTANCE;
	settings.stagger = o.stagger || DEFAULTS.STAGGER;
	settings.arc = o.arc || 90;
	settings.iconsBottom = o.iconsBottom || 0;
	
	// Create reusable fade & scale animations. Need to declare
	// the transforms outside of the animation. See notes at the beginning
	// of this file.
	fadeOut = Ti.UI.createAnimation({
		duration: settings.fadeDuration,
		opacity: 0
	});
	fadeOut.transform = Ti.UI.create2DMatrix().scale(0, 0);
	fadeLarge = Ti.UI.createAnimation({
		duration: settings.fadeDuration,
		opacity: 0 
	});
	fadeLarge.transform = Ti.UI.create2DMatrix().scale(4, 4);
	
	// Construct menu UI components and establish view hierarchy
	menu = Ti.UI.createView({
		height: settings.buttonSize,
		width: settings.buttonSize,
		bottom: o.bottom || 0,
		left: o.left || 0
	});
	menuButton = createMenuButton();
	menuIcons = [];
	
	menuButton.addEventListener('click', handleMenuButtonClick);
	for (var i = 0; i < o.iconList.length; i++) {
		var menuIcon = createMenuIcon(i);
		menuIcon.addEventListener('click', handleMenuIconClick);
		menuIcons.push(menuIcon);
		menu.add(menuIcon);
	}
	menu.add(menuButton);
	menu.initMenu = initMenu;
	
	return menu;
};

/////////////////////////////////////////
////////// "Private" functions //////////
/////////////////////////////////////////
var resetIconVisibility = function(icon) {
	// use a short timeout to prevent flicker
	setTimeout(function() {
		icon.opacity = 1;
		icon.transform = Ti.UI.create2DMatrix().scale(1,1);
		if (isAndroid) {
			icon.show();
		}
	}, 100);
};

var initMenu = function() {
	menuButton.isOpen = false;
	menuButton.left = 0;
	menuButton.bottom = 0;
	menuButton.opacity = 1;
	menuButton.transform = Ti.UI.create2DMatrix().rotate(0);
	menuButton.show();
	for (var i = 0; i < menuIcons.length; i++) {
		var icon = menuIcons[i];
		icon.left = 0;
		icon.bottom = 0;
		resetIconVisibility(icon);
	}
	isAnimating = false;
};

var handleMenuButtonClick = function(e) {
	// Make sure we don't have other menu animations running
	if (isAndroid && isAnimating === true) {
		return;	
	}
	isAnimating = true;
	
	var i, icon;
	var anim = menuButton.isOpen ? 'close' : 'open';
	
	// change the menu button state
	menuButton.isOpen = !menuButton.isOpen;
	menuButton.animate(menuButton.animations[anim]);
	
	// quick and dirty fix for making the containing view "fit"
	if (anim === 'open') {
		menu.height = settings.vRadius + settings.bounceDistance + settings.iconSize;
		menu.width = settings.hRadius + settings.bounceDistance + settings.iconSize;
	} else {
		setTimeout(
			function() {
				menu.height = settings.buttonSize;
				menu.width = settings.buttonSize;
			}, 
			settings.menuDuration + (settings.stagger * settings.iconList.length) + 100
		);	
	}
	
	// Open/close all the icons with animation
	for (i = 0; i < menuIcons.length; i++) {
		icon = menuIcons[i];
		icon.animations[anim + 'Bounce'].addEventListener(
			'complete', 
			anim === 'open' ? doCompleteOpen : doCompleteClose
		);
		icon.animate(icon.animations[anim + 'Bounce']);
		
		// ios uses the path.animator module for iOS rotations so that they can be
		// greater than 180 degrees
		if (isIOS) {
			icon.rotate({
				angle: settings.iconRotation,
				duration: settings.menuDuration + (settings.menuDuration / 3.5)	
			});
		}
	}
};

var handleMenuIconClick = function(e) {
	var i, radians, icon;
	
	// Make sure we don't have other menu animations running
	if (isAndroid && isAnimating === true) {
		return;	
	}
	isAnimating = true;
	
	menu.fireEvent(exports.EVENT_ICONCLICK, {
		source: menu,
		icon: e.source,
		index: e.source.index,
		id: e.source.id
	});
	
	// fade and scale out the menuButton
	if (isAndroid) {
		fadeOut.left = (menuButton.width * 0.5);
		fadeOut.bottom = -1 * (menuButton.height * 0.5);		
	}	
	fadeOut.addEventListener('complete', function(e) {
		menu.height = settings.buttonSize;
		menu.width = settings.buttonSize;
	});
	menuButton.animate(fadeOut);
	
	// iterate through icons, fade and scale down the ones that weren't clicked,
	// fade and scale up the one that was.
	for (i = 0; i < menuIcons.length; i++) {
		radians = (settings.arc / (menuIcons.length - 1)) * i * Math.PI / 180;
		icon = menuIcons[i];
		
		// android scales from the top left, not the center like ios,
		// hence the extra left/bottom animations
		if (i !== e.source.index) {
			if (isAndroid) {
				fadeOut.left = Math.sin(radians) * settings.hRadius + (icon.width * 0.5);
				fadeOut.bottom = Math.cos(radians) * settings.vRadius - (icon.height * 0.5);		
			}	
			icon.animate(fadeOut);
		} else {
			if (isAndroid) {
				fadeLarge.left = Math.sin(radians) * settings.hRadius - (icon.width * 1.5);
				fadeLarge.bottom = Math.cos(radians) * settings.vRadius + (icon.height * 1.5);
			}
			icon.animate(fadeLarge);
		}	
	}
};

var createMenuButton = function() {
	var animations = {
		open: Ti.UI.createAnimation({
			duration: settings.menuDuration	
		}),
		close: Ti.UI.createAnimation({
			duration: settings.menuDuration
		})
	};
	animations.open.transform = Ti.UI.create2DMatrix().rotate(45);
	animations.open.addEventListener('complete', function() {
		isAnimating = false;
	});
	
	// In Titanium, Android rotations always start at zero, regardless of last position.
	// In Android Titanium apps you can pass two arguments to the rotate() function,
	// the first being the starting rotation, the second being the final rotation.
	// This is not a cross-platform method, so you need to make sure you are on Android
	// before using 2 arguments.
	// Jira Issue: http://jira.appcelerator.org/browse/TIMOB-6843
	if (isAndroid) {
		animations.close.transform = Ti.UI.create2DMatrix().rotate(45, 0);
	} else {
		animations.close.transform = Ti.UI.create2DMatrix().rotate(0);	
	}
	animations.close.addEventListener('complete', function() {
		isAnimating = false;
	});
	
	var menuButton = Ti.UI.createImageView({
		image: settings.buttonImage,
		height: settings.buttonSize,
		width: settings.buttonSize,
		left: 0,
		bottom: 0,
		isOpen: false,
		animations: animations
	});
	
	return menuButton;
};

var createMenuIcon = function(index) {
	var length = settings.iconList.length;
	var id = settings.iconList[index].id;
	var radians = (settings.arc / (length - 1)) * index * Math.PI / 180 - Math.PI / 2;
	var bounceLeft = Math.sin(radians) * (settings.hRadius + settings.bounceDistance);
	var bounceBottom = settings.iconsBottom + Math.cos(radians) * (settings.vRadius + settings.bounceDistance);
	var finalLeft = Math.sin(radians) * settings.hRadius;
	var finalBottom = settings.iconsBottom + Math.cos(radians) * settings.vRadius;
	var animations = {
		openBounce: Ti.UI.createAnimation({
			duration: settings.menuDuration,
			bottom: bounceBottom,
			left: bounceLeft,
			delay: index * settings.stagger
		}),
		openFinal: Ti.UI.createAnimation({
			duration: settings.menuDuration / 3.5,
			bottom: finalBottom,
			left: finalLeft
		}),
		closeBounce: Ti.UI.createAnimation({
			duration: settings.menuDuration / 3.5,
			bottom: bounceBottom,
			left: bounceLeft,
			delay: (length - (index+1)) * settings.stagger,
		}),
		closeFinal: Ti.UI.createAnimation({
			duration: settings.menuDuration,
			bottom: 0,
			left: 0
		})
	};
	
	// iOS uses path.animator module for rotations
	if (!isIOS) {
		animations.openBounce.transform = Ti.UI.create2DMatrix().rotate(settings.iconRotation);
		animations.closeFinal.transform = Ti.UI.create2DMatrix().rotate(-1 * settings.iconRotation);
	}
	
	// Use path.animator view for iOS, which can be rotated more than 180 degrees, 
	// by default 720 degrees
	var icon;
	if (isIOS) {
		icon = pathAnimator.createView({
			backgroundImage: settings.iconList[index].image,
			height: settings.iconSize,
			width: settings.iconSize,
			left: 0,
			bottom: settings.iconsBottom,
			animations: animations,
			index: index,
			id: id
		});
	} else {
		icon = Ti.UI.createImageView({
			image: settings.iconList[index].image,
			height: settings.iconSize,
			width: settings.iconSize,
			left: 0,
			bottom: settings.iconsBottom,
			animations: animations,
			index: index,
			id: id
		});
	}
	
	icon.animations.openBounce.icon = icon;
	icon.animations.closeBounce.icon = icon;
	
	return icon;
};

var doCompleteOpen = function(e) {
	e.source.removeEventListener('complete', doCompleteOpen);
	e.source.icon.animate(e.source.icon.animations.openFinal);
};

var doCompleteClose = function(e) {
	e.source.removeEventListener('complete', doCompleteClose);
	e.source.icon.animate(e.source.icon.animations.closeFinal);
};

var createDefaultIconList = function() {
	var icons = [];
	for (var i = 0; i < DEFAULTS.ICON_NUMBER; i++) {
		icons.push({
			image: DEFAULTS.ICON_IMAGE,
			id: undefined
		});	
	}
	return icons;	
};
