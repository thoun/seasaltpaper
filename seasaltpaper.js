var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this.zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', function () { return _this.zoomOrDimensionChanged(); });
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_e = this.settings.autoZoom) === null || _e === void 0 ? void 0 : _e.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this.zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this.zoomLevels[this.zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this.zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this.zoomLevels[this.zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this.zoomLevels[0]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
/**
 * Linear slide of the card from origin to destination.
 *
 * @param element the element to animate. The element should be attached to the destination element before the animation starts.
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function slideAnimation(element, settings) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        // should be checked at the beginning of every animation
        if (!shouldAnimate(settings)) {
            success(false);
            return promise;
        }
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg)");
        (_d = settings.animationStart) === null || _d === void 0 ? void 0 : _d.call(settings, element);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            var _a;
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            (_a = settings.animationEnd) === null || _a === void 0 ? void 0 : _a.call(settings, element);
            success(true);
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = (_e = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _e !== void 0 ? _e : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(element, settings) {
    console.log(element, element.getBoundingClientRect(), element.style.transform, settings);
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
    }
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param element the element to animate
     * @param toElement the destination parent
     * @param fn the animation function
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (element, toElement, fn, settings) {
        var _a, _b, _c, _d, _e, _f;
        var fromRect = element.getBoundingClientRect();
        toElement.appendChild(element);
        (_a = settings === null || settings === void 0 ? void 0 : settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, toElement);
        return (_f = fn(element, __assign(__assign({ duration: (_c = (_b = this.settings) === null || _b === void 0 ? void 0 : _b.duration) !== null && _c !== void 0 ? _c : 500, scale: (_e = (_d = this.zoomManager) === null || _d === void 0 ? void 0 : _d.zoom) !== null && _e !== void 0 ? _e : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.game, fromRect: fromRect }))) !== null && _f !== void 0 ? _f : Promise.resolve(false);
    };
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    AnimationManager.prototype.attachWithSlideAnimation = function (element, toElement, settings) {
        return this.attachWithAnimation(element, toElement, slideAnimation, settings);
    };
    /**
     * Attach an element to a parent with a slide animation.
     *
     * @param card the card informations
     */
    AnimationManager.prototype.attachWithShowToScreenAnimation = function (element, toElement, settingsOrSettingsArray) {
        var _this = this;
        var cumulatedAnimation = function (element, settings) { return cumulatedAnimations(element, [
            showScreenCenterAnimation,
            pauseAnimation,
            function (element) { return _this.attachWithSlideAnimation(element, toElement); },
        ], settingsOrSettingsArray); };
        return this.attachWithAnimation(element, toElement, cumulatedAnimation, null);
    };
    /**
     * Slide from an element.
     *
     * @param element the element to animate
     * @param fromElement the origin element
     * @param settings the animation settings
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.slideFromElement = function (element, fromElement, settings) {
        var _a, _b, _c, _d, _e;
        return (_e = slideAnimation(element, __assign(__assign({ duration: (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.duration) !== null && _b !== void 0 ? _b : 500, scale: (_d = (_c = this.zoomManager) === null || _c === void 0 ? void 0 : _c.zoom) !== null && _d !== void 0 ? _d : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.game, fromElement: fromElement }))) !== null && _e !== void 0 ? _e : Promise.resolve(false);
    };
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    // TODO keep only one ?
    CardStock.prototype.cardInStock = function (card) {
        var element = document.getElementById(this.manager.getId(card));
        return element ? this.cardElementInStock(element) : false;
    };
    CardStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement) == this.element;
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return document.getElementById(this.manager.getId(card));
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.cardInStock(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in stock then we ignore animation
        var currentStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        if (currentStock === null || currentStock === void 0 ? void 0 : currentStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: currentStock }), settingsWithIndex);
            element.dataset.side = ((_a = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _a !== void 0 ? _a : true) ? 'front' : 'back';
        }
        else if ((animation === null || animation === void 0 ? void 0 : animation.fromStock) && animation.fromStock.cardInStock(card)) {
            var element = document.getElementById(this.manager.getId(card));
            promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
        }
        else {
            var element = this.manager.createCardElement(card, ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : true));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        this.setSelectableCard(card, this.selectionMode != 'none');
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            return Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        cardElement.classList.remove('selectable', 'selected', 'disabled');
        promise = this.animationFromElement(cardElement, animation.fromStock.element, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        });
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element, {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement, {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        var _this = this;
        if (shift === void 0) { shift = false; }
        if (shift === true) {
            if (cards.length) {
                this.addCard(cards[0], animation, settings).then(function () { return _this.addCards(cards.slice(1), animation, settings, shift); });
            }
            return;
        }
        if (shift) {
            var _loop_1 = function (i) {
                setTimeout(function () { return _this.addCard(cards[i], animation, settings); }, i * shift);
            };
            for (var i = 0; i < cards.length; i++) {
                _loop_1(i);
            }
        }
        else {
            cards.forEach(function (card) { return _this.addCard(card, animation, settings); });
        }
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     */
    CardStock.prototype.removeCard = function (card) {
        if (this.cardInStock(card)) {
            this.manager.removeCard(card);
        }
        this.cardRemoved(card);
    };
    CardStock.prototype.cardRemoved = function (card) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     */
    CardStock.prototype.removeCards = function (cards) {
        var _this = this;
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    /**
     * Remove all cards from the stock.
     */
    CardStock.prototype.removeAll = function () {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card); });
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        var element = this.getCardElement(card);
        element.classList.toggle('selectable', selectable);
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     */
    CardStock.prototype.setSelectionMode = function (selectionMode) {
        var _this = this;
        if (selectionMode === 'none') {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('selectable', selectionMode != 'none');
        this.selectionMode = selectionMode;
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var element = this.getCardElement(card);
        element.classList.add('selected');
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        element.classList.remove('selected');
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromElement, settings) {
        var _a, _b, _c, _d, _e, _f;
        var side = element.dataset.side;
        if (settings.originalSide && settings.originalSide != side) {
            var cardSides_1 = element.getElementsByClassName('card-sides')[0];
            cardSides_1.style.transition = 'none';
            element.dataset.side = settings.originalSide;
            setTimeout(function () {
                cardSides_1.style.transition = null;
                element.dataset.side = side;
            });
        }
        var animation = (_a = settings.animation) !== null && _a !== void 0 ? _a : slideAnimation;
        return (_f = animation(element, __assign(__assign({ duration: (_c = (_b = this.manager.animationManager.getSettings()) === null || _b === void 0 ? void 0 : _b.duration) !== null && _c !== void 0 ? _c : 500, scale: (_e = (_d = this.manager.animationManager.getZoomManager()) === null || _d === void 0 ? void 0 : _d.zoom) !== null && _e !== void 0 ? _e : undefined }, settings !== null && settings !== void 0 ? settings : {}), { game: this.manager.game, fromElement: fromElement }))) !== null && _f !== void 0 ? _f : Promise.resolve(false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    return CardStock;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness).
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        _this.element.style.setProperty('--width', settings.width + 'px');
        _this.element.style.setProperty('--height', settings.height + 'px');
        _this.thicknesses = (_a = settings.thicknesses) !== null && _a !== void 0 ? _a : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_b = settings.cardNumber) !== null && _b !== void 0 ? _b : 52);
        _this.autoUpdateCardNumber = (_c = settings.autoUpdateCardNumber) !== null && _c !== void 0 ? _c : true;
        var shadowDirection = (_d = settings.shadowDirection) !== null && _d !== void 0 ? _d : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        return _this;
    }
    Deck.prototype.setCardNumber = function (cardNumber) {
        var _this = this;
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', thickness + 'px');
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _a;
        if (this.autoUpdateCardNumber && ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : true)) {
            this.setCardNumber(this.cardNumber + 1);
        }
        return _super.prototype.addCard.call(this, card, animation, settings);
    };
    Deck.prototype.cardRemoved = function (card) {
        if (this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card);
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.cardElementInStock = function (element) {
        return (element === null || element === void 0 ? void 0 : element.parentElement.parentElement) == this.element;
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.cardInStock(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise.then(function (result) {
            _this.removeCard(card);
            return result;
        });
    };
    return VoidStock;
}(CardStock));
var HiddenDeck = /** @class */ (function (_super) {
    __extends(HiddenDeck, _super);
    function HiddenDeck(manager, element, settings) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('hidden-deck');
        _this.element.appendChild(_this.manager.createCardElement({ id: "".concat(element.id, "-hidden-deck-back") }, false));
        return _this;
    }
    HiddenDeck.prototype.addCard = function (card, animation, settings) {
        var _a;
        var newSettings = __assign(__assign({}, settings), { visible: (_a = settings === null || settings === void 0 ? void 0 : settings.visible) !== null && _a !== void 0 ? _a : false });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    return HiddenDeck;
}(Deck));
var VisibleDeck = /** @class */ (function (_super) {
    __extends(VisibleDeck, _super);
    function VisibleDeck(manager, element, settings) {
        var _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('visible-deck');
        return _this;
    }
    VisibleDeck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var currentCard = this.cards[this.cards.length - 1];
        if (currentCard) {
            // we remove the card under, only when the animation is done. TODO use promise result
            setTimeout(function () {
                _this.removeCard(currentCard);
                // counter the autoUpdateCardNumber as the card isn't really removed, we just remove it from the dom so player cannot see it's content.
                if (_this.autoUpdateCardNumber) {
                    _this.setCardNumber(_this.cardNumber + 1);
                }
            }, 600);
        }
        return _super.prototype.addCard.call(this, card, animation, settings);
    };
    return VisibleDeck;
}(Deck));
var AllVisibleDeck = /** @class */ (function (_super) {
    __extends(AllVisibleDeck, _super);
    function AllVisibleDeck(manager, element, settings) {
        var _this = this;
        var _a;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('all-visible-deck');
        element.style.setProperty('--width', settings.width);
        element.style.setProperty('--height', settings.height);
        element.style.setProperty('--shift', (_a = settings.shift) !== null && _a !== void 0 ? _a : '3px');
        return _this;
    }
    AllVisibleDeck.prototype.addCard = function (card, animation, settings) {
        var promise;
        var order = this.cards.length;
        promise = _super.prototype.addCard.call(this, card, animation, settings);
        var cardId = this.manager.getId(card);
        var cardDiv = document.getElementById(cardId);
        cardDiv.style.setProperty('--order', '' + order);
        this.element.style.setProperty('--tile-count', '' + this.cards.length);
        return promise;
    };
    /**
     * Set opened state. If true, all cards will be entirely visible.
     *
     * @param opened indicate if deck must be always opened. If false, will open only on hover/touch
     */
    AllVisibleDeck.prototype.setOpened = function (opened) {
        this.element.classList.toggle('opened', opened);
    };
    AllVisibleDeck.prototype.cardRemoved = function (card) {
        var _this = this;
        _super.prototype.cardRemoved.call(this, card);
        this.cards.forEach(function (c, index) {
            var cardId = _this.manager.getId(c);
            var cardDiv = document.getElementById(cardId);
            cardDiv.style.setProperty('--order', '' + index);
        });
        this.element.style.setProperty('--tile-count', '' + this.cards.length);
    };
    return AllVisibleDeck;
}(CardStock));
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        // TODO check if exists
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div class=\"card-side front\">\n                </div>\n                <div class=\"card-side back\">\n                </div>\n            </div>\n        ";
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    CardManager.prototype.removeCard = function (card) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return;
        }
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card);
        div.id = "deleted".concat(id);
        // TODO this.removeVisibleInformations(div);
        div.remove();
    };
    /**
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        element.dataset.side = visible ? 'front' : 'back';
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _a !== void 0 ? _a : true) {
            (_c = (_b = this.settings).setupFrontDiv) === null || _c === void 0 ? void 0 : _c.call(_b, card, element.getElementsByClassName('front')[0]);
        }
        if ((_d = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _d !== void 0 ? _d : false) {
            (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        }
        if ((_g = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _g !== void 0 ? _g : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    return CardManager;
}());
function slideToObjectAndAttach(game, object, destinationId, changeSide) {
    if (changeSide === void 0) { changeSide = false; }
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return;
    }
    var originBR = object.getBoundingClientRect();
    destination.appendChild(object);
    if (document.visibilityState !== 'hidden' && !game.instantaneousMode) {
        var destinationBR = object.getBoundingClientRect();
        var deltaX = destinationBR.left - originBR.left;
        var deltaY = destinationBR.top - originBR.top;
        object.style.zIndex = '10';
        object.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)");
        if (destination.dataset.currentPlayer == 'false') {
            object.style.order = null;
            object.style.position = 'absolute';
        }
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
            object.style.position = null;
        }, 600);
    }
    else {
        object.style.order = null;
    }
}
function slideFromObject(game, object, fromId) {
    var from = document.getElementById(fromId);
    var originBR = from.getBoundingClientRect();
    if (document.visibilityState !== 'hidden' && !game.instantaneousMode) {
        var destinationBR = object.getBoundingClientRect();
        var deltaX = destinationBR.left - originBR.left;
        var deltaY = destinationBR.top - originBR.top;
        object.style.zIndex = '10';
        object.style.transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)");
        if (object.parentElement.dataset.currentPlayer == 'false') {
            object.style.position = 'absolute';
        }
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
            object.style.position = null;
        }, 600);
    }
}
var Cards = /** @class */ (function () {
    function Cards(game) {
        this.game = game;
        this.COLORS = [
            _('White'),
            _('Dark blue'),
            _('Light blue'),
            _('Black'),
            _('Yellow'),
            _('Green'),
            _('Purple'),
            _('Gray'),
            _('Light orange'),
            _('Pink'),
            _('Orange'),
        ];
    }
    // gameui.cards.debugSeeAllCards()
    Cards.prototype.debugSeeAllCards = function () {
        var _this = this;
        document.querySelectorAll('.old-card').forEach(function (card) { return card.remove(); });
        var html = "<div id=\"all-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        [1, 2, 3, 4, 5, 6].forEach(function (subType) {
            var card = {
                id: 10 + subType,
                type: 1,
                subType: subType,
            };
            _this.createMoveOrUpdateCard(card, "all-cards");
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    type: type,
                    subType: subType,
                };
                _this.createMoveOrUpdateCard(card, "all-cards");
            });
        });
    };
    Cards.prototype.createMoveOrUpdateCard = function (card, destinationId, instant, from) {
        var _this = this;
        if (instant === void 0) { instant = false; }
        if (from === void 0) { from = null; }
        var existingDiv = document.getElementById("card-".concat(card.id));
        var side = card.category ? 'front' : 'back';
        if (existingDiv) {
            this.game.removeTooltip("card-".concat(card.id));
            var oldType = Number(existingDiv.dataset.category);
            existingDiv.classList.remove('selectable', 'selected', 'disabled');
            if (existingDiv.parentElement.id != destinationId) {
                if (instant) {
                    document.getElementById(destinationId).appendChild(existingDiv);
                }
                else {
                    slideToObjectAndAttach(this.game, existingDiv, destinationId);
                }
            }
            existingDiv.dataset.side = '' + side;
            if (!oldType && card.category) {
                this.setVisibleInformations(existingDiv, card);
            }
            else if (oldType && !card.category) {
                if (instant) {
                    this.removeVisibleInformations(existingDiv);
                }
                else {
                    setTimeout(function () { return _this.removeVisibleInformations(existingDiv); }, 500); // so we don't change face while it is still visible
                }
            }
            if (card.category) {
                this.game.setTooltip(existingDiv.id, this.game.cardsManager.getTooltip(card.category, card.family) + "<br><br><i>".concat(this.COLORS[card.color], "</i>"));
            }
        }
        else {
            var div = document.createElement('div');
            div.id = "card-".concat(card.id);
            div.classList.add('old-card');
            div.dataset.id = '' + card.id;
            div.dataset.side = '' + side;
            div.innerHTML = "\n                <div class=\"old-card-sides\">\n                    <div class=\"old-card-side front\">\n                    </div>\n                    <div class=\"old-card-side back\">\n                    </div>\n                </div>\n            ";
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', function () { return _this.game.onCardClick(card); });
            if (from) {
                var fromCardId = document.getElementById(from).id;
                slideFromObject(this.game, div, fromCardId);
            }
            if (card.category) {
                this.setVisibleInformations(div, card);
                if (!destinationId.startsWith('help-')) {
                    this.game.setTooltip(div.id, this.game.cardsManager.getTooltip(card.category, card.family) + "<br><br><i>".concat(this.COLORS[card.color], "</i>"));
                }
            }
        }
    };
    Cards.prototype.updateCard = function (card) {
        var _this = this;
        var existingDiv = document.getElementById("card-".concat(card.id));
        var side = card.category ? 'front' : 'back';
        if (existingDiv) {
            this.game.removeTooltip("card-".concat(card.id));
            var oldType = Number(existingDiv.dataset.category);
            existingDiv.dataset.side = '' + side;
            if (!oldType && card.category) {
                this.setVisibleInformations(existingDiv, card);
            }
            else if (oldType && !card.category) {
                setTimeout(function () { return _this.removeVisibleInformations(existingDiv); }, 500); // so we don't change face while it is still visible
            }
            if (card.category) {
                this.game.setTooltip(existingDiv.id, this.game.cardsManager.getTooltip(card.category, card.family) + "<br><br><i>".concat(this.COLORS[card.color], "</i>"));
            }
        }
    };
    Cards.prototype.setVisibleInformations = function (div, card) {
        div.dataset.category = '' + card.category;
        div.dataset.family = '' + card.family;
        div.dataset.color = '' + card.color;
        div.dataset.index = '' + card.index;
    };
    Cards.prototype.removeVisibleInformations = function (div) {
        div.removeAttribute('data-category');
        div.removeAttribute('data-family');
        div.removeAttribute('data-color');
        div.removeAttribute('data-index');
    };
    Cards.prototype.removeCard = function (div) {
        if (!div) {
            return;
        }
        div.id = "deleted".concat(div.id);
        this.removeVisibleInformations(div);
        div.remove();
    };
    return Cards;
}());
var CardsManager = /** @class */ (function (_super) {
    __extends(CardsManager, _super);
    function CardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "ssp-card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.dataset.cardId = '' + card.id;
            },
            setupFrontDiv: function (card, div) {
                div.id = "".concat(_this.getId(card), "-front");
                div.dataset.category = '' + card.category;
                div.dataset.family = '' + card.family;
                div.dataset.color = '' + card.color;
                div.dataset.index = '' + card.index;
                game.setTooltip(div.id, _this.getTooltip(card.category, card.family));
            },
            animationManager: game.animationManager,
        }) || this;
        _this.game = game;
        return _this;
    }
    CardsManager.prototype.getTooltip = function (category, family /*, withCount: boolean = false*/) {
        var withCount = true;
        switch (category) {
            case 1:
                return "\n                <div><strong>".concat(_("Mermaid"), "</strong> ").concat(withCount ? '(x4)' : '', "</div>\n                ").concat(_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card."), "\n                <br><br>\n                <strong>").concat(_("Effect: If they place 4 mermaid cards, the player immediately wins the game."), "</strong>");
            case 2:
                if (family >= 4) {
                    return "<div><strong>".concat(_("Swimmer"), "/").concat(_("Shark"), "</strong> ").concat(withCount ? '(' + _('${number} of each').replace('${number}', 'x5') + ')' : '', "</div>\n                    <div>").concat(_("1 point for each combination of swimmer and shark cards."), "</div><br>\n                    <div>").concat(_("Effect:"), " ").concat(_("The player steals a random card from another player and adds it to their hand."), "</div>");
                }
                var duoCards = [
                    [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players."), 9],
                    [_('Boat'), _("The player immediately takes another turn."), 8],
                    [_('Fish'), _("The player adds the top card from the deck to their hand."), 7]
                ];
                var duo = duoCards[family - 1];
                return "<div><strong>".concat(duo[0], "</strong> ").concat(withCount ? "(x".concat(duo[2], ")") : '', "</div>\n                <div>").concat(_("1 point for each pair of ${card} cards.").replace('${card}', duo[0]), "</div><br>\n                <div>").concat(_("Effect:"), " ").concat(_(duo[1]), "</div>");
            case 3:
                var collectorCards = [
                    ['0, 2, 4, 6, 8, 10', '1, 2, 3, 4, 5, 6', _('Shell')],
                    ['0, 3, 6, 9, 12', '1, 2, 3, 4, 5', _('Octopus')],
                    ['1, 3, 5', '1, 2, 3', _('Penguin')],
                    ['0, 5', '1,  2', _('Sailor')],
                ];
                var collector = collectorCards[family - 1];
                return "<div><strong>".concat(collector[2], "</strong> ").concat(withCount ? "(x".concat(collector[0].split(',').length, ")") : '', "</div>\n                <div>").concat(_("${points} points depending on whether the player has ${numbers} ${card} cards.").replace('${points}', collector[0]).replace('${numbers}', collector[1]).replace('${card}', collector[2]), "</div>");
            case 4:
                var multiplierCards = [
                    [_('The lighthouse'), _('Boat'), 1],
                    [_('The shoal of fish'), _('Fish'), 1],
                    [_('The penguin colony'), _('Penguin'), 2],
                    [_('The captain'), _('Sailor'), 3],
                ];
                var multiplier = multiplierCards[family - 1];
                return "<div><strong>".concat(multiplier[0], "</strong> (x1)</div>\n                <div>").concat(_("${points} point(s) per ${card} card.").replace('${points}', multiplier[2]).replace('${card}', multiplier[1]), "</div>\n                <div>").concat(_("This card does not count as a ${card} card.").replace('${card}', multiplier[1]), "</div>");
        }
    };
    return CardsManager;
}(CardManager));
var Stacks = /** @class */ (function () {
    function Stacks(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.discardCounters = [];
        this.deckDiv.addEventListener('click', function () { return _this.game.takeCardsFromDeck(); });
        this.deckCounter = new ebg.counter();
        this.deckCounter.create("deck-counter");
        this.setDeckCount(gamedatas.remainingCardsInDeck);
        [1, 2].forEach(function (number) {
            if (gamedatas["discardTopCard".concat(number)]) {
                game.cards.createMoveOrUpdateCard(gamedatas["discardTopCard".concat(number)], "discard".concat(number));
            }
            document.getElementById("discard".concat(number)).addEventListener('click', function () { return _this.game.onDiscardPileClick(number); });
            _this.discardCounters[number] = new ebg.counter();
            _this.discardCounters[number].create("discard".concat(number, "-counter"));
            _this.discardCounters[number].setValue(gamedatas["remainingCardsInDiscard".concat(number)]);
        });
    }
    Object.defineProperty(Stacks.prototype, "deckDiv", {
        get: function () {
            return document.getElementById('deck');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Stacks.prototype, "pickDiv", {
        get: function () {
            return document.getElementById('pick');
        },
        enumerable: false,
        configurable: true
    });
    Stacks.prototype.makeDeckSelectable = function (selectable) {
        this.deckDiv.classList.toggle('selectable', selectable);
    };
    Stacks.prototype.makeDiscardSelectable = function (selectable) {
        var _this = this;
        [1, 2].forEach(function (number) { var _a; return (_a = _this.getDiscardCard(number)) === null || _a === void 0 ? void 0 : _a.classList.toggle('selectable', selectable); });
    };
    Stacks.prototype.makePickSelectable = function (selectable) {
        var cards = Array.from(this.pickDiv.getElementsByClassName('old-card'));
        cards.forEach(function (card) { return card.classList.toggle('selectable', selectable); });
    };
    Stacks.prototype.showPickCards = function (show, cards) {
        var _this = this;
        this.pickDiv.dataset.visible = show.toString();
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            var _a, _b;
            if (((_b = (_a = document.getElementById("card-".concat(card.id))) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.id) !== 'pick') {
                // start hidden
                _this.game.cards.createMoveOrUpdateCard({
                    id: card.id
                }, "pick", true, 'deck');
                // set card informations
                setTimeout(function () { return _this.game.cards.updateCard(card); }, 1);
            }
        });
        this.game.updateTableHeight();
    };
    Stacks.prototype.getDiscardCard = function (discardNumber) {
        var currentCardDivs = Array.from(document.getElementById("discard".concat(discardNumber)).getElementsByClassName('old-card'));
        return currentCardDivs.length > 0 ? currentCardDivs[0] : null;
    };
    Stacks.prototype.setDeckCount = function (number) {
        this.deckCounter.setValue(number);
        document.getElementById("deck").classList.toggle('hidden', number == 0);
    };
    return Stacks;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var CATEGORY_ORDER = [null, 4, 1, 2, 3];
function sortCards(a, b) {
    return (CATEGORY_ORDER[a.category] * 100 + a.family * 10 + a.color) - (CATEGORY_ORDER[b.category] * 100 + b.family * 10 + b.color);
}
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\">\n            <div id=\"player-table-").concat(this.playerId, "-hand-cards\" class=\"hand cards\" data-player-id=\"").concat(this.playerId, "\" data-current-player=\"").concat(this.currentPlayer.toString(), "\" data-my-hand=\"").concat(this.currentPlayer.toString(), "\"></div>\n            <div class=\"name-wrapper\">\n                <span class=\"name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</span>\n                <div class=\"bubble-wrapper\">\n                    <div id=\"player-table-").concat(this.playerId, "-discussion-bubble\" class=\"discussion_bubble\" data-visible=\"false\"></div>\n                </div>\n        ");
        if (this.currentPlayer) {
            html += "<span class=\"counter\">\n                    (".concat(_('Cards points:'), "&nbsp;<span id=\"cards-points-counter\"></span>)\n                </span>");
        }
        html += "</div>\n            <div id=\"player-table-".concat(this.playerId, "-table-cards\" class=\"table cards\">\n            </div>\n        </div>\n        ");
        dojo.place(html, document.getElementById('tables'));
        if (this.currentPlayer) {
            this.cardsPointsCounter = new ebg.counter();
            this.cardsPointsCounter.create("cards-points-counter");
            this.cardsPointsCounter.setValue(player.cardsPoints);
        }
        var stockSettings = {
            gap: '0px',
            sort: sortCards,
        };
        this.handCards = new LineStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-hand-cards")), __assign(__assign({}, stockSettings), { wrap: this.currentPlayer ? 'wrap' : 'nowrap' }));
        this.handCards.onCardClick = function (card) { return _this.game.onCardClick(card); };
        this.tableCards = new LineStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-table-cards")), stockSettings);
        this.addCardsToHand(player.handCards);
        this.addCardsToTable(player.tableCards);
        if (player.endCall) {
            var args = {
                announcement: player.endCall.announcement,
                result: player.endCall.betResult,
            };
            this.game.format_string_recursive('log', args);
            this.showAnnouncement(args.announcement);
            this.showAnnouncementPoints(player.endCall.cardsPoints);
            if (player.endCall.betResult) {
                this.showAnnouncementBetResult(args.result);
            }
        }
        else if (player.endRoundPoints) {
            this.showAnnouncementPoints(player.endRoundPoints.cardsPoints);
        }
        if (player.scoringDetail) {
            this.showScoreDetails(player.scoringDetail);
        }
    }
    Object.defineProperty(PlayerTable.prototype, "handCardsDiv", {
        get: function () {
            return document.getElementById("player-table-".concat(this.playerId, "-hand-cards"));
        },
        enumerable: false,
        configurable: true
    });
    PlayerTable.prototype.addCardsToHand = function (cards, from) {
        var _this = this;
        cards.forEach(function (card) {
            var _a;
            return _this.handCards.addCard(card, {
                fromElement: (_a = document.getElementById("card-".concat(card.id))) !== null && _a !== void 0 ? _a : (from ? document.getElementById(from) : undefined),
            }, {
                visible: _this.currentPlayer
            });
        });
        var cardsIds = cards.map(function (card) { return card.id; });
        var cardsDiv = Array.from(document.getElementsByClassName('old-card'));
        cardsDiv.filter(function (cardDiv) { return cardsIds.includes(Number(cardDiv.dataset.id)); }).forEach(function (cardDiv) { return _this.game.cards.removeCard(cardDiv); });
        //this.tableCards.addCards(cards);
        this.game.updateTableHeight();
    };
    PlayerTable.prototype.addCardsToTable = function (cards) {
        var _this = this;
        cards.forEach(function (card) { return _this.game.cardsManager.setCardVisible(card, true, { updateData: true, updateFront: true, updateBack: false }); });
        this.tableCards.addCards(cards);
        this.game.updateTableHeight();
    };
    PlayerTable.prototype.cleanTable = function (deckStock) {
        var _this = this;
        var cards = Array.from(this.handCardsDiv.getElementsByClassName('old-card'));
        cards.forEach(function (cardDiv) { return _this.game.cards.createMoveOrUpdateCard({
            id: Number(cardDiv.dataset.id),
        }, "deck"); });
        deckStock.addCards(this.tableCards.getCards(), undefined, {
            visible: false,
        });
        setTimeout(function () { return cards.forEach(function (cardDiv) { return _this.game.cards.removeCard(cardDiv); }); }, 500);
        this.game.updateTableHeight();
        this.clearAnnouncement();
    };
    PlayerTable.prototype.setHandPoints = function (cardsPoints) {
        this.cardsPointsCounter.toValue(cardsPoints);
    };
    PlayerTable.prototype.showAnnouncementPoints = function (playerPoints) {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += _('I got ${points} points.').replace('${points}', playerPoints) + ' ';
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.showAnnouncement = function (announcement) {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += _('I announce ${announcement}!').replace('${announcement}', _(announcement)) + ' ';
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.clearAnnouncement = function () {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML = '';
        bubble.dataset.visible = 'false';
    };
    PlayerTable.prototype.showAnnouncementBetResult = function (result) {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += "<div>".concat(_('I ${result} my bet!').replace('${result}', _(result)), "</div>");
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.showEmptyDeck = function () {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += "<div>".concat(_('I score no points, because deck is empty and no one called the end of the round'), "</div>");
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.showScoreDetails = function (scoreDetails) {
        if (scoreDetails.cardsPoints === null && scoreDetails.colorBonus === null) {
            this.showEmptyDeck();
            return;
        }
        var scoreDetailStr = '<div class="bubble-score">';
        if (scoreDetails.cardsPoints !== null && scoreDetails.colorBonus !== null) {
            scoreDetailStr += _('I score my ${cardPoints} card points plus my color bonus of ${colorBonus}.').replace('${cardPoints}', scoreDetails.cardsPoints).replace('${colorBonus}', scoreDetails.colorBonus);
        }
        else if (scoreDetails.cardsPoints === null && scoreDetails.colorBonus !== null) {
            scoreDetailStr += _('I only score my color bonus of ${colorBonus}.').replace('${colorBonus}', scoreDetails.colorBonus);
        }
        else if (scoreDetails.cardsPoints !== null && scoreDetails.colorBonus === null) {
            scoreDetailStr += _('I score my ${cardPoints} card points.').replace('${cardPoints}', scoreDetails.cardsPoints);
        }
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += scoreDetailStr + "</div>";
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.setSelectable = function (selectable) {
        var cards = Array.from(this.handCardsDiv.getElementsByClassName('card'));
        if (selectable) {
            cards.forEach(function (card) { return card.classList.add('selectable'); });
        }
        else {
            cards.forEach(function (card) { return card.classList.remove('selectable', 'selected', 'disabled'); });
        }
    };
    PlayerTable.prototype.updateDisabledPlayCards = function (selectedCards, playableDuoCardFamilies) {
        var _this = this;
        if (!this.game.isCurrentPlayerActive()) {
            return;
        }
        var cards = this.handCards.getCards();
        cards.forEach(function (card) {
            var disabled = false;
            if (card.category != 2) {
                disabled = true;
            }
            else {
                if (playableDuoCardFamilies.includes(card.family)) {
                    if (selectedCards.length >= 2) {
                        disabled = !selectedCards.includes(card.id);
                    }
                    else if (selectedCards.length == 1) {
                        var family = cards.find(function (card) { return card.id == selectedCards[0]; }).family;
                        var authorizedFamily = family >= 4 ? 9 - family : family;
                        disabled = card.id != selectedCards[0] && card.family != authorizedFamily;
                    }
                }
                else {
                    disabled = true;
                }
            }
            _this.handCards.getCardElement(card).classList.toggle('disabled', disabled);
        });
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';
var POINTS_FOR_PLAYERS = [null, null, 40, 35, 30];
var SeaSaltPaper = /** @class */ (function () {
    function SeaSaltPaper() {
        this.playersTables = [];
        this.handCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    SeaSaltPaper.prototype.setup = function (gamedatas) {
        var _this = this;
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        this.cards = new Cards(this);
        this.stacks = new Stacks(this, this.gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        this.deckVoidStock = new VoidStock(this.cardsManager, document.getElementById('deck'));
        this.zoomManager = new ZoomManager({
            element: document.getElementById('full-table'),
            smooth: false,
            zoomControls: {
                color: 'white',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: function () { return _this.onTableCenterSizeChange(); },
        });
        this.setupNotifications();
        this.setupPreferences();
        this.addHelp();
        this.onScreenWidthChange = function () {
            _this.updateTableHeight();
        };
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    SeaSaltPaper.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'takeCards':
                this.onEnteringTakeCards(args);
                break;
            case 'chooseCard':
                this.onEnteringChooseCard(args.args);
                break;
            case 'putDiscardPile':
                this.onEnteringPutDiscardPile(args.args);
                break;
            case 'playCards':
                this.onEnteringPlayCards();
                break;
            case 'chooseDiscardPile':
                this.onEnteringChooseDiscardPile();
                break;
            case 'chooseDiscardCard':
                this.onEnteringChooseDiscardCard(args.args);
                break;
            case 'chooseOpponent':
                this.onEnteringChooseOpponent(args.args);
                break;
        }
    };
    SeaSaltPaper.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = "".concat(originalState['description' + property]);
        this.gamedatas.gamestate.descriptionmyturn = "".concat(originalState['descriptionmyturn' + property]);
        this.updatePageTitle();
    };
    SeaSaltPaper.prototype.onEnteringTakeCards = function (argsRoot) {
        var args = argsRoot.args;
        this.clearLogs(argsRoot.active_player);
        if (!args.canTakeFromDiscard.length) {
            this.setGamestateDescription('NoDiscard');
        }
        if (this.isCurrentPlayerActive()) {
            this.stacks.makeDeckSelectable(args.canTakeFromDeck);
            this.stacks.makeDiscardSelectable(true);
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseCard = function (args) {
        var _this = this;
        var _a, _b;
        this.stacks.showPickCards(true, (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) !== null && _b !== void 0 ? _b : args.cards);
        if (this.isCurrentPlayerActive()) {
            setTimeout(function () { return _this.stacks.makePickSelectable(true); }, 500);
        }
        else {
            this.stacks.makePickSelectable(false);
        }
        this.stacks.setDeckCount(args.remainingCardsInDeck);
    };
    SeaSaltPaper.prototype.onEnteringPutDiscardPile = function (args) {
        var _a, _b;
        this.stacks.showPickCards(true, (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) !== null && _b !== void 0 ? _b : args.cards);
        this.stacks.makeDiscardSelectable(this.isCurrentPlayerActive());
    };
    SeaSaltPaper.prototype.onEnteringPlayCards = function () {
        this.stacks.showPickCards(false);
        this.selectedCards = [];
        this.updateDisabledPlayCards();
    };
    SeaSaltPaper.prototype.onEnteringChooseDiscardPile = function () {
        this.stacks.makeDiscardSelectable(this.isCurrentPlayerActive());
    };
    SeaSaltPaper.prototype.onEnteringChooseDiscardCard = function (args) {
        var _this = this;
        var _a;
        var cards = ((_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) || args.cards;
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = '';
        pickDiv.dataset.visible = 'true';
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            _this.cards.createMoveOrUpdateCard(card, "discard-pick", false, 'discard' + args.discardNumber);
            if (_this.isCurrentPlayerActive()) {
                document.getElementById("card-".concat(card.id)).classList.add('selectable');
            }
        });
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.onEnteringChooseOpponent = function (args) {
        if (this.isCurrentPlayerActive()) {
            args.playersIds.forEach(function (playerId) {
                return document.getElementById("player-table-".concat(playerId, "-hand-cards")).dataset.canSteal = 'true';
            });
        }
    };
    SeaSaltPaper.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'takeCards':
                this.onLeavingTakeCards();
                break;
            case 'chooseCard':
                this.onLeavingChooseCard();
                break;
            case 'putDiscardPile':
                this.onLeavingPutDiscardPile();
                break;
            case 'playCards':
                this.onLeavingPlayCards();
                break;
            case 'chooseDiscardCard':
                this.onLeavingChooseDiscardCard();
                break;
            case 'chooseOpponent':
                this.onLeavingChooseOpponent();
                break;
        }
    };
    SeaSaltPaper.prototype.onLeavingTakeCards = function () {
        this.stacks.makeDeckSelectable(false);
        this.stacks.makeDiscardSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingChooseCard = function () {
        this.stacks.makePickSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingPutDiscardPile = function () {
        this.stacks.makeDiscardSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingPlayCards = function () {
        var _a;
        this.selectedCards = null;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingChooseDiscardCard = function () {
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.onLeavingChooseOpponent = function () {
        Array.from(document.querySelectorAll('[data-can-steal]')).forEach(function (elem) { return elem.dataset.canSteal = 'false'; });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    SeaSaltPaper.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'playCards':
                    var playCardsArgs = args;
                    this.addActionButton("playCards_button", _("Play selected cards"), function () { return _this.playSelectedCards(); });
                    if (playCardsArgs.hasFourMermaids) {
                        this.addActionButton("endGameWithMermaids_button", _("Play the four Mermaids"), function () { return _this.endGameWithMermaids(); }, null, true, 'red');
                    }
                    this.addActionButton("endTurn_button", _("End turn"), function () { return _this.endTurn(); });
                    if (playCardsArgs.canCallEndRound) {
                        this.addActionButton("endRound_button", _('End round') + ' ("' + _('LAST CHANCE') + '")', function () { return _this.endRound(); }, null, null, 'red');
                        this.addActionButton("immediateEndRound_button", _('End round') + ' ("' + _('STOP') + '")', function () { return _this.immediateEndRound(); }, null, null, 'red');
                        this.setTooltip("endRound_button", "".concat(_("Say <strong>LAST CHANCE</strong> if you are willing to take the bet of having the most points at the end of the round. The other players each take a final turn (take a card + play cards) which they complete by revealing their hand, which is now protected from attacks. Then, all players count the points on their cards (in their hand and in front of them)."), "<br><br>\n                        ").concat(_("If your hand is higher or equal to that of your opponents, bet won! You score the points for your cards + the color bonus (1 point per card of the color they have the most of). Your opponents only score their color bonus."), "<br><br>\n                        ").concat(_("If your score is less than that of at least one opponent, bet lost! You score only the color bonus. Your opponents score points for their cards.")));
                        this.setTooltip("immediateEndRound_button", _("Say <strong>STOP</strong> if you do not want to take a risk. All players reveal their hands and immediately score the points on their cards (in their hand and in front of them)."));
                    }
                    dojo.addClass("playCards_button", "disabled");
                    /*if (!playCardsArgs.canCallEndRound) {
                        dojo.addClass(`endRound_button`, `disabled`);
                        dojo.addClass(`immediateEndRound_button`, `disabled`);
                    }*/
                    if (!playCardsArgs.canDoAction) {
                        this.startActionTimer('endTurn_button', ACTION_TIMER_DURATION + Math.round(3 * Math.random()));
                    }
                    break;
                /*case 'chooseOpponent':
                    const chooseOpponentArgs = args as EnteringChooseOpponentArgs;
        
                    chooseOpponentArgs.playersIds.forEach(playerId => {
                        const player = this.getPlayer(playerId);
                        (this as any).addActionButton(`choosePlayer${playerId}-button`, player.name, () => this.chooseOpponent(playerId));
                        document.getElementById(`choosePlayer${playerId}-button`).style.border = `3px solid #${player.color}`;
                    });
                    break;*/
                case 'beforeEndRound':
                    this.addActionButton("seen_button", _("Seen"), function () { return _this.seen(); });
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    SeaSaltPaper.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    SeaSaltPaper.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    SeaSaltPaper.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    SeaSaltPaper.prototype.getPlayerColor = function (playerId) {
        return this.gamedatas.players[playerId].color;
    };
    SeaSaltPaper.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    SeaSaltPaper.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    SeaSaltPaper.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    SeaSaltPaper.prototype.updateTableHeight = function () {
        var _a;
        (_a = this.zoomManager) === null || _a === void 0 ? void 0 : _a.manualHeightUpdate();
    };
    SeaSaltPaper.prototype.onTableCenterSizeChange = function () {
        var maxWidth = document.getElementById('full-table').clientWidth;
        var tableCenterWidth = document.getElementById('table-center').clientWidth + 20;
        var playerTableWidth = 650 + 20;
        var tablesMaxWidth = maxWidth - tableCenterWidth;
        var width = 'unset';
        if (tablesMaxWidth < playerTableWidth * this.gamedatas.playerorder.length) {
            var reduced = (Math.floor(tablesMaxWidth / playerTableWidth) * playerTableWidth);
            if (reduced > 0) {
                width = "".concat(reduced, "px");
            }
        }
        document.getElementById('tables').style.width = width;
    };
    SeaSaltPaper.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    SeaSaltPaper.prototype.getOrderedPlayers = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    SeaSaltPaper.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // show end game points
            dojo.place("<span class=\"end-game-points\">&nbsp;/&nbsp;".concat(POINTS_FOR_PLAYERS[Object.keys(gamedatas.players).length], "</span>"), "player_score_".concat(playerId), 'after');
            // hand cards counter
            dojo.place("<div class=\"counters\">\n                <div id=\"playerhand-counter-wrapper-".concat(player.id, "\" class=\"playerhand-counter\">\n                    <div class=\"player-hand-card\"></div> \n                    <span id=\"playerhand-counter-").concat(player.id, "\"></span>\n                </div>\n            </div>"), "player_board_".concat(player.id));
            var handCounter = new ebg.counter();
            handCounter.create("playerhand-counter-".concat(playerId));
            handCounter.setValue(player.handCards.length);
            _this.handCounters[playerId] = handCounter;
        });
        this.setTooltipToClass('playerhand-counter', _('Number of cards in hand'));
    };
    SeaSaltPaper.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    SeaSaltPaper.prototype.createPlayerTable = function (gamedatas, playerId) {
        var table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    };
    SeaSaltPaper.prototype.updateDisabledPlayCards = function () {
        var _a, _b;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.updateDisabledPlayCards(this.selectedCards, this.gamedatas.gamestate.args.playableDuoCards);
        (_b = document.getElementById("playCards_button")) === null || _b === void 0 ? void 0 : _b.classList.toggle("disabled", this.selectedCards.length != 2);
    };
    SeaSaltPaper.prototype.onCardClick = function (card) {
        var _a;
        var cardDiv = (_a = document.getElementById("card-".concat(card.id))) !== null && _a !== void 0 ? _a : document.getElementById("ssp-card-".concat(card.id));
        var parentDiv = cardDiv.parentElement;
        if (cardDiv.classList.contains('disabled')) {
            return;
        }
        switch (this.gamedatas.gamestate.name) {
            case 'takeCards':
                if (parentDiv.dataset.discard) {
                    this.takeCardFromDiscard(Number(parentDiv.dataset.discard));
                }
                break;
            case 'chooseCard':
                if (parentDiv.id == 'pick') {
                    this.chooseCard(card.id);
                }
                break;
            case 'playCards':
                if (parentDiv.dataset.myHand == "true") {
                    if (this.selectedCards.includes(card.id)) {
                        this.selectedCards.splice(this.selectedCards.indexOf(card.id), 1);
                        cardDiv.classList.remove('selected');
                    }
                    else {
                        this.selectedCards.push(card.id);
                        cardDiv.classList.add('selected');
                    }
                    this.updateDisabledPlayCards();
                }
                break;
            case 'chooseDiscardCard':
                if (parentDiv.id == 'discard-pick') {
                    this.chooseDiscardCard(card.id);
                }
                break;
            case 'chooseOpponent':
                var chooseOpponentArgs = this.gamedatas.gamestate.args;
                if (parentDiv.dataset.currentPlayer == 'false') {
                    var stealPlayerId = Number(parentDiv.dataset.playerId);
                    if (chooseOpponentArgs.playersIds.includes(stealPlayerId)) {
                        this.chooseOpponent(stealPlayerId);
                    }
                }
                break;
        }
    };
    SeaSaltPaper.prototype.onDiscardPileClick = function (number) {
        switch (this.gamedatas.gamestate.name) {
            case 'putDiscardPile':
                this.putDiscardPile(number);
                break;
            case 'chooseDiscardPile':
                this.chooseDiscardPile(number);
                break;
        }
    };
    SeaSaltPaper.prototype.playSelectedCards = function () {
        if (this.selectedCards.length == 2) {
            this.playCards(this.selectedCards);
        }
    };
    SeaSaltPaper.prototype.addHelp = function () {
        var _this = this;
        var labels = [
            _('Dark blue'),
            _('Light blue'),
            _('Black'),
            _('Yellow'),
            _('Green'),
            _('White'),
            _('Purple'),
            _('Gray'),
            _('Light orange'),
            _('Pink'),
            _('Orange'),
        ].map(function (label, index) { return "<span class=\"label\" data-row=\"".concat(Math.floor(index / 2), "\"  data-column=\"").concat(Math.floor(index % 2), "\">").concat(label, "</span>"); }).join('');
        dojo.place("\n            <button id=\"seasaltpaper-help-button\">?</button>\n            <button id=\"color-help-button\" data-folded=\"true\">".concat(labels, "</button>\n        "), 'left-side');
        document.getElementById('seasaltpaper-help-button').addEventListener('click', function () { return _this.showHelp(); });
        var helpButton = document.getElementById('color-help-button');
        helpButton.addEventListener('click', function () { return helpButton.dataset.folded = helpButton.dataset.folded == 'true' ? 'false' : 'true'; });
    };
    SeaSaltPaper.prototype.showHelp = function () {
        var _this = this;
        var helpDialog = new ebg.popindialog();
        helpDialog.create('seasaltpaperHelpDialog');
        helpDialog.setTitle(_("Card details").toUpperCase());
        var duoCards = [1, 2, 3].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-pair-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(2, family), "</div>\n        </div>\n        "); }).join('');
        var duoSection = "\n        ".concat(duoCards, "\n        <div class=\"help-section\">\n            <div id=\"help-pair-4\"></div>\n            <div id=\"help-pair-5\"></div>\n            <div>").concat(this.cardsManager.getTooltip(2, 4), "</div>\n        </div>\n        ").concat(_("Note: The points for duo cards count whether the cards have been played or not. However, the effect is only applied when the player places the two cards in front of them."));
        var mermaidSection = "\n        <div class=\"help-section\">\n            <div id=\"help-mermaid\"></div>\n            <div>".concat(this.cardsManager.getTooltip(1), "</div>\n        </div>");
        var collectorSection = [1, 2, 3, 4].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-collector-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(3, family), "</div>\n        </div>\n        "); }).join('');
        var multiplierSection = [1, 2, 3, 4].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-multiplier-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(4, family), "</div>\n        </div>\n        "); }).join('');
        var html = "\n        <div id=\"help-popin\">\n            ".concat(_("<strong>Important:</strong> When it is said that the player counts or scores the points on their cards, it means both those in their hand and those in front of them."), "\n\n            <h1>").concat(_("Duo cards"), "</h1>\n            ").concat(duoSection, "\n            <h1>").concat(_("Mermaid cards"), "</h1>\n            ").concat(mermaidSection, "\n            <h1>").concat(_("Collector cards"), "</h1>\n            ").concat(collectorSection, "\n            <h1>").concat(_("Point Multiplier cards"), "</h1>\n            ").concat(multiplierSection, "\n        </div>\n        ");
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
        // pair
        [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(function (_a) {
            var family = _a[0], color = _a[1];
            return _this.cards.createMoveOrUpdateCard({ id: 1020 + family, category: 2, family: family, color: color, index: 0 }, "help-pair-".concat(family));
        });
        // mermaid
        this.cards.createMoveOrUpdateCard({ id: 1010, category: 1 }, "help-mermaid");
        // collector
        [[1, 1], [2, 2], [3, 6], [4, 9]].forEach(function (_a) {
            var family = _a[0], color = _a[1];
            return _this.cards.createMoveOrUpdateCard({ id: 1030 + family, category: 3, family: family, color: color, index: 0 }, "help-collector-".concat(family));
        });
        // multiplier
        [1, 2, 3, 4].forEach(function (family) { return _this.cards.createMoveOrUpdateCard({ id: 1040 + family, category: 4, family: family }, "help-multiplier-".concat(family)); });
    };
    SeaSaltPaper.prototype.takeCardsFromDeck = function () {
        if (!this.checkAction('takeCardsFromDeck')) {
            return;
        }
        this.takeAction('takeCardsFromDeck');
    };
    SeaSaltPaper.prototype.takeCardFromDiscard = function (discardNumber) {
        if (!this.checkAction('takeCardFromDiscard')) {
            return;
        }
        this.takeAction('takeCardFromDiscard', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.chooseCard = function (id) {
        if (!this.checkAction('chooseCard')) {
            return;
        }
        this.takeAction('chooseCard', {
            id: id
        });
    };
    SeaSaltPaper.prototype.putDiscardPile = function (discardNumber) {
        if (!this.checkAction('putDiscardPile')) {
            return;
        }
        this.takeAction('putDiscardPile', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.playCards = function (ids) {
        if (!this.checkAction('playCards')) {
            return;
        }
        this.takeAction('playCards', {
            'id1': ids[0],
            'id2': ids[1],
        });
    };
    SeaSaltPaper.prototype.chooseDiscardPile = function (discardNumber) {
        if (!this.checkAction('chooseDiscardPile')) {
            return;
        }
        this.takeAction('chooseDiscardPile', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.chooseDiscardCard = function (id) {
        if (!this.checkAction('chooseDiscardCard')) {
            return;
        }
        this.takeAction('chooseDiscardCard', {
            id: id
        });
    };
    SeaSaltPaper.prototype.chooseOpponent = function (id) {
        if (!this.checkAction('chooseOpponent')) {
            return;
        }
        this.takeAction('chooseOpponent', {
            id: id
        });
    };
    SeaSaltPaper.prototype.endTurn = function () {
        if (!this.checkAction('endTurn')) {
            return;
        }
        this.takeAction('endTurn');
    };
    SeaSaltPaper.prototype.endGameWithMermaids = function () {
        if (!this.checkAction('endGameWithMermaids')) {
            return;
        }
        this.takeAction('endGameWithMermaids');
    };
    SeaSaltPaper.prototype.endRound = function () {
        if (!this.checkAction('endRound')) {
            return;
        }
        this.takeAction('endRound');
    };
    SeaSaltPaper.prototype.immediateEndRound = function () {
        if (!this.checkAction('immediateEndRound')) {
            return;
        }
        this.takeAction('immediateEndRound');
    };
    SeaSaltPaper.prototype.seen = function () {
        if (!this.checkAction('seen')) {
            return;
        }
        this.takeAction('seen');
    };
    SeaSaltPaper.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/seasaltpaper/seasaltpaper/".concat(action, ".html"), data, this, function () { });
    };
    SeaSaltPaper.prototype.startActionTimer = function (buttonId, time) {
        var _a;
        if (Number((_a = this.prefs[202]) === null || _a === void 0 ? void 0 : _a.value) === 2) {
            return;
        }
        var button = document.getElementById(buttonId);
        var actionTimerId = null;
        var _actionTimerLabel = button.innerHTML;
        var _actionTimerSeconds = time;
        var actionTimerFunction = function () {
            var button = document.getElementById(buttonId);
            if (button == null || button.classList.contains('disabled')) {
                window.clearInterval(actionTimerId);
            }
            else if (_actionTimerSeconds-- > 1) {
                button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
            }
            else {
                window.clearInterval(actionTimerId);
                button.click();
            }
        };
        actionTimerFunction();
        actionTimerId = window.setInterval(function () { return actionTimerFunction(); }, 1000);
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    SeaSaltPaper.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        dojo.connect(this.notifqueue, 'addToLog', function () { return _this.addLogClass(); });
        var notifs = [
            ['cardInDiscardFromDeck', ANIMATION_MS],
            ['cardInHandFromDiscard', ANIMATION_MS],
            ['cardInHandFromDiscardCrab', ANIMATION_MS],
            ['cardInHandFromPick', ANIMATION_MS],
            ['cardInHandFromDeck', ANIMATION_MS],
            ['cardInDiscardFromPick', ANIMATION_MS],
            ['playCards', ANIMATION_MS],
            ['stealCard', ANIMATION_MS],
            ['revealHand', ANIMATION_MS * 2],
            ['announceEndRound', ANIMATION_MS * 2],
            ['betResult', ANIMATION_MS * 2],
            ['endRound', ANIMATION_MS * 2],
            ['score', ANIMATION_MS * 3],
            ['newRound', 1],
            ['updateCardsPoints', 1],
            ['emptyDeck', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
        this.notifqueue.setIgnoreNotificationCheck('cardInHandFromPick', function (notif) {
            return notif.args.playerId == _this.getPlayerId() && !notif.args.card.category;
        });
        this.notifqueue.setIgnoreNotificationCheck('cardInHandFromDeck', function (notif) {
            return notif.args.playerId == _this.getPlayerId() && !notif.args.card.category;
        });
        this.notifqueue.setIgnoreNotificationCheck('cardInHandFromDiscardCrab', function (notif) {
            return notif.args.playerId == _this.getPlayerId() && !notif.args.card.category;
        });
        this.notifqueue.setIgnoreNotificationCheck('stealCard', function (notif) {
            return [notif.args.playerId, notif.args.opponentId].includes(_this.getPlayerId()) && !notif.args.cardName;
        });
        this.addLogClass();
        this.clearLogsInit(this.gamedatas.gamestate.active_player);
    };
    SeaSaltPaper.prototype.onPlaceLogOnChannel = function (msg) {
        var currentLogId = this.notifqueue.next_log_id;
        var res = this.inherited(arguments);
        this.lastNotif = {
            logId: currentLogId,
            msg: msg,
        };
        return res;
    };
    SeaSaltPaper.prototype.addLogClass = function () {
        if (this.lastNotif == null) {
            return;
        }
        var notif = this.lastNotif;
        var elem = document.getElementById("log_".concat(notif.logId));
        if (elem) {
            var type = notif.msg.type;
            if (type == 'history_history')
                type = notif.msg.args.originalType;
            if (notif.msg.args.actionPlayerId) {
                elem.dataset.playerId = '' + notif.msg.args.actionPlayerId;
            }
        }
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromDeck = function (notif) {
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(notif.args.discardId), false, 'deck');
        this.stacks.discardCounters[notif.args.discardId].setValue(1);
        this.stacks.setDeckCount(notif.args.remainingCardsInDeck);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscard = function (notif) {
        var card = notif.args.card;
        var playerId = notif.args.playerId;
        var discardNumber = notif.args.discardId;
        var maskedCard = playerId == this.getPlayerId() ? card : { id: card.id };
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);
        this.handCounters[playerId].incValue(1);
        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, "discard".concat(discardNumber), true);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscardCrab = function (notif) {
        var card = notif.args.card;
        var playerId = notif.args.playerId;
        var discardNumber = notif.args.discardId;
        var maskedCard = playerId == this.getPlayerId() ? card : { id: card.id };
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);
        this.handCounters[playerId].incValue(1);
        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, "discard".concat(discardNumber), true);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_cardInHandFromPick = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card]);
        this.handCounters[playerId].incValue(1);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDeck = function (notif) {
        var playerId = notif.args.playerId;
        // start hidden
        this.cards.createMoveOrUpdateCard({
            id: notif.args.card.id
        }, "pick", true, 'deck');
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card], 'deck');
        this.handCounters[playerId].incValue(1);
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromPick = function (notif) {
        var _this = this;
        var currentCardDiv = this.stacks.getDiscardCard(notif.args.discardId);
        var discardNumber = notif.args.discardId;
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(discardNumber));
        if (currentCardDiv) {
            setTimeout(function () { return _this.cards.removeCard(currentCardDiv); }, 500);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_score = function (notif) {
        var _a;
        var playerId = notif.args.playerId;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(notif.args.newScore);
        var incScore = notif.args.incScore;
        if (incScore != null && incScore !== undefined) {
            this.displayScoring("player-table-".concat(playerId, "-table-cards"), this.getPlayerColor(playerId), incScore, ANIMATION_MS * 3);
        }
        if (notif.args.details) {
            this.getPlayerTable(notif.args.playerId).showScoreDetails(notif.args.details);
        }
    };
    SeaSaltPaper.prototype.notif_newRound = function () { };
    SeaSaltPaper.prototype.notif_playCards = function (notif) {
        var playerId = notif.args.playerId;
        var cards = notif.args.cards;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.addCardsToTable(cards);
        this.handCounters[playerId].incValue(-cards.length);
    };
    SeaSaltPaper.prototype.notif_revealHand = function (notif) {
        var playerId = notif.args.playerId;
        var playerPoints = notif.args.playerPoints;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.showAnnouncementPoints(playerPoints);
        this.notif_playCards(notif);
        this.handCounters[playerId].toValue(0);
    };
    SeaSaltPaper.prototype.notif_stealCard = function (notif) {
        var stealerId = notif.args.playerId;
        var card = notif.args.card;
        this.getPlayerTable(stealerId).addCardsToHand([card]);
        this.handCounters[notif.args.opponentId].incValue(-1);
        this.handCounters[stealerId].incValue(1);
    };
    SeaSaltPaper.prototype.notif_announceEndRound = function (notif) {
        this.getPlayerTable(notif.args.playerId).showAnnouncement(notif.args.announcement);
    };
    SeaSaltPaper.prototype.notif_endRound = function () {
        var _this = this;
        var _a;
        this.playersTables.forEach(function (playerTable) {
            playerTable.cleanTable(_this.deckVoidStock);
            _this.handCounters[playerTable.playerId].setValue(0);
        });
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(0);
        [1, 2].forEach(function (discardNumber) {
            var currentCardDiv = _this.stacks.getDiscardCard(discardNumber);
            _this.cards.removeCard(currentCardDiv); // animate cards to deck?
        });
        [1, 2].forEach(function (discardNumber) { return _this.stacks.discardCounters[discardNumber].setValue(0); });
        this.stacks.setDeckCount(58);
    };
    SeaSaltPaper.prototype.notif_updateCardsPoints = function (notif) {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(notif.args.cardsPoints);
    };
    SeaSaltPaper.prototype.notif_betResult = function (notif) {
        this.getPlayerTable(notif.args.playerId).showAnnouncementBetResult(notif.args.result);
    };
    SeaSaltPaper.prototype.notif_emptyDeck = function () {
        this.playersTables.forEach(function (playerTable) { return playerTable.showEmptyDeck(); });
    };
    SeaSaltPaper.prototype.clearLogs = function (activePlayer) {
        var _this = this;
        var logDivs = Array.from(document.getElementById('logs').getElementsByClassName('log'));
        var hide = false;
        logDivs.forEach(function (logDiv) {
            var _a;
            if (!hide && logDiv.dataset.playerId == activePlayer) {
                hide = true;
            }
            if (hide) {
                logDiv.style.display = 'none';
                (_a = document.querySelector("#chatwindowlogs_zone_tablelog_".concat(_this.table_id, " #docked").concat(logDiv.id))) === null || _a === void 0 ? void 0 : _a.classList.add('hidden-log-action');
            }
        });
    };
    SeaSaltPaper.prototype.clearLogsInit = function (activePlayer) {
        var _this = this;
        if (this.log_history_loading_status.downloaded && this.log_history_loading_status.loaded >= this.log_history_loading_status.total) {
            this.clearLogs(activePlayer);
        }
        else {
            setTimeout(function () { return _this.clearLogsInit(activePlayer); }, 100);
        }
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    SeaSaltPaper.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = "<strong style=\"color: darkred;\">".concat(_(args.announcement), "</strong>");
                }
                if (args.call && args.call.length && args.call[0] != '<') {
                    args.call = "<strong class=\"title-bar-call\">".concat(_(args.call), "</strong>");
                }
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus', 'cardName', 'cardName1', 'cardName2', 'cardColor', 'cardColor1', 'cardColor2', 'points', 'result'].forEach(function (field) {
                    if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
                        args[field] = "<strong>".concat(_(args[field]), "</strong>");
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return SeaSaltPaper;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.seasaltpaper", ebg.core.gamegui, new SeaSaltPaper());
});
