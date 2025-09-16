var BgaAnimation = /** @class */ (function () {
    function BgaAnimation(animationFunction, settings) {
        this.animationFunction = animationFunction;
        this.settings = settings;
        this.played = null;
        this.result = null;
        this.playWhenNoAnimation = false;
    }
    return BgaAnimation;
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
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager, animation) {
    var _a;
    var settings = animation.settings;
    var element = settings.animation.settings.element;
    var fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    (_a = settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, settings.attachElement);
    return animationManager.play(settings.animation);
}
var BgaAttachWithAnimation = /** @class */ (function (_super) {
    __extends(BgaAttachWithAnimation, _super);
    function BgaAttachWithAnimation(settings) {
        var _this = _super.call(this, attachWithAnimation, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaAttachWithAnimation;
}(BgaAnimation));
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager, animation) {
    return animationManager.playSequence(animation.settings.animations);
}
var BgaCumulatedAnimation = /** @class */ (function (_super) {
    __extends(BgaCumulatedAnimation, _super);
    function BgaCumulatedAnimation(settings) {
        var _this = _super.call(this, cumulatedAnimations, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaCumulatedAnimation;
}(BgaAnimation));
/**
 * Just does nothing for the duration
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function pauseAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a;
        var settings = animation.settings;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        setTimeout(function () { return success(); }, duration);
    });
    return promise;
}
var BgaPauseAnimation = /** @class */ (function (_super) {
    __extends(BgaPauseAnimation, _super);
    function BgaPauseAnimation(settings) {
        return _super.call(this, pauseAnimation, settings) || this;
    }
    return BgaPauseAnimation;
}(BgaAnimation));
/**
 * Show the element at the center of the screen
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function showScreenCenterAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var elementBR = element.getBoundingClientRect();
        var xCenter = (elementBR.left + elementBR.right) / 2;
        var yCenter = (elementBR.top + elementBR.bottom) / 2;
        var x = xCenter - (window.innerWidth / 2);
        var y = yCenter - (window.innerHeight / 2);
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "".concat((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
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
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms ").concat(transitionTimingFunction);
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0, "deg)");
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaShowScreenCenterAnimation = /** @class */ (function (_super) {
    __extends(BgaShowScreenCenterAnimation, _super);
    function BgaShowScreenCenterAnimation(settings) {
        return _super.call(this, showScreenCenterAnimation, settings) || this;
    }
    return BgaShowScreenCenterAnimation;
}(BgaAnimation));
/**
 * Slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "".concat((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0, "deg)");
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
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
        element.style.transition = "transform ".concat(duration, "ms ").concat(transitionTimingFunction);
        element.offsetHeight;
        element.style.transform = (_e = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _e !== void 0 ? _e : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideAnimation, _super);
    function BgaSlideAnimation(settings) {
        return _super.call(this, slideAnimation, settings) || this;
    }
    return BgaSlideAnimation;
}(BgaAnimation));
/**
 * Slide of the element from destination to origin.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d, _e;
        var settings = animation.settings;
        var element = settings.element;
        var _f = getDeltaCoordinates(element, settings), x = _f.x, y = _f.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        var transitionTimingFunction = (_b = settings.transitionTimingFunction) !== null && _b !== void 0 ? _b : 'linear';
        element.style.zIndex = "".concat((_c = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _c !== void 0 ? _c : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
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
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms ").concat(transitionTimingFunction);
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_d = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _d !== void 0 ? _d : 0, "deg) scale(").concat((_e = settings.scale) !== null && _e !== void 0 ? _e : 1, ")");
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideToAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideToAnimation, _super);
    function BgaSlideToAnimation(settings) {
        return _super.call(this, slideToAnimation, settings) || this;
    }
    return BgaSlideToAnimation;
}(BgaAnimation));
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
function logAnimation(animationManager, animation) {
    var settings = animation.settings;
    var element = settings.element;
    if (element) {
        console.log(animation, settings, element, element.getBoundingClientRect(), element.style.transform);
    }
    else {
        console.log(animation, settings);
    }
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }
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
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    AnimationManager.prototype.animationsActive = function () {
        return document.visibilityState !== 'hidden' && !this.game.instantaneousMode;
    };
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    AnimationManager.prototype.play = function (animation) {
        return __awaiter(this, void 0, void 0, function () {
            var settings, _a;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        animation.played = animation.playWhenNoAnimation || this.animationsActive();
                        if (!animation.played) return [3 /*break*/, 2];
                        settings = animation.settings;
                        (_b = settings.animationStart) === null || _b === void 0 ? void 0 : _b.call(settings, animation);
                        (_c = settings.element) === null || _c === void 0 ? void 0 : _c.classList.add((_d = settings.animationClass) !== null && _d !== void 0 ? _d : 'bga-animations_animated');
                        animation.settings = __assign(__assign({}, animation.settings), { duration: (_h = (_f = (_e = animation.settings) === null || _e === void 0 ? void 0 : _e.duration) !== null && _f !== void 0 ? _f : (_g = this.settings) === null || _g === void 0 ? void 0 : _g.duration) !== null && _h !== void 0 ? _h : 500, scale: (_m = (_k = (_j = animation.settings) === null || _j === void 0 ? void 0 : _j.scale) !== null && _k !== void 0 ? _k : (_l = this.zoomManager) === null || _l === void 0 ? void 0 : _l.zoom) !== null && _m !== void 0 ? _m : undefined });
                        _a = animation;
                        return [4 /*yield*/, animation.animationFunction(this, animation)];
                    case 1:
                        _a.result = _s.sent();
                        (_p = (_o = animation.settings).animationEnd) === null || _p === void 0 ? void 0 : _p.call(_o, animation);
                        (_q = settings.element) === null || _q === void 0 ? void 0 : _q.classList.remove((_r = settings.animationClass) !== null && _r !== void 0 ? _r : 'bga-animations_animated');
                        return [3 /*break*/, 3];
                    case 2: return [2 /*return*/, Promise.resolve(animation)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(animations.map(function (animation) { return _this.play(animation); }))];
            });
        });
    };
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playSequence = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var result, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!animations.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.play(animations[0])];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.playSequence(animations.slice(1))];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, __spreadArray([result], others, true)];
                    case 3: return [2 /*return*/, Promise.resolve([])];
                }
            });
        });
    };
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playWithDelay = function (animations, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (success) {
                    var promises = [];
                    var _loop_1 = function (i) {
                        setTimeout(function () {
                            promises.push(_this.play(animations[i]));
                            if (i == animations.length - 1) {
                                Promise.all(promises).then(function (result) {
                                    success(result);
                                });
                            }
                        }, i * delay);
                    };
                    for (var i = 0; i < animations.length; i++) {
                        _loop_1(i);
                    }
                });
                return [2 /*return*/, promise];
            });
        });
    };
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (animation, attachElement) {
        var attachWithAnimation = new BgaAttachWithAnimation({
            animation: animation,
            attachElement: attachElement
        });
        return this.play(attachWithAnimation);
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * Creates the stock and register it on the manager.
     *
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.settings = settings;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * Removes the stock and unregister it on the manager.
     */
    CardStock.prototype.remove = function () {
        var _a;
        this.manager.removeStock(this);
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.remove();
    };
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
     * @returns the selected cards
     */
    CardStock.prototype.isSelected = function (card) {
        var _this = this;
        return this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return this.manager.getCardElement(card);
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.contains(card);
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
        var _this = this;
        var _a, _b, _c, _d, _e;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in a stock
        var originStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        var updateInformations = (_a = settingsWithIndex.updateInformations) !== null && _a !== void 0 ? _a : true;
        var needsCreation = true;
        if (originStock === null || originStock === void 0 ? void 0 : originStock.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: originStock }), settingsWithIndex);
                needsCreation = false;
                if (!updateInformations) {
                    element.dataset.side = ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : this.manager.isCardVisible(card)) ? 'front' : 'back';
                }
            }
        }
        else if ((_c = animation === null || animation === void 0 ? void 0 : animation.fromStock) === null || _c === void 0 ? void 0 : _c.contains(card)) {
            var element = this.getCardElement(card);
            if (element) {
                promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
                needsCreation = false;
            }
        }
        if (needsCreation) {
            var element = this.getCardElement(card);
            if (needsCreation && element) {
                console.warn("Card ".concat(this.manager.getId(card), " already exists, not re-created."));
            }
            // if the card comes from a stock but is not found in this stock, the card is probably hudden (deck with a fake top card)
            var fromBackSide = !(settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) && !(animation === null || animation === void 0 ? void 0 : animation.originalSide) && (animation === null || animation === void 0 ? void 0 : animation.fromStock) && !((_d = animation === null || animation === void 0 ? void 0 : animation.fromStock) === null || _d === void 0 ? void 0 : _d.contains(card));
            var createdVisible = fromBackSide ? false : (_e = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _e !== void 0 ? _e : this.manager.isCardVisible(card);
            var newElement = element !== null && element !== void 0 ? element : this.manager.createCardElement(card, createdVisible);
            promise = this.moveFromElement(card, newElement, animation, settingsWithIndex);
        }
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (updateInformations) { // after splice/push
            this.manager.updateCardInformations(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if (this.selectionMode !== 'none') {
            // make selectable only at the end of the animation
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settingsWithIndex.selectable) !== null && _a !== void 0 ? _a : true); });
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
        var element = animation.fromStock.contains(card) ? this.manager.getCardElement(card) : animation.fromStock.element;
        var fromRect = element === null || element === void 0 ? void 0 : element.getBoundingClientRect();
        this.addCardElementToParent(cardElement, settings);
        this.removeSelectionClassesFromElement(cardElement);
        promise = fromRect ? this.animationFromElement(cardElement, fromRect, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        }) : Promise.resolve(false);
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock && animation.fromStock != this) {
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
                promise = this.animationFromElement(cardElement, animation.fromStock.element.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement.getBoundingClientRect(), {
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
    CardStock.prototype.addCards = function (cards_1, animation_1, settings_1) {
        return __awaiter(this, arguments, void 0, function (cards, animation, settings, shift) {
            var promises, result, others, _loop_2, i, results;
            var _this = this;
            if (shift === void 0) { shift = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            shift = false;
                        }
                        promises = [];
                        if (!(shift === true)) return [3 /*break*/, 4];
                        if (!cards.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.addCard(cards[0], animation, settings)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.addCards(cards.slice(1), animation, settings, shift)];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, result || others];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (typeof shift === 'number') {
                            _loop_2 = function (i) {
                                promises.push(new Promise(function (resolve) {
                                    setTimeout(function () { return _this.addCard(cards[i], animation, settings).then(function (result) { return resolve(result); }); }, i * shift);
                                }));
                            };
                            for (i = 0; i < cards.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else {
                            promises = cards.map(function (card) { return _this.addCard(card, animation, settings); });
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, Promise.all(promises)];
                    case 6:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCard = function (card, settings) {
        var promise;
        if (this.contains(card) && this.element.contains(this.getCardElement(card))) {
            promise = this.manager.removeCard(card, settings);
        }
        else {
            promise = Promise.resolve(false);
        }
        this.cardRemoved(card, settings);
        return promise;
    };
    /**
     * Notify the stock that a card is removed.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.cardRemoved = function (card, settings) {
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
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCards = function (cards, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var promises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = cards.map(function (card) { return _this.removeCard(card, settings); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove all cards from the stock.
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeAll = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var cards;
            return __generator(this, function (_a) {
                cards = this.getCards();
                return [2 /*return*/, this.removeCards(cards, settings)];
            });
        });
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
     */
    CardStock.prototype.setSelectionMode = function (selectionMode, selectableCards) {
        var _this = this;
        if (selectionMode !== this.selectionMode) {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('bga-cards_selectable-stock', selectionMode != 'none');
        this.selectionMode = selectionMode;
        if (selectionMode === 'none') {
            this.getCards().forEach(function (card) { return _this.removeSelectionClasses(card); });
        }
        else {
            this.setSelectableCards(selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards());
        }
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        if (this.selectionMode === 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        if (selectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(selectableCardsClass, selectable);
        }
        if (unselectableCardsClass) {
            element === null || element === void 0 ? void 0 : element.classList.toggle(unselectableCardsClass, !selectable);
        }
        if (!selectable && this.isSelected(card)) {
            this.unselectCard(card, true);
        }
    };
    /**
     * Set the selectable class for each card.
     *
     * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
     */
    CardStock.prototype.setSelectableCards = function (selectableCards) {
        var _this = this;
        if (this.selectionMode === 'none') {
            return;
        }
        var selectableCardsIds = (selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards()).map(function (card) { return _this.manager.getId(card); });
        this.cards.forEach(function (card) {
            return _this.setSelectableCard(card, selectableCardsIds.includes(_this.manager.getId(card)));
        });
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
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        if (!element || !element.classList.contains(selectableCardsClass)) {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.add(selectedCardsClass);
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
        var selectedCardsClass = this.getSelectedCardClass();
        element === null || element === void 0 ? void 0 : element.classList.remove(selectedCardsClass);
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
    CardStock.prototype.animationFromElement = function (element, fromRect, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var side, cardSides_1, animation, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        side = element.dataset.side;
                        if (settings.originalSide && settings.originalSide != side) {
                            cardSides_1 = element.getElementsByClassName('card-sides')[0];
                            cardSides_1.style.transition = 'none';
                            element.dataset.side = settings.originalSide;
                            setTimeout(function () {
                                cardSides_1.style.transition = null;
                                element.dataset.side = side;
                            });
                        }
                        animation = settings.animation;
                        if (animation) {
                            animation.settings.element = element;
                            animation.settings.fromRect = fromRect;
                        }
                        else {
                            animation = new BgaSlideAnimation({ element: element, fromRect: fromRect });
                        }
                        return [4 /*yield*/, this.manager.animationManager.play(animation)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result === null || result === void 0 ? void 0 : result.played) !== null && _a !== void 0 ? _a : false];
                }
            });
        });
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
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? this.manager.getSelectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? this.manager.getUnselectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? this.manager.getSelectedCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardStock.prototype.removeSelectionClasses = function (card) {
        this.removeSelectionClassesFromElement(this.getCardElement(card));
    };
    CardStock.prototype.removeSelectionClassesFromElement = function (cardElement) {
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        var selectedCardsClass = this.getSelectedCardClass();
        cardElement === null || cardElement === void 0 ? void 0 : cardElement.classList.remove(selectableCardsClass, unselectableCardsClass, selectedCardsClass);
    };
    return CardStock;
}());
var SlideAndBackAnimation = /** @class */ (function (_super) {
    __extends(SlideAndBackAnimation, _super);
    function SlideAndBackAnimation(manager, element, tempElement) {
        var distance = (manager.getCardWidth() + manager.getCardHeight()) / 2;
        var angle = Math.random() * Math.PI * 2;
        var fromDelta = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle),
        };
        return _super.call(this, {
            animations: [
                new BgaSlideToAnimation({ element: element, fromDelta: fromDelta, duration: 250 }),
                new BgaSlideAnimation({ element: element, fromDelta: fromDelta, duration: 250, animationEnd: tempElement ? (function () { return element.remove(); }) : undefined }),
            ]
        }) || this;
    }
    return SlideAndBackAnimation;
}(BgaCumulatedAnimation));
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness). *
 * Needs cardWidth and cardHeight to be set in the card manager.
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', "".concat(cardWidth, "px"));
            _this.element.style.setProperty('--height', "".concat(cardHeight, "px"));
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        _this.fakeCardGenerator = (_a = settings === null || settings === void 0 ? void 0 : settings.fakeCardGenerator) !== null && _a !== void 0 ? _a : manager.getFakeCardGenerator();
        _this.thicknesses = (_b = settings.thicknesses) !== null && _b !== void 0 ? _b : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_c = settings.cardNumber) !== null && _c !== void 0 ? _c : 0);
        _this.autoUpdateCardNumber = (_d = settings.autoUpdateCardNumber) !== null && _d !== void 0 ? _d : true;
        _this.autoRemovePreviousCards = (_e = settings.autoRemovePreviousCards) !== null && _e !== void 0 ? _e : true;
        var shadowDirection = (_f = settings.shadowDirection) !== null && _f !== void 0 ? _f : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        if (settings.topCard) {
            _this.addCard(settings.topCard);
        }
        else if (settings.cardNumber > 0) {
            _this.addCard(_this.getFakeCard());
        }
        if (settings.counter && ((_g = settings.counter.show) !== null && _g !== void 0 ? _g : true)) {
            if (settings.cardNumber === null || settings.cardNumber === undefined) {
                console.warn("Deck card counter created without a cardNumber");
            }
            _this.createCounter((_h = settings.counter.position) !== null && _h !== void 0 ? _h : 'bottom', (_j = settings.counter.extraClasses) !== null && _j !== void 0 ? _j : 'round', settings.counter.counterId);
            if ((_k = settings.counter) === null || _k === void 0 ? void 0 : _k.hideWhenEmpty) {
                _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
            }
        }
        _this.setCardNumber((_l = settings.cardNumber) !== null && _l !== void 0 ? _l : 0);
        return _this;
    }
    Deck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', "".concat(left, "%"));
        this.element.style.setProperty('--bga-cards-deck-top', "".concat(top, "%"));
        this.element.insertAdjacentHTML('beforeend', "\n            <div ".concat(counterId ? "id=\"".concat(counterId, "\"") : '', " class=\"bga-cards_deck-counter ").concat(extraClasses, "\"></div>\n        "));
    };
    /**
     * Get the the cards number.
     *
     * @returns the cards number
     */
    Deck.prototype.getCardNumber = function () {
        return this.cardNumber;
    };
    /**
     * Set the the cards number.
     *
     * @param cardNumber the cards number
     * @param topCard the deck top card. If unset, will generated a fake card (default). Set it to null to not generate a new topCard.
     */
    Deck.prototype.setCardNumber = function (cardNumber, topCard) {
        var _this = this;
        if (topCard === void 0) { topCard = undefined; }
        var promise = Promise.resolve(false);
        var oldTopCard = this.getTopCard();
        if (topCard !== null && cardNumber > 0) {
            var newTopCard = topCard || this.getFakeCard();
            if (!oldTopCard || this.manager.getId(newTopCard) != this.manager.getId(oldTopCard)) {
                promise = this.addCard(newTopCard, undefined, { autoUpdateCardNumber: false });
            }
        }
        else if (cardNumber == 0 && oldTopCard) {
            promise = this.removeCard(oldTopCard, { autoUpdateCardNumber: false });
        }
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', "".concat(thickness, "px"));
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "".concat(cardNumber);
        }
        return promise;
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber + 1, null);
        }
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoRemovePreviousCards) !== null && _b !== void 0 ? _b : this.autoRemovePreviousCards) {
            promise.then(function () {
                var previousCards = _this.getCards().slice(0, -1); // remove last cards
                _this.removeCards(previousCards, { autoUpdateCardNumber: false });
            });
        }
        return promise;
    };
    Deck.prototype.cardRemoved = function (card, settings) {
        var _a;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card, settings);
    };
    Deck.prototype.removeAll = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _a, _b;
            return __generator(this, function (_c) {
                promise = _super.prototype.removeAll.call(this, __assign(__assign({}, settings), { autoUpdateCardNumber: (_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : false }));
                if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _b !== void 0 ? _b : true) {
                    this.setCardNumber(0, null);
                }
                return [2 /*return*/, promise];
            });
        });
    };
    Deck.prototype.getTopCard = function () {
        var cards = this.getCards();
        return cards.length ? cards[cards.length - 1] : null;
    };
    /**
     * Shows a shuffle animation on the deck
     *
     * @param animatedCardsMax number of animated cards for shuffle animation.
     * @param fakeCardSetter a function to generate a fake card for animation. Required if the card id is not based on a numerci `id` field, or if you want to set custom card back
     * @returns promise when animation ends
     */
    Deck.prototype.shuffle = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var animatedCardsMax, animatedCards, elements, getFakeCard, uid, i, newCard, newElement, pauseDelayAfterAnimation;
            var _this = this;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        animatedCardsMax = (_a = settings === null || settings === void 0 ? void 0 : settings.animatedCardsMax) !== null && _a !== void 0 ? _a : 10;
                        this.addCard((_b = settings === null || settings === void 0 ? void 0 : settings.newTopCard) !== null && _b !== void 0 ? _b : this.getFakeCard(), undefined, { autoUpdateCardNumber: false });
                        if (!this.manager.animationsActive()) {
                            return [2 /*return*/, Promise.resolve(false)]; // we don't execute as it's just visual temporary stuff
                        }
                        animatedCards = Math.min(10, animatedCardsMax, this.getCardNumber());
                        if (!(animatedCards > 1)) return [3 /*break*/, 4];
                        elements = [this.getCardElement(this.getTopCard())];
                        getFakeCard = function (uid) {
                            var newCard;
                            if (settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter) {
                                newCard = {};
                                settings === null || settings === void 0 ? void 0 : settings.fakeCardSetter(newCard, uid);
                            }
                            else {
                                newCard = _this.fakeCardGenerator("".concat(_this.element.id, "-shuffle-").concat(uid));
                            }
                            return newCard;
                        };
                        uid = 0;
                        for (i = elements.length; i <= animatedCards; i++) {
                            newCard = void 0;
                            do {
                                newCard = getFakeCard(uid++);
                            } while (this.manager.getCardElement(newCard)); // To make sure there isn't a fake card remaining with the same uid
                            newElement = this.manager.createCardElement(newCard, false);
                            newElement.dataset.tempCardForShuffleAnimation = 'true';
                            this.element.prepend(newElement);
                            elements.push(newElement);
                        }
                        return [4 /*yield*/, this.manager.animationManager.playWithDelay(elements.map(function (element) { return new SlideAndBackAnimation(_this.manager, element, element.dataset.tempCardForShuffleAnimation == 'true'); }), 50)];
                    case 1:
                        _d.sent();
                        pauseDelayAfterAnimation = (_c = settings === null || settings === void 0 ? void 0 : settings.pauseDelayAfterAnimation) !== null && _c !== void 0 ? _c : 500;
                        if (!(pauseDelayAfterAnimation > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.manager.animationManager.play(new BgaPauseAnimation({ duration: pauseDelayAfterAnimation }))];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3: return [2 /*return*/, true];
                    case 4: return [2 /*return*/, Promise.resolve(false)];
                }
            });
        });
    };
    Deck.prototype.getFakeCard = function () {
        return this.fakeCardGenerator(this.element.id);
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
        var _a, _b, _c, _d;
        var _this = _super.call(this, manager, element, settings) || this;
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
     * @param settings a `AddCardToVoidStockSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        var originalLeft = cardElement.style.left;
        var originalTop = cardElement.style.top;
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.remove) !== null && _a !== void 0 ? _a : true) {
            return promise.then(function () {
                return _this.removeCard(card);
            });
        }
        else {
            cardElement.style.left = originalLeft;
            cardElement.style.top = originalTop;
            return promise;
        }
    };
    return VoidStock;
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
        this.updateMainTimeoutId = [];
        this.updateFrontTimeoutId = [];
        this.updateBackTimeoutId = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    CardManager.prototype.animationsActive = function () {
        return this.animationManager.animationsActive();
    };
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    CardManager.prototype.removeStock = function (stock) {
        var index = this.stocks.indexOf(stock);
        if (index !== -1) {
            this.stocks.splice(index, 1);
        }
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
        if (this.getCardElement(card)) {
            throw new Error('This card already exists ' + JSON.stringify(card));
        }
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div id=\"".concat(id, "-front\" class=\"card-side front\">\n                </div>\n                <div id=\"").concat(id, "-back\" class=\"card-side back\">\n                </div>\n            </div>\n        ");
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
    /**
     * Remove a card.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardManager.prototype.removeCard = function (card, settings) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return Promise.resolve(false);
        }
        div.id = "deleted".concat(id);
        div.remove();
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card, settings);
        return Promise.resolve(true);
    };
    /**
     * Returns the stock containing the card.
     *
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Return if the card passed as parameter is suppose to be visible or not.
     * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
     *
     * @param card the card informations
     * @return the visiblility of the card (true means front side should be displayed)
     */
    CardManager.prototype.isCardVisible = function (card) {
        var _a, _b, _c, _d;
        return (_c = (_b = (_a = this.settings).isCardVisible) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : ((_d = card.type) !== null && _d !== void 0 ? _d : false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        var isVisible = visible !== null && visible !== void 0 ? visible : this.isCardVisible(card);
        element.dataset.side = isVisible ? 'front' : 'back';
        var stringId = JSON.stringify(this.getId(card));
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateMain) !== null && _a !== void 0 ? _a : false) {
            if (this.updateMainTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateMainTimeoutId[stringId]);
                delete this.updateMainTimeoutId[stringId];
            }
            var updateMainDelay = (_b = settings === null || settings === void 0 ? void 0 : settings.updateMainDelay) !== null && _b !== void 0 ? _b : 0;
            if (isVisible && updateMainDelay > 0 && this.animationsActive()) {
                this.updateMainTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element); }, updateMainDelay);
            }
            else {
                (_d = (_c = this.settings).setupDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element);
            }
        }
        if ((_e = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _e !== void 0 ? _e : true) {
            if (this.updateFrontTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateFrontTimeoutId[stringId]);
                delete this.updateFrontTimeoutId[stringId];
            }
            var updateFrontDelay = (_f = settings === null || settings === void 0 ? void 0 : settings.updateFrontDelay) !== null && _f !== void 0 ? _f : 500;
            if (!isVisible && updateFrontDelay > 0 && this.animationsActive()) {
                this.updateFrontTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupFrontDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('front')[0]); }, updateFrontDelay);
            }
            else {
                (_h = (_g = this.settings).setupFrontDiv) === null || _h === void 0 ? void 0 : _h.call(_g, card, element.getElementsByClassName('front')[0]);
            }
        }
        if ((_j = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _j !== void 0 ? _j : false) {
            if (this.updateBackTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateBackTimeoutId[stringId]);
                delete this.updateBackTimeoutId[stringId];
            }
            var updateBackDelay = (_k = settings === null || settings === void 0 ? void 0 : settings.updateBackDelay) !== null && _k !== void 0 ? _k : 0;
            if (isVisible && updateBackDelay > 0 && this.animationsActive()) {
                this.updateBackTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupBackDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('back')[0]); }, updateBackDelay);
            }
            else {
                (_m = (_l = this.settings).setupBackDiv) === null || _m === void 0 ? void 0 : _m.call(_l, card, element.getElementsByClassName('back')[0]);
            }
        }
        if ((_o = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _o !== void 0 ? _o : true) {
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
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    /**
     * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
     *
     * @param card the card informations
     */
    CardManager.prototype.updateCardInformations = function (card, settings) {
        var newSettings = __assign(__assign({}, (settings !== null && settings !== void 0 ? settings : {})), { updateData: true });
        this.setCardVisible(card, undefined, newSettings);
    };
    /**
     * @returns the card with set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardWidth = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardWidth;
    };
    /**
     * @returns the card height set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardHeight = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardHeight;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_selectable-card'.
     */
    CardManager.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? 'bga-cards_selectable-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_disabled-card'.
     */
    CardManager.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? 'bga-cards_disabled-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Default 'bga-cards_selected-card'.
     */
    CardManager.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? 'bga-cards_selected-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardManager.prototype.getFakeCardGenerator = function () {
        var _this = this;
        var _a, _b;
        return (_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.fakeCardGenerator) !== null && _b !== void 0 ? _b : (function (deckId) { return ({ id: _this.getId({ id: "".concat(deckId, "-fake-top-card") }) }); });
    };
    return CardManager;
}());
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
var CardsManager = /** @class */ (function (_super) {
    __extends(CardsManager, _super);
    function CardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "ssp-card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('base-card');
                div.dataset.cardId = '' + card.id;
            },
            setupFrontDiv: function (card, div) { return _this.setupFrontDiv(card, div); },
            isCardVisible: function (card) { return Boolean(card.category) && !card.flipped; },
            animationManager: game.animationManager,
            cardWidth: 149,
            cardHeight: 208,
        }) || this;
        _this.game = game;
        _this.COLORS = [
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
        return _this;
    }
    CardsManager.prototype.setupFrontDiv = function (card, div, ignoreTooltip) {
        if (ignoreTooltip === void 0) { ignoreTooltip = false; }
        div.dataset.category = '' + card.category;
        div.dataset.family = '' + card.family;
        div.dataset.color = '' + card.color;
        div.dataset.index = '' + card.index;
        if (!ignoreTooltip) {
            this.game.setTooltip(div.id, this.getTooltip(card.category, card.family) + "<br><br><i>".concat(this.COLORS[card.color], "</i>"));
        }
    };
    CardsManager.prototype.getTooltip = function (category, family /*, withCount: boolean = false*/) {
        var withCount = true;
        switch (category) {
            case 1:
                return "\n                <div><strong>".concat(_("Mermaid"), "</strong> ").concat(withCount ? '(x4)' : '', "</div>\n                ").concat(_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card."), "\n                <br><br>\n                <strong>").concat(_("Effect: If they place 4 mermaid cards, the player immediately wins the game."), "</strong>");
            case 2:
                var swimmerSharkEffect = _("The player steals a random card from another player and adds it to their hand.");
                var swimmerJellyfishEffect = _("On their next turn, opposing players can only draw the first card from the deck. They cannot play any cards nor end the round.");
                var crabLobsterEffect = _("The player takes the first five cards from the deck, adds one of them to their hand, then returns the other four to the deck and shuffles it.");
                var duoCards = [
                    [_('Crab'), [
                            [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players.")],
                        ], 9],
                    [_('Boat'), [
                            [_('Boat'), _("The player immediately takes another turn.")]
                        ], 8],
                    [_('Fish'), [
                            [_('Fish'), _("The player adds the top card from the deck to their hand.")]
                        ], 7],
                    [_('Swimmer'), [
                            [_('Shark'), swimmerSharkEffect]
                        ], 5],
                    [_('Shark'), [
                            [_('Swimmer'), swimmerSharkEffect]
                        ], 5],
                ];
                if (this.game.isExtraSaltExpansion()) {
                    duoCards[0][1].push([_('Lobster'), crabLobsterEffect]);
                    duoCards[3][1].push([_('Jellyfish'), swimmerJellyfishEffect]);
                    duoCards.push([_('Jellyfish'), [
                            [_('Swimmer'), swimmerJellyfishEffect]
                        ], 2], [_('Lobster'), [
                            [_('Crab'), crabLobsterEffect]
                        ], 1]);
                }
                var duo_1 = duoCards[family - 1];
                var html_1 = "<div><strong>".concat(duo_1[0], "</strong> ").concat(withCount ? "(x".concat(duo_1[2], ")") : '', "</div>\n                <div>").concat(_("1 point for each valid pair of cards."), "</div><br>\n                <div>").concat(_("Effect:"), "</div><div>");
                duo_1[1].forEach(function (possiblePair) {
                    html_1 += "<div><i>".concat((possiblePair[0] == duo_1[0] ? _("With another ${card_type}:") : _("With a ${card_type}:")).replace('${card_type}', possiblePair[0]), "</i> ").concat(possiblePair[1], "</div>");
                });
                html_1 += "</div>";
                return html_1;
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
                    [_('The cast of crabs'), _('Crab'), 1],
                ];
                var multiplier = multiplierCards[family - 1];
                return "<div><strong>".concat(multiplier[0], "</strong> (x1)</div>\n                <div>").concat(_("${points} point(s) per ${card} card.").replace('${points}', multiplier[2]).replace('${card}', multiplier[1]), "</div>\n                <div>").concat(_("This card does not count as a ${card} card.").replace('${card}', multiplier[1]), "</div>");
            case 5:
                var specialCards = [
                    [_('Starfish'), 3, _("If a player has a duo and a starfish card in their hand, they can form a trio and place these three cards in front of them. The starfish adds 2 points to the duo (so the trio is worth 3 points). Cancels the effect of the duo cards placed with the starfish.")],
                    [_('Seahorse'), 1, _("The player can use the seahorse to replace a missing Collector card (octopus, shell, penguin or sailor). They must have at least one card for that collection in their hand. They cannot gain more points than the maximum indicated on the matching Collector card.")],
                ];
                var special = specialCards[family - 1];
                return "<div><strong>".concat(special[0], "</strong> (x").concat(special[1], ")</div>\n            <div>").concat(special[2], "</div>");
        }
    };
    CardsManager.prototype.setForHelp = function (card, divId) {
        var div = document.getElementById(divId);
        div.classList.add('card', 'base-card');
        div.dataset.side = 'front';
        div.innerHTML = "\n        <div class=\"card-sides\">\n            <div class=\"card-side front\">\n            </div>\n            <div class=\"card-side back\">\n            </div>\n        </div>";
        this.setupFrontDiv(card, div.querySelector('.front'), true);
    };
    // gameui.cards.debugSeeAllCards()
    CardsManager.prototype.debugSeeAllCards = function () {
        var html = "<div id=\"all-cards\">";
        html += "</div>";
        dojo.place(html, 'full-table', 'before');
        var debugStock = new LineStock(this.game.cardsManager, document.getElementById("all-cards"), { gap: '0', });
        [1, 2, 3, 4, 5, 6].forEach(function (subType) {
            var card = {
                id: 10 + subType,
                type: 1,
                subType: subType,
            };
            debugStock.addCard(card);
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    type: type,
                    subType: subType,
                };
                debugStock.addCard(card);
            });
        });
    };
    return CardsManager;
}(CardManager));
var EventCardManager = /** @class */ (function (_super) {
    __extends(EventCardManager, _super);
    function EventCardManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "event-card-".concat(card.id); },
            setupDiv: function (card, div) { return div.classList.add('event-card'); },
            setupFrontDiv: function (card, div) { return _this.setupFrontDiv(card, div); },
            cardWidth: 208,
            cardHeight: 149,
            animationManager: game.animationManager,
        }) || this;
        _this.game = game;
        return _this;
    }
    EventCardManager.prototype.setupFrontDiv = function (card, div) {
        div.style.setProperty('--index', "".concat(card.type - 1));
        this.game.setTooltip(div.id, this.getTooltip(card.type));
        if (!div.lastElementChild) {
            div.innerHTML = "\n            <div class=\"event-trophy-wrapper\">\n                <div class=\"event-trophy\" data-for=\"".concat(card.for, "\"></div>\n            </div>\n            ");
        }
    };
    EventCardManager.prototype.getTooltip = function (type) {
        var forText = [5, 6, 8, 9].includes(type) ?
            _('The player with the most points places the card in front of them.') :
            _('The player with the fewest points places the card in front of them.');
        return this.getPowerTooltip(type) + "\n        <br><br>\n        <i>".concat(_('At the end of the round:'), " ").concat(forText, "</i>");
    };
    EventCardManager.prototype.getPowerTooltip = function (type) {
        switch (type) {
            case 1:
                return "\n                <div><strong>".concat(_("The Hermit crab"), "</strong></div>\n                ").concat(_("When a pair of <strong>crabs</strong> is played, the player takes one card from each discard pile."));
            case 2:
                return "\n                <div><strong>".concat(_("The Sunfish"), "</strong></div>\n                ").concat(_("When a pair of <strong>fish</strong> is played, the player adds the first two cards from the deck to their hand."));
            case 3:
                return "\n                <div><strong>".concat(_("The Water Rodeo"), "</strong></div>\n                ").concat(_("Adds new effects. Each duo scores 1 point."), "\n                <br><br>\n                ").concat(_("When a pair of <strong>swimmers</strong> is placed, the player can look at an opponent’s hand. They can then swap one of their cards with one of their opponent’s."), "\n                <br><br>\n                ").concat(_("When a pair of <strong>sharks</strong> is played, the player steals a pair placed in front of an opponent. They place it in front of themselves without triggering its effect."), "\n                <br><br>\n                ").concat(_("Note: The usual combinations of a <strong>swimmer card + shark card</strong> and a <strong>swimmer card + jellyfish card</strong> (with <i>Extra Salt</i> cards) are still valid."), "\n                ");
            case 4:
                return "\n                <div><strong>".concat(_("The Dance of the Shells"), "</strong></div>\n                ").concat(_("Each <strong>shell card</strong> scores 2 points."));
            case 5:
                return "\n                <div><strong>".concat(_("The Kraken"), "</strong></div>\n                ").concat(_("Each <strong>octopus card</strong> scores 1 point."));
            case 6:
                return "\n                <div><strong>".concat(_("The Tornado"), "</strong></div>\n                ").concat(_("<strong>Mermaid cards</strong> do not score points, but a player still wins immediately if they have all 4 mermaid cards."));
            case 7:
                return "\n                <div><strong>".concat(_("The Dance of the Mermaids"), "</strong></div>\n                ").concat(_("If 3 <strong>mermaids</strong> are played (instead of 4), the player immediately wins the game."));
            case 8:
                return "\n                <div><strong>".concat(_("The Treasure Chest"), "</strong></div>\n                ").concat(_("A player must reach 10 points (instead of 7) to end the round."));
            case 9:
                return "\n                <div><strong>".concat(_("The Diodon Fish"), "</strong></div>\n                ").concat(_("A player cannot end the round by saying <strong>STOP</strong>; they have to say <strong>LAST CHANCE</strong>."));
            case 10:
                return "\n                <div><strong>".concat(_("The Angelfish"), "</strong></div>\n                ").concat(_("At the end of a player’s turn, if the two visible cards on the discard piles are the same color, the player chooses one of them to add to their hand."));
            case 11:
                return "\n                <div><strong>".concat(_("The Dolphins"), "</strong></div>\n                ").concat(_("When a player discards a collection card (shell, octopus, penguin, sailor, or seahorse), the top card from the draw pile is added to their hand."));
            case 12:
                return "\n                <div><strong>".concat(_("The Coral Reef"), "</strong></div>\n                ").concat(_("A player may place a shell face down in front of them. If they do, they are immune to all attacks. But, that shell is worth no points."));
        }
    };
    EventCardManager.prototype.setForHelp = function (card, divId) {
        var div = document.getElementById(divId);
        div.classList.add('card', 'event-card');
        div.dataset.side = 'front';
        div.innerHTML = "\n        <div class=\"card-sides\">\n            <div class=\"card-side front\">\n            </div>\n            <div class=\"card-side back\">\n            </div>\n        </div>";
        this.setupFrontDiv(card, div.querySelector('.front'));
    };
    return EventCardManager;
}(CardManager));
var Stacks = /** @class */ (function () {
    function Stacks(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.discardStocks = [];
        [1, 2].forEach(function (number) {
            var discardDiv = document.getElementById("discard".concat(number));
            var cardNumber = gamedatas["remainingCardsInDiscard".concat(number)];
            _this.discardStocks[number] = new Deck(_this.game.cardsManager, discardDiv, {
                autoUpdateCardNumber: false,
                cardNumber: cardNumber,
                topCard: gamedatas["discardTopCard".concat(number)],
                counter: {
                    extraClasses: 'pile-counter',
                }
            });
            discardDiv.addEventListener('click', function () { return _this.game.onDiscardPileClick(number); });
            // this.discardStocks[number].onCardClick = () => this.game.onDiscardPileClick(number);
        });
        this.pickStock = new LineStock(this.game.cardsManager, document.getElementById('pick'), {
            gap: '0px',
        });
        this.pickStock.onCardClick = function (card) { return _this.game.onCardClick(card); };
        this.deck = new Deck(this.game.cardsManager, document.getElementById('deck'), {
            cardNumber: gamedatas.remainingCardsInDeck,
            counter: {
                extraClasses: 'pile-counter',
            }
        });
        this.deck.onCardClick = function () { return _this.game.takeCardsFromDeck(); };
        if (gamedatas.extraPepperExpansion) {
            var div = document.createElement('div');
            document.getElementById('deck-and-discards').insertAdjacentElement('beforebegin', div);
            this.eventCard = new LineStock(this.game.eventCardManager, div);
            if (gamedatas.tableEventCard) {
                this.eventCard.addCard(gamedatas.tableEventCard);
            }
        }
    }
    Stacks.prototype.makeDeckSelectable = function (selectable) {
        this.deck.setSelectionMode(selectable ? 'single' : 'none');
    };
    Stacks.prototype.makeDiscardSelectable = function (selectable) {
        var _this = this;
        [1, 2].forEach(function (number) { return _this.discardStocks[number].setSelectionMode(selectable ? 'single' : 'none'); });
    };
    Stacks.prototype.makePickSelectable = function (selectable) {
        this.pickStock.setSelectionMode(selectable ? 'single' : 'none');
    };
    Stacks.prototype.showPickCards = function (show, cards, currentPlayer) {
        var _this = this;
        if (currentPlayer === void 0) { currentPlayer = false; }
        document.getElementById('pick').dataset.visible = show.toString();
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            var _a, _b;
            if (((_b = (_a = document.getElementById("ssp-card-".concat(card.id))) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.id) !== 'pick') {
                _this.pickStock.addCard(card, {
                    fromElement: document.getElementById('deck')
                }, {
                    visible: false, // start hidden
                });
                // set card informations
                if (currentPlayer) {
                    _this.pickStock.setCardVisible(card, true, { updateData: true, updateFront: true, updateBack: true, });
                }
            }
        });
    };
    Stacks.prototype.setDiscardCard = function (discardNumber, card, newCount, from) {
        if (newCount === void 0) { newCount = null; }
        if (from === void 0) { from = undefined; }
        if (card) {
            this.discardStocks[discardNumber].addCard(card, { fromElement: from });
            this.discardStocks[discardNumber].setCardVisible(card, true);
        }
        if (newCount !== null) {
            this.discardStocks[discardNumber].setCardNumber(newCount, card);
        }
    };
    Stacks.prototype.getDiscardCards = function () {
        var _this = this;
        return [1, 2].map(function (discardNumber) { return _this.discardStocks[discardNumber].getCards(); }).flat();
    };
    Stacks.prototype.cleanDiscards = function () {
        var _this = this;
        [1, 2].forEach(function (discardNumber) { return _this.discardStocks[discardNumber].setCardNumber(0); });
    };
    Stacks.prototype.getDiscardDeck = function (discardNumber) {
        return this.discardStocks[discardNumber];
    };
    Stacks.prototype.newTableEventCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventCard.addCard(card)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Stacks;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var CATEGORY_ORDER = [null, 4, 1, 2, 3];
var PAIR = 2;
var SPECIAL = 5;
var STARFISH = 1;
function sortCards(a, b) {
    return (CATEGORY_ORDER[a.category] * 100 + a.family * 10 + a.color) - (CATEGORY_ORDER[b.category] * 100 + b.family * 10 + b.color);
}
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\">\n            <div id=\"player-table-").concat(this.playerId, "-hand-cards\" class=\"hand cards\" data-player-id=\"").concat(this.playerId, "\" data-current-player=\"").concat(this.currentPlayer.toString(), "\" data-my-hand=\"").concat(this.currentPlayer.toString(), "\" data-animated=\"false\"></div>\n            <div class=\"name-wrapper\">\n                <span class=\"name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</span>\n                <div class=\"bubble-wrapper\">\n                    <div id=\"player-table-").concat(this.playerId, "-discussion-bubble\" class=\"discussion_bubble\" data-visible=\"false\"></div>\n                </div>\n        ");
        if (this.currentPlayer) {
            html += "<span class=\"counter\" id=\"cards-points-tooltip\">\n                    (".concat(_('Cards points:'), "&nbsp;<span id=\"cards-points-counter\"></span>)\n                </span>");
        }
        html += "</div>\n            <div id=\"player-table-".concat(this.playerId, "-table-cards\" class=\"table cards\">\n            </div>\n        </div>\n        ");
        document.getElementById('tables').insertAdjacentHTML('beforeend', html);
        if (this.currentPlayer) {
            this.cardsPointsCounter = new ebg.counter();
            this.cardsPointsCounter.create("cards-points-counter");
            this.cardsPointsCounter.setValue(player.cardsPoints);
            this.setHandPoints(player.cardsPoints, player.detailledPoints);
        }
        var stockSettings = {
            gap: '0px',
            sort: sortCards,
        };
        this.handCards = new LineStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-hand-cards")), __assign(__assign({}, stockSettings), { wrap: this.currentPlayer ? 'wrap' : 'nowrap' }));
        this.handCards.onCardClick = function (card) { return _this.game.onCardClick(card); };
        this.tableCards = new LineStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-table-cards")), {
            gap: '0px',
            sort: function (a, b) {
                if (a.location !== b.location) {
                    return a.location.length - b.location.length;
                }
                // same location
                if (a.location.startsWith('tablehand')) {
                    return sortCards(a, b);
                }
                else {
                    return a.locationArg - b.locationArg; // sort by order of play, to see cards
                }
            },
        });
        this.tableCards.onCardClick = function (card) { return _this.game.onTableCardClick(_this.playerId, card); };
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
        if (player.eventCards !== undefined) {
            var div = document.createElement('div');
            document.getElementById("player-table-".concat(this.playerId)).insertAdjacentElement('afterbegin', div);
            this.eventCards = new LineStock(this.game.eventCardManager, div);
            this.eventCards.addCards(player.eventCards);
            this.eventCards.onCardClick = function (card) { return _this.game.bgaPerformAction('actChooseKeptEventCard', { id: card.id }); };
        }
    }
    PlayerTable.prototype.addCardsToHand = function (cards, fromDeck) {
        var _this = this;
        if (fromDeck === void 0) { fromDeck = false; }
        var promises = [];
        var handDiv = document.getElementById("player-table-".concat(this.playerId, "-hand-cards"));
        handDiv.dataset.animated = 'true';
        cards.forEach(function (card) {
            promises.push(_this.handCards.addCard(card, {
                fromElement: fromDeck ? document.getElementById('deck') : undefined,
            }).then(function () {
                return handDiv.dataset.animated = 'false';
            }));
            if (_this.currentPlayer) {
                _this.game.cardsManager.setCardVisible(card, true);
            }
        });
        //this.tableCards.addCards(cards);
        return Promise.all(promises);
    };
    PlayerTable.prototype.addStolenCard = function (card, stealerId, opponentId) {
        var _this = this;
        if (this.game.cardsManager.animationsActive()) {
            var opponentHandDiv_1 = document.getElementById("player-table-".concat(opponentId, "-hand-cards"));
            var cardDiv_1 = this.game.cardsManager.getCardElement(card);
            cardDiv_1.style.zIndex = '20';
            opponentHandDiv_1.dataset.animated = 'true';
            if (this.game.getPlayerId() == stealerId) {
                this.game.cardsManager.updateCardInformations(card);
            }
            return this.game.animationManager.play(new BgaCumulatedAnimation({
                animations: [
                    new BgaShowScreenCenterAnimation({ element: cardDiv_1, transitionTimingFunction: 'ease-in-out' }),
                    new BgaPauseAnimation({}),
                ]
            })).then(function () {
                cardDiv_1.style.removeProperty('z-index');
                opponentHandDiv_1.dataset.animated = 'false';
                return _this.addCardsToHand([_this.game.getPlayerId() == opponentId ? { id: card.id } : card]);
            });
        }
        else {
            return this.addCardsToHand([this.game.getPlayerId() == opponentId ? { id: card.id } : card]);
        }
    };
    PlayerTable.prototype.addCardsToTable = function (cards) {
        var _this = this;
        cards.forEach(function (card) { return _this.game.cardsManager.setCardVisible(card, !card.flipped, { updateData: true, updateFront: true, updateBack: false }); });
        var promise = this.tableCards.addCards(cards);
        return promise;
    };
    PlayerTable.prototype.getAllCards = function () {
        return __spreadArray(__spreadArray([], this.tableCards.getCards(), true), this.handCards.getCards(), true);
    };
    PlayerTable.prototype.setHandPoints = function (cardsPoints, detailledPoints) {
        this.cardsPointsCounter.toValue(cardsPoints);
        this.game.setTooltip("cards-points-tooltip", "\n            <div>".concat(_('Mermaid points:'), " <strong>").concat(detailledPoints[0], "</strong></div>\n            <div>").concat(_('Pair points:'), " <strong>").concat(detailledPoints[1], "</strong></div>\n            <div>").concat(_('Collection points:'), " <strong>").concat(detailledPoints[2], "</strong></div>\n            <div>").concat(_('Multiplier points:'), " <strong>").concat(detailledPoints[3], "</strong></div>\n        "));
    };
    PlayerTable.prototype.showAnnouncementPoints = function (playerPoints) {
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += _('I got ${points} points.').replace('${points}', '' + playerPoints) + ' ';
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
            scoreDetailStr += _('I score my ${cardPoints} card points plus my color bonus of ${colorBonus}.').replace('${cardPoints}', '' + scoreDetails.cardsPoints).replace('${colorBonus}', '' + scoreDetails.colorBonus);
        }
        else if (scoreDetails.cardsPoints === null && scoreDetails.colorBonus !== null) {
            scoreDetailStr += _('I only score my color bonus of ${colorBonus}.').replace('${colorBonus}', '' + scoreDetails.colorBonus);
        }
        else if (scoreDetails.cardsPoints !== null && scoreDetails.colorBonus === null) {
            scoreDetailStr += _('I score my ${cardPoints} card points.').replace('${cardPoints}', '' + scoreDetails.cardsPoints);
        }
        var bubble = document.getElementById("player-table-".concat(this.playerId, "-discussion-bubble"));
        bubble.innerHTML += scoreDetailStr + "</div>";
        bubble.dataset.visible = 'true';
    };
    PlayerTable.prototype.setSelectable = function (selectable, single) {
        if (single === void 0) { single = false; }
        this.handCards.setSelectionMode(selectable ? (single ? 'single' : 'multiple') : 'none');
    };
    PlayerTable.prototype.updateDisabledPlayCards = function (selectedCards, selectedStarfishCards, possiblePairs) {
        if (!this.game.isCurrentPlayerActive()) {
            return;
        }
        var selectableCards = this.handCards.getCards().filter(function (card) {
            var disabled = false;
            if (card.category != PAIR) {
                if (card.category == SPECIAL && card.family == STARFISH) {
                    disabled = !possiblePairs.length || (selectedStarfishCards.length > 0 && !selectedStarfishCards.some(function (c) { return c.id == card.id; }));
                }
                else {
                    disabled = true;
                }
            }
            else {
                if (possiblePairs.some(function (possiblePair) { return possiblePair.includes(card.family); })) {
                    if (selectedCards.length >= 2) {
                        disabled = !selectedCards.some(function (c) { return c.id == card.id; });
                    }
                    else if (selectedCards.length == 1) {
                        var remainingPossiblePairs = possiblePairs.filter(function (possiblePair) { return possiblePair.includes(selectedCards[0].family); });
                        var remainingPossibleFamilies = remainingPossiblePairs.map(function (possiblePair) { return possiblePair[0] === selectedCards[0].family ? possiblePair[1] : possiblePair[0]; });
                        disabled = card.id != selectedCards[0].id && !remainingPossibleFamilies.includes(card.family);
                    }
                }
                else {
                    disabled = true;
                }
            }
            return !disabled;
        });
        this.handCards.setSelectableCards(selectableCards);
    };
    PlayerTable.prototype.takeEventCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.eventCards.addCard(card);
                return [2 /*return*/];
            });
        });
    };
    PlayerTable.prototype.setEventCardsSelectable = function (selectable) {
        this.eventCards.setSelectionMode(selectable ? 'single' : 'none');
    };
    PlayerTable.prototype.setSelectableCards = function (selectableCards) {
        this.handCards.setSelectableCards(selectableCards);
    };
    PlayerTable.prototype.setPlayedCardsSelectable = function (selectable, selectableCards) {
        this.tableCards.setSelectionMode(selectable ? 'single' : 'none', selectableCards === null || selectableCards === void 0 ? void 0 : selectableCards.flat());
    };
    PlayerTable.prototype.getHandSelection = function () {
        return this.handCards.getSelection();
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';
var POINTS_FOR_PLAYERS = [null, null, 40, 35, 30];
// @ts-ignore
GameGui = (function () {
    function GameGui() { }
    return GameGui;
})();
var SeaSaltPaper = /** @class */ (function (_super) {
    __extends(SeaSaltPaper, _super);
    function SeaSaltPaper() {
        var _this = _super.call(this) || this;
        _this.playersTables = [];
        _this.handCounters = [];
        _this.swapButton = null;
        _this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        return _this;
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
        if (gamedatas.extraSaltExpansion) {
            this.dontPreloadImage('background.jpg');
            document.getElementsByTagName('html')[0].classList.add('expansion');
        }
        else {
            this.dontPreloadImage('background-expansion.jpg');
        }
        if (!gamedatas.extraPepperExpansion) {
            this.dontPreloadImage('event-cards.jpg');
            this.dontPreloadImage('event-trophies.png');
        }
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.getGameAreaElement().insertAdjacentHTML('beforeend', "\n            <div id=\"full-table\">\n                <div id=\"discard-pick\" data-visible=\"false\"></div>\n                <div id=\"centered-table\">\n                    <div id=\"tables-and-center\">\n                        <div id=\"table-center\">\n                            <div id=\"deck-and-discards\">\n                                <div id=\"deck\" class=\"cards-stack\"></div>\n                                <div id=\"discards\">\n                                        ".concat([1, 2].map(function (number) { return "<div id=\"discard".concat(number, "\" class=\"discard-stack cards-stack\" data-discard=\"").concat(number, "\"></div>"); }).join(''), "\n                                </div>\n                            </div>\n                            <div id=\"pick\" data-visible=\"false\"></div>\n                        </div>\n                        <div id=\"tables\"></div>\n                    </div>\n                </div>\n            </div>\n        "));
        this.animationManager = new AnimationManager(this);
        this.cardsManager = new CardsManager(this);
        this.eventCardManager = new EventCardManager(this);
        this.stacks = new Stacks(this, this.gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        this.zoomManager = new BgaZoom.Manager({
            element: document.getElementById('full-table'),
            zoomControls: {
                color: 'white',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: function () { return _this.onTableCenterSizeChange(); },
        });
        this.setupNotifications();
        this.addHelp();
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
            case 'angelfishPower':
                this.onEnteringAngelfishPower();
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
            case 'placeShellFaceDown':
                this.onEnteringPlaceShellFaceDown(args.args);
                break;
            case 'swapCard':
                this.onEnteringSwapCard(args.args);
                break;
            case 'stealPlayedPair':
                this.onEnteringStealPlayedPair(args.args);
                break;
        }
    };
    SeaSaltPaper.prototype.setGamestateDescription = function (property, args) {
        switch (property) {
            case 'NoDiscard':
                this.statusBar.setTitle(this.isCurrentPlayerActive() ?
                    _('${you} must take two cards from deck ${call}') :
                    _('${actplayer} must take two cards from deck ${call}'), args);
                break;
            case 'ForceTakeOne':
                this.statusBar.setTitle(this.isCurrentPlayerActive() ?
                    _('${you} must take the first card from deck ${call}') :
                    _('${actplayer} must take the first card from deck ${call}'), args);
                break;
        }
    };
    SeaSaltPaper.prototype.onEnteringTakeCards = function (argsRoot) {
        var args = argsRoot.args;
        this.clearLogs(argsRoot.active_player);
        if (args.forceTakeOne) {
            this.setGamestateDescription('ForceTakeOne', args);
        }
        else if (!args.canTakeFromDiscard.length) {
            this.setGamestateDescription('NoDiscard', args);
        }
        if (this.isCurrentPlayerActive()) {
            this.stacks.makeDeckSelectable(args.canTakeFromDeck);
            this.stacks.makeDiscardSelectable(!args.forceTakeOne);
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseCard = function (args) {
        var _this = this;
        var _a, _b;
        var currentPlayer = this.isCurrentPlayerActive();
        this.stacks.showPickCards(true, (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) !== null && _b !== void 0 ? _b : args.cards, currentPlayer);
        if (currentPlayer) {
            setTimeout(function () { return _this.stacks.makePickSelectable(true); }, 500);
        }
        else {
            this.stacks.makePickSelectable(false);
        }
        this.stacks.deck.setCardNumber(args.remainingCardsInDeck);
    };
    SeaSaltPaper.prototype.onEnteringPutDiscardPile = function (args) {
        var _a, _b;
        var currentPlayer = this.isCurrentPlayerActive();
        this.stacks.showPickCards(true, (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) !== null && _b !== void 0 ? _b : args.cards, currentPlayer);
        this.stacks.makeDiscardSelectable(currentPlayer);
    };
    SeaSaltPaper.prototype.onEnteringAngelfishPower = function () {
        this.stacks.showPickCards(false);
        this.stacks.makeDiscardSelectable(this.isCurrentPlayerActive());
    };
    SeaSaltPaper.prototype.onEnteringPlayCards = function () {
        var _a;
        this.stacks.showPickCards(false);
        this.selectedCards = [];
        this.selectedStarfishCards = [];
        if (this.isCurrentPlayerActive()) {
            (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(true);
            this.updateDisabledPlayCards();
        }
    };
    SeaSaltPaper.prototype.onEnteringPlaceShellFaceDown = function (args) {
        this.stacks.showPickCards(false);
        this.selectedCards = [];
        this.selectedStarfishCards = [];
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setSelectable(true);
            this.getCurrentPlayerTable().setSelectableCards(args.selectableCards);
        }
    };
    SeaSaltPaper.prototype.onEnteringStealPlayedPair = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            args.opponentIds.forEach(function (opponentId) {
                var _a;
                _this.getPlayerTable(opponentId).setPlayedCardsSelectable(true, (_a = args.possiblePairs[opponentId]) !== null && _a !== void 0 ? _a : []);
            });
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseDiscardPile = function () {
        this.stacks.makeDiscardSelectable(this.isCurrentPlayerActive());
    };
    SeaSaltPaper.prototype.onEnteringChooseDiscardCard = function (args) {
        var _this = this;
        var _a;
        var currentPlayer = this.isCurrentPlayerActive();
        var cards = ((_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) || args.cards;
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = '';
        pickDiv.dataset.visible = 'true';
        if (!this.discardStock) {
            this.discardStock = new LineStock(this.cardsManager, pickDiv, { gap: '0px' });
            this.discardStock.onCardClick = function (card) { return _this.chooseDiscardCard(card.id); };
        }
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            _this.discardStock.addCard(card, { fromStock: _this.stacks.getDiscardDeck(args.discardNumber) });
        });
        if (currentPlayer) {
            this.discardStock.setSelectionMode('single');
        }
    };
    SeaSaltPaper.prototype.onEnteringSwapCard = function (args) {
        var _this = this;
        var _a;
        if (this.isCurrentPlayerActive()) {
            var cards = ((_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) || args.cards;
            var pickDiv = document.getElementById('discard-pick');
            pickDiv.innerHTML = '';
            pickDiv.dataset.visible = 'true';
            if (!this.swapStock) {
                this.swapStock = new LineStock(this.cardsManager, pickDiv, { gap: '0px' });
                this.swapStock.onCardClick = function (card) { return _this.onSwapCardsSelectionChange(); };
            }
            cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
                _this.swapStock.addCard(card, { fromElement: document.getElementById("player-table-".concat(args.opponentId, "-hand-cards")) });
            });
            this.swapStock.setSelectionMode('single');
            this.getCurrentPlayerTable().setSelectable(true, true);
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseOpponent = function (args) {
        if (this.isCurrentPlayerActive()) {
            args.playersIds.forEach(function (playerId) {
                return document.getElementById("player-table-".concat(playerId, "-hand-cards")).dataset.canSteal = 'true';
            });
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseKeptEventCard = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().setEventCardsSelectable(true);
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
            case 'angelfishPower':
                this.onLeavingAngelfishPower();
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
            case 'chooseKeptEventCard':
                this.onLeavingChooseKeptEventCard();
                break;
            case 'placeShellFaceDown':
                this.onLeavingPlaceShellFaceDown();
                break;
            case 'swapCard':
                this.onLeavingSwapCard();
                break;
            case 'stealPlayedPair':
                this.onLeavingStealPlayedPair(this.gamedatas.gamestate.args);
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
    SeaSaltPaper.prototype.onLeavingAngelfishPower = function () {
        this.stacks.makeDiscardSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingPutDiscardPile = function () {
        this.stacks.makeDiscardSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingPlayCards = function () {
        var _a;
        this.selectedCards = null;
        this.selectedStarfishCards = null;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingPlaceShellFaceDown = function () {
        var _a;
        this.selectedCards = null;
        this.selectedStarfishCards = null;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingChooseDiscardCard = function () {
        var _a;
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
        (_a = this.discardStock) === null || _a === void 0 ? void 0 : _a.removeAll();
    };
    SeaSaltPaper.prototype.onLeavingChooseOpponent = function () {
        Array.from(document.querySelectorAll('[data-can-steal]')).forEach(function (elem) { return elem.dataset.canSteal = 'false'; });
    };
    SeaSaltPaper.prototype.onLeavingChooseKeptEventCard = function () {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setEventCardsSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingSwapCard = function () {
        var _a, _b;
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
        (_a = this.swapStock) === null || _a === void 0 ? void 0 : _a.removeAll();
        (_b = this.getCurrentPlayerTable()) === null || _b === void 0 ? void 0 : _b.setSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingStealPlayedPair = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            args.opponentIds.forEach(function (opponentId) {
                _this.getPlayerTable(opponentId).setPlayedCardsSelectable(false);
            });
        }
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    SeaSaltPaper.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'takeCards':
                    if (args.forceTakeOne) {
                        this.statusBar.addActionButton(_("Take the first card"), function () { return _this.takeCardsFromDeck(); });
                    }
                    break;
                case 'playCards':
                    var playCardsArgs = args;
                    this.statusBar.addActionButton(_("Play selected cards"), function () { return _this.playSelectedCards(); }, { id: "playCards_button" });
                    if (playCardsArgs.hasFourMermaids) {
                        this.statusBar.addActionButton(_("Play the ${number} Mermaids").replace('${number}', '' + playCardsArgs.mermaidsToEndGame), function () { return _this.bgaPerformAction('actEndGameWithMermaids'); }, { color: 'alert' });
                    }
                    if (playCardsArgs.canShield) {
                        this.statusBar.addActionButton(_("Place a shell face down"), function () { return _this.bgaPerformAction('actSelectShellFaceDown'); }, { color: 'secondary' });
                    }
                    this.statusBar.addActionButton(_("End turn"), function () { return _this.bgaPerformAction('actEndTurn'); }, { autoclick: !playCardsArgs.canDoAction });
                    if (playCardsArgs.canCallEndRound) {
                        this.statusBar.addActionButton(_('End round') + ' ("' + _('LAST CHANCE') + '")', function () { return _this.bgaPerformAction('actEndRound'); }, { id: "endRound_button", color: 'alert' });
                        this.statusBar.addActionButton(_('End round') + ' ("' + _('STOP') + '")', function () { return _this.bgaPerformAction('actImmediateEndRound'); }, { id: "immediateEndRound_button", color: 'alert', disabled: !playCardsArgs.canStop });
                        this.setTooltip("endRound_button", "".concat(_("Say <strong>LAST CHANCE</strong> if you are willing to take the bet of having the most points at the end of the round. The other players each take a final turn (take a card + play cards) which they complete by revealing their hand, which is now protected from attacks. Then, all players count the points on their cards (in their hand and in front of them)."), "<br><br>\n                        ").concat(_("If your hand is higher or equal to that of your opponents, bet won! You score the points for your cards + the color bonus (1 point per card of the color they have the most of). Your opponents only score their color bonus."), "<br><br>\n                        ").concat(_("If your score is less than that of at least one opponent, bet lost! You score only the color bonus. Your opponents score points for their cards.")));
                        this.setTooltip("immediateEndRound_button", _("Say <strong>STOP</strong> if you do not want to take a risk. All players reveal their hands and immediately score the points on their cards (in their hand and in front of them)."));
                    }
                    dojo.addClass("playCards_button", "disabled");
                    /*if (!playCardsArgs.canCallEndRound) {
                        dojo.addClass(`endRound_button`, `disabled`);
                        dojo.addClass(`immediateEndRound_button`, `disabled`);
                    }*/
                    break;
                case 'placeShellFaceDown':
                    this.statusBar.addActionButton(_("Cancel"), function () { return _this.bgaPerformAction('actCancelPlaceShellFaceDown'); }, { color: 'secondary' });
                    break;
                case 'chooseOpponentForSwap':
                    var chooseOpponentArgs = args;
                    chooseOpponentArgs.playersIds.forEach(function (playerId) {
                        var player = _this.getPlayer(playerId);
                        _this.statusBar.addActionButton(player.name, function () { return _this.chooseOpponent(playerId); }, { id: "choosePlayer".concat(playerId, "-button") });
                        document.getElementById("choosePlayer".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                    });
                    break;
                case 'swapCard':
                    this.swapButton = this.statusBar.addActionButton(_("Swap selected cards"), function () { return _this.bgaPerformAction('actSwapCard', {
                        playerCardId: _this.getCurrentPlayerTable().getHandSelection()[0].id,
                        opponentCardId: _this.swapStock.getSelection()[0].id,
                    }); }, { disabled: true });
                    this.statusBar.addActionButton(_("Pass"), function () { return _this.bgaPerformAction('actPassSwapCard'); }, { color: 'secondary' });
                    break;
                case 'beforeEndRound':
                    this.statusBar.addActionButton(_("Seen"), function () { return _this.bgaPerformAction('actSeen'); });
                    break;
                case 'chooseKeptEventCard':
                    this.onEnteringChooseKeptEventCard(args);
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
    SeaSaltPaper.prototype.isExtraSaltExpansion = function () {
        return this.gamedatas.extraSaltExpansion;
    };
    SeaSaltPaper.prototype.isExtraPepperExpansion = function () {
        return this.gamedatas.extraPepperExpansion;
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
    SeaSaltPaper.prototype.getOrderedPlayers = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    SeaSaltPaper.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        var endPoints = POINTS_FOR_PLAYERS[Object.keys(gamedatas.players).length];
        if (gamedatas.doublePoints) {
            endPoints *= 2;
        }
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // show end game points
            dojo.place("<span class=\"end-game-points\">&nbsp;/&nbsp;".concat(endPoints, "</span>"), "player_score_".concat(playerId), 'after');
            // hand cards counter
            _this.getPlayerPanelElement(playerId).insertAdjacentHTML('beforeend', "\n                <div class=\"counters\">\n                    <div id=\"playerhand-counter-wrapper-".concat(player.id, "\" class=\"playerhand-counter\">\n                        <div class=\"player-hand-card\"></div> \n                        <span id=\"playerhand-counter-").concat(player.id, "\"></span>\n                    </div>\n                </div>\n            "));
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
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.updateDisabledPlayCards(this.selectedCards, this.selectedStarfishCards, this.gamedatas.gamestate.args.possiblePairs);
        (_b = document.getElementById("playCards_button")) === null || _b === void 0 ? void 0 : _b.classList.toggle("disabled", this.selectedCards.length != 2 || this.selectedStarfishCards.length > 1);
    };
    SeaSaltPaper.prototype.onCardClick = function (card) {
        var _a;
        var cardDiv = (_a = document.getElementById("card-".concat(card.id))) !== null && _a !== void 0 ? _a : document.getElementById("ssp-card-".concat(card.id));
        var parentDiv = cardDiv.parentElement;
        if (cardDiv.classList.contains('bga-cards_disabled-card')) {
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
                    var array = card.category == SPECIAL && card.family == STARFISH ? this.selectedStarfishCards : this.selectedCards;
                    if (array.some(function (c) { return c.id == card.id; })) {
                        array.splice(array.findIndex(function (c) { return c.id == card.id; }), 1);
                        cardDiv.classList.remove('bga-cards_selected-card');
                    }
                    else {
                        array.push(card);
                        cardDiv.classList.add('bga-cards_selected-card');
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
            case 'placeShellFaceDown':
                this.bgaPerformAction('actPlaceShellFaceDown', { id: card.id });
                break;
            case 'swapCard':
                this.onSwapCardsSelectionChange();
                break;
        }
    };
    SeaSaltPaper.prototype.onTableCardClick = function (playerId, card) {
        var _a;
        var cardDiv = (_a = document.getElementById("card-".concat(card.id))) !== null && _a !== void 0 ? _a : document.getElementById("ssp-card-".concat(card.id));
        if (cardDiv.classList.contains('bga-cards_disabled-card')) {
            return;
        }
        switch (this.gamedatas.gamestate.name) {
            case 'stealPlayedPair':
                this.bgaPerformAction('actStealPlayedPair', { stolenPlayerId: playerId, id: card.id });
                break;
        }
    };
    SeaSaltPaper.prototype.onDiscardPileClick = function (number) {
        switch (this.gamedatas.gamestate.name) {
            case 'takeCards':
                this.takeCardFromDiscard(number);
                break;
            case 'putDiscardPile':
                this.putDiscardPile(number);
                break;
            case 'chooseDiscardPile':
                this.chooseDiscardPile(number);
                break;
            case 'angelfishPower':
                this.bgaPerformAction('actTakeCardAngelfishPower', { number: number });
                break;
        }
    };
    SeaSaltPaper.prototype.playSelectedCards = function () {
        if (this.selectedCards.length == 2) {
            if (this.selectedStarfishCards.length > 0) {
                if (this.selectedStarfishCards.length == 1) {
                    this.playCardsTrio(this.selectedCards.map(function (card) { return card.id; }), this.selectedStarfishCards[0].id);
                }
            }
            else {
                this.playCards(this.selectedCards.map(function (card) { return card.id; }));
            }
        }
    };
    SeaSaltPaper.prototype.addHelp = function () {
        var _this = this;
        var quantities = [
            9, 9,
            8, 8,
            6, 4,
            4, 4,
            3, 2,
            1,
        ];
        if (this.isExtraSaltExpansion()) {
            [6, 9, 2, 4, 0, 1, 3, 5].forEach(function (index) { return quantities[index] += 1; });
        }
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
        ].map(function (label, index) { return "\n            <span class=\"label\" data-row=\"".concat(Math.floor(index / 2), "\" data-column=\"").concat(Math.floor(index % 2), "\">").concat(label, "</span>\n            <span class=\"quantity\" data-row=\"").concat(Math.floor(index / 2), "\" data-column=\"").concat(Math.floor(index % 2), "\">&times; ").concat(quantities[index], "</span>\n            "); }).join('');
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
        var extraSaltExpansion = this.isExtraSaltExpansion();
        var extraPepperExpansion = this.isExtraPepperExpansion();
        var duoCardsNumbers = extraSaltExpansion ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
        var multiplierNumbers = extraSaltExpansion ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
        var duoCards = duoCardsNumbers.map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-pair-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(2, family), "</div>\n        </div>\n        "); }).join('');
        var duoSection = "\n        ".concat(duoCards, "\n        ").concat(_("Note: The points for duo cards count whether the cards have been played or not. However, the effect is only applied when the player places the two cards in front of them."));
        var mermaidSection = "\n        <div class=\"help-section\">\n            <div id=\"help-mermaid\"></div>\n            <div>".concat(this.cardsManager.getTooltip(1), "</div>\n        </div>");
        var collectorSection = [1, 2, 3, 4].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-collector-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(3, family), "</div>\n        </div>\n        "); }).join('');
        var multiplierSection = multiplierNumbers.map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-multiplier-".concat(family, "\"></div>\n            <div>").concat(_this.cardsManager.getTooltip(4, family), "</div>\n        </div>\n        "); }).join('');
        var html = "\n        <div id=\"help-popin\">\n            ".concat(_("<strong>Important:</strong> When it is said that the player counts or scores the points on their cards, it means both those in their hand and those in front of them."), "\n\n            <h1>").concat(_("Duo cards"), "</h1>\n            ").concat(duoSection, "\n            <h1>").concat(_("Mermaid cards"), "</h1>\n            ").concat(mermaidSection, "\n            <h1>").concat(_("Collector cards"), "</h1>\n            ").concat(collectorSection, "\n            <h1>").concat(_("Point Multiplier cards"), "</h1>\n            ").concat(multiplierSection, "\n        ");
        if (extraSaltExpansion) {
            var specialSection = [1, 2].map(function (family) { return "\n            <div class=\"help-section\">\n                <div id=\"help-special-".concat(family, "\"></div>\n                <div>").concat(_this.cardsManager.getTooltip(5, family), "</div>\n            </div>\n            "); }).join('');
            html += "\n                <h1>".concat(_("Special cards"), "</h1>\n                ").concat(specialSection, "\n            ");
        }
        if (extraPepperExpansion) {
            var eventSection = Array.from(Array(12).keys()).map(function (key) { return "\n            <div class=\"help-section\">\n                <div id=\"help-event-".concat(key + 1, "\"></div>\n                <div>").concat(_this.eventCardManager.getTooltip(key + 1), "</div>\n            </div>\n            "); }).join('');
            html += "<br>\n                <h1>".concat(_("Event cards"), "</h1>\n                ").concat(eventSection, "\n            ");
        }
        html += "\n        </div>\n        ";
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
        // pair
        var duoCardsPairs = extraSaltExpansion ? [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 3]] : [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]];
        duoCardsPairs.forEach(function (_a) {
            var family = _a[0], color = _a[1];
            return _this.cardsManager.setForHelp({ id: 1020 + family, category: 2, family: family, color: color, index: 0 }, "help-pair-".concat(family));
        });
        // mermaid
        this.cardsManager.setForHelp({ id: 1010, category: 1 }, "help-mermaid");
        // collector
        [[1, 1], [2, 2], [3, 6], [4, 9]].forEach(function (_a) {
            var family = _a[0], color = _a[1];
            return _this.cardsManager.setForHelp({ id: 1030 + family, category: 3, family: family, color: color, index: 0 }, "help-collector-".concat(family));
        });
        // multiplier
        multiplierNumbers.forEach(function (family) { return _this.cardsManager.setForHelp({ id: 1040 + family, category: 4, family: family }, "help-multiplier-".concat(family)); });
        if (extraSaltExpansion) {
            // special
            [[1, 1], [2, 0]].forEach(function (_a) {
                var family = _a[0], color = _a[1];
                return _this.cardsManager.setForHelp({ id: 1050 + family, category: 5, family: family, color: color }, "help-special-".concat(family));
            });
        }
        if (extraPepperExpansion) {
            Array.from(Array(12).keys()).map(function (key) { return _this.eventCardManager.setForHelp({ id: 1100 + key, type: key + 1 }, "help-event-".concat(key + 1)); });
        }
    };
    SeaSaltPaper.prototype.takeCardsFromDeck = function () {
        this.bgaPerformAction('actTakeCardsFromDeck');
    };
    SeaSaltPaper.prototype.takeCardFromDiscard = function (discardNumber) {
        this.bgaPerformAction('actTakeCardFromDiscard', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.chooseCard = function (id) {
        this.bgaPerformAction('actChooseCard', {
            id: id
        });
    };
    SeaSaltPaper.prototype.putDiscardPile = function (discardNumber) {
        this.bgaPerformAction('actPutDiscardPile', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.playCards = function (ids) {
        this.bgaPerformAction('actPlayCards', {
            'id1': ids[0],
            'id2': ids[1],
        });
    };
    SeaSaltPaper.prototype.playCardsTrio = function (ids, starfishId) {
        this.bgaPerformAction('actPlayCardsTrio', {
            'id1': ids[0],
            'id2': ids[1],
            'starfishId': starfishId
        });
    };
    SeaSaltPaper.prototype.chooseDiscardPile = function (discardNumber) {
        this.bgaPerformAction('actChooseDiscardPile', {
            discardNumber: discardNumber
        });
    };
    SeaSaltPaper.prototype.chooseDiscardCard = function (id) {
        this.bgaPerformAction('actChooseDiscardCard', {
            id: id
        });
    };
    SeaSaltPaper.prototype.chooseOpponent = function (id) {
        this.bgaPerformAction('actChooseOpponent', {
            id: id
        });
    };
    SeaSaltPaper.prototype.onSwapCardsSelectionChange = function () {
        var playerCardSelection = this.getCurrentPlayerTable().getHandSelection();
        var opponentCardSelection = this.swapStock.getSelection();
        var valid = playerCardSelection.length === 1 && opponentCardSelection.length === 1;
        this.swapButton.disabled = !valid;
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
            ['cardsInDeckFromPick', ANIMATION_MS],
            ['playCards', undefined],
            ['stealPlayedPair', undefined],
            ['stealCard', undefined],
            ['swapCard', undefined],
            ['passSwapCard', undefined],
            ['revealHand', ANIMATION_MS * 2],
            ['announceEndRound', ANIMATION_MS * 2],
            ['betResult', ANIMATION_MS * 2],
            ['endRound', undefined],
            ['score', ANIMATION_MS * 3],
            ['newRound', 1],
            ['updateCardsPoints', 1],
            ['emptyDeck', 1],
            ['reshuffleDeck', undefined],
            ['takeEventCard', undefined],
            ['discardEventCard', undefined],
            ['newTableEventCard', undefined],
            ['placeShellFaceDown', undefined],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, function (notifDetails) {
                log("notif_".concat(notif[0]), notifDetails.args);
                var promise = _this["notif_".concat(notif[0])](notifDetails.args);
                // tell the UI notification ends, if the function returned a promise
                promise === null || promise === void 0 ? void 0 : promise.then(function () { return _this.notifqueue.onSynchronousNotificationEnd(); });
            });
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
        this.notifqueue.setIgnoreNotificationCheck('swapCard', function (notif) {
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
    SeaSaltPaper.prototype.notif_cardInDiscardFromDeck = function (args) {
        this.stacks.setDiscardCard(args.discardId, args.card, 1, document.getElementById('deck'));
        this.stacks.deck.setCardNumber(args.remainingCardsInDeck);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscard = function (args) {
        var card = args.card;
        var playerId = args.playerId;
        var discardNumber = args.discardId;
        var maskedCard = playerId == this.getPlayerId() ? card : { id: card.id };
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);
        this.handCounters[playerId].incValue(1);
        this.stacks.setDiscardCard(discardNumber, args.newDiscardTopCard, args.remainingCardsInDiscard);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscardCrab = function (args) {
        var card = args.card;
        var playerId = args.playerId;
        var maskedCard = playerId == this.getPlayerId() ? card : { id: card.id };
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);
        this.handCounters[playerId].incValue(1);
        this.stacks.setDiscardCard(args.discardId, args.newDiscardTopCard, args.remainingCardsInDiscard);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromPick = function (args) {
        var playerId = args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([args.card]);
        this.handCounters[playerId].incValue(1);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDeck = function (args) {
        var playerId = args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([args.card], true);
        this.stacks.deck.setCardNumber(args.remainingCardsInDeck);
        this.handCounters[playerId].incValue(1);
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromPick = function (args) {
        var card = args.card;
        var discardNumber = args.discardId;
        this.cardsManager.setCardVisible(card, true);
        this.stacks.setDiscardCard(discardNumber, card, args.remainingCardsInDiscard);
    };
    SeaSaltPaper.prototype.notif_cardsInDeckFromPick = function (args) {
        this.stacks.deck.addCards(args.cards, undefined, {
            visible: false,
        });
        this.stacks.deck.setCardNumber(args.remainingCardsInDeck);
    };
    SeaSaltPaper.prototype.notif_score = function (args) {
        var _a;
        var playerId = args.playerId;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(args.newScore);
        var incScore = args.incScore;
        if (incScore != null && incScore !== undefined) {
            this.displayScoring("player-table-".concat(playerId, "-table-cards"), this.getPlayerColor(playerId), incScore, ANIMATION_MS * 3);
        }
        if (args.details) {
            this.getPlayerTable(args.playerId).showScoreDetails(args.details);
        }
    };
    SeaSaltPaper.prototype.notif_newRound = function () { };
    SeaSaltPaper.prototype.notif_playCards = function (args) {
        var playerId = args.playerId;
        var cards = args.cards;
        var playerTable = this.getPlayerTable(playerId);
        this.handCounters[playerId].incValue(-cards.length);
        return playerTable.addCardsToTable(cards);
    };
    SeaSaltPaper.prototype.notif_stealPlayedPair = function (args) {
        var playerId = args.playerId;
        var cards = args.cards;
        var playerTable = this.getPlayerTable(playerId);
        return playerTable.addCardsToTable(cards);
    };
    SeaSaltPaper.prototype.notif_revealHand = function (args) {
        var playerId = args.playerId;
        var playerPoints = args.playerPoints;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.showAnnouncementPoints(playerPoints);
        this.notif_playCards(args);
        this.handCounters[playerId].toValue(0);
    };
    SeaSaltPaper.prototype.notif_stealCard = function (args) {
        var stealerId = args.playerId;
        var opponentId = args.opponentId;
        var card = args.card;
        this.getPlayerTable(opponentId).setSelectable(false);
        this.handCounters[opponentId].incValue(-1);
        this.handCounters[stealerId].incValue(1);
        return this.getPlayerTable(stealerId).addStolenCard(card, stealerId, opponentId);
    };
    SeaSaltPaper.prototype.notif_swapCard = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var stealerId, opponentId, card, card2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stealerId = args.playerId;
                        opponentId = args.opponentId;
                        card = args.card;
                        card2 = args.card2;
                        if (!(stealerId == this.getPlayerId())) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getPlayerTable(opponentId).addCardsToHand(args.opponentCards)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, Promise.all([
                            this.getPlayerTable(stealerId).addStolenCard(card2, stealerId, opponentId),
                            this.getPlayerTable(opponentId).addStolenCard(card, opponentId, stealerId),
                        ])];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_passSwapCard = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var stealerId, opponentId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stealerId = args.playerId;
                        opponentId = args.opponentId;
                        if (!(stealerId == this.getPlayerId())) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getPlayerTable(opponentId).addCardsToHand(args.opponentCards)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_announceEndRound = function (args) {
        this.getPlayerTable(args.playerId).showAnnouncement(args.announcement);
    };
    SeaSaltPaper.prototype.notif_endRound = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var cards;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cards = this.stacks.getDiscardCards();
                        this.playersTables.forEach(function (playerTable) {
                            cards.push.apply(cards, playerTable.getAllCards());
                            _this.handCounters[playerTable.playerId].setValue(0);
                            playerTable.clearAnnouncement();
                        });
                        this.stacks.cleanDiscards();
                        return [4 /*yield*/, this.stacks.deck.addCards(cards, undefined, { visible: false })];
                    case 1:
                        _b.sent();
                        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(0, [0, 0, 0, 0]);
                        this.stacks.deck.setCardNumber(args.remainingCardsInDeck);
                        return [4 /*yield*/, this.stacks.deck.shuffle()];
                    case 2: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_updateCardsPoints = function (args) {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(args.cardsPoints, args.detailledPoints);
    };
    SeaSaltPaper.prototype.notif_betResult = function (args) {
        this.getPlayerTable(args.playerId).showAnnouncementBetResult(args.result);
    };
    SeaSaltPaper.prototype.notif_emptyDeck = function () {
        this.playersTables.forEach(function (playerTable) { return playerTable.showEmptyDeck(); });
    };
    SeaSaltPaper.prototype.notif_reshuffleDeck = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.stacks.deck.shuffle()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_takeEventCard = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPlayerTable(args.playerId).takeEventCard(args.card)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_discardEventCard = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.eventCardManager.removeCard(args.card)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_newTableEventCard = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.stacks.newTableEventCard(args.card)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SeaSaltPaper.prototype.notif_placeShellFaceDown = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var playerId, card, playerTable;
            return __generator(this, function (_a) {
                playerId = args.playerId;
                card = args.card;
                playerTable = this.getPlayerTable(playerId);
                this.handCounters[playerId].incValue(-1);
                return [2 /*return*/, playerTable.addCardsToTable([card])];
            });
        });
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
    SeaSaltPaper.prototype.bgaFormatText = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = "<strong style=\"color: darkred;\">".concat(_(args.announcement), "</strong>");
                }
                if (args.call && args.call.length && args.call[0] != '<') {
                    args.call = "<strong class=\"title-bar-call\">".concat(_(args.call), "</strong>");
                }
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus', 'cardName', 'cardName1', 'cardName2', 'cardName3', 'cardColor', 'cardColor1', 'cardColor2', 'cardColor3', 'points', 'result'].forEach(function (field) {
                    if (args[field] !== null && args[field] !== undefined && args[field][0] != '<') {
                        args[field] = "<strong>".concat(_(args[field]), "</strong>");
                    }
                });
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log: log, args: args };
    };
    return SeaSaltPaper;
}(GameGui));
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    getLibUrl('bga-zoom', '1.0.0'),
], function (dojo, declare, gamegui, counter, BgaZoom) {
    window.BgaZoom = BgaZoom;
    return declare("bgagame.seasaltpaper", ebg.core.gamegui, new SeaSaltPaper());
});
