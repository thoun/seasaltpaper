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
        console.log(object.parentElement, object.parentElement.dataset.currentPlayer, object.style.position);
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
    }
    // gameui.cards.debugSeeAllCards()
    Cards.prototype.debugSeeAllCards = function () {
        var _this = this;
        document.querySelectorAll('.card').forEach(function (card) { return card.remove(); });
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
    Cards.prototype.createMoveOrUpdateCard = function (card, destinationId, init, from) {
        var _this = this;
        if (init === void 0) { init = false; }
        if (from === void 0) { from = null; }
        var existingDiv = document.getElementById("card-".concat(card.id));
        var side = card.category ? 'front' : 'back';
        if (existingDiv) {
            if (existingDiv.parentElement.id == destinationId) {
                return;
            }
            this.game.removeTooltip("card-".concat(card.id));
            var oldType = Number(existingDiv.dataset.category);
            existingDiv.classList.remove('selectable', 'selected', 'disabled');
            if (init) {
                document.getElementById(destinationId).appendChild(existingDiv);
            }
            else {
                slideToObjectAndAttach(this.game, existingDiv, destinationId);
            }
            existingDiv.dataset.side = '' + side;
            if (!oldType && card.category) {
                this.setVisibleInformations(existingDiv, card);
            }
            else if (oldType && !card.category) {
                setTimeout(function () { return _this.removeVisibleInformations(existingDiv); }, 500); // so we don't change face while it is still visible
            }
            this.game.setTooltip(existingDiv.id, this.getTooltip(card.category, card.family));
        }
        else {
            var div = document.createElement('div');
            div.id = "card-".concat(card.id);
            div.classList.add('card');
            div.dataset.id = '' + card.id;
            div.dataset.side = '' + side;
            div.innerHTML = "\n                <div class=\"card-sides\">\n                    <div class=\"card-side front\">\n                    </div>\n                    <div class=\"card-side back\">\n                    </div>\n                </div>\n            ";
            document.getElementById(destinationId).appendChild(div);
            div.addEventListener('click', function () { return _this.game.onCardClick(card); });
            if (from) {
                var fromCardId = document.getElementById(from).id;
                slideFromObject(this.game, div, fromCardId);
            }
            if (card.category) {
                this.setVisibleInformations(div, card);
                if (!destinationId.startsWith('help-')) {
                    this.game.setTooltip(div.id, this.getTooltip(card.category, card.family));
                }
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
    Cards.prototype.getTooltip = function (category, family) {
        switch (category) {
            case 1:
                return "\n                <div><strong>".concat(_("Mermaid"), "</strong></div>\n                ").concat(_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card."), "\n                <br><br>\n                <strong>").concat(_("Effect: If they place 4 mermaid cards, the player immediately wins the game."), "</strong>");
            case 2:
                if (family >= 4) {
                    return "<div><strong>".concat(_("Swimmer"), "/").concat(_("Shark"), "</strong></div>\n                    <div>").concat(_("1 point for each combination of swimmer and shark cards."), "</div><br>\n                    <div>").concat(_("Effect:"), " ").concat(_("The player steals a random card from another player and adds it to their hand."), "</div>");
                }
                var duoCards = [
                    [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players.")],
                    [_('Boat'), _("The player immediately takes another turn.")],
                    [_('Fish'), _("The player adds the top card from the deck to their hand.")]
                ];
                var duo = duoCards[family - 1];
                return "<div><strong>".concat(duo[0], "</strong></div>\n                <div>").concat(_("1 point for each pair of ${card} cards.").replace('${card}', duo[0]), "</div><br>\n                <div>").concat(_("Effect:"), " ").concat(_(duo[1]), "</div>");
            case 3:
                var collectorCards = [
                    ['0, 2, 4, 6, 8, 10', '1, 2, 3, 4, 5, 6', _('Shell')],
                    ['0, 3, 6, 9, 12', '1, 2, 3, 4, 5', _('Octopus')],
                    ['1, 3, 5', '1, 2, 3', _('Penguin')],
                    ['0, 5', '1,  2', _('Sailor')],
                ];
                var collector = collectorCards[family - 1];
                return "<div><strong>".concat(collector[2], "</strong></div>\n                <div>").concat(_("${points} points depending on whether the player has ${numbers} ${card} cards.").replace('${points}', collector[0]).replace('${numbers}', collector[1]).replace('${card}', collector[2]), "</div>");
            case 4:
                var multiplierCards = [
                    [_('The lighthouse'), _('Boat'), 1],
                    [_('The shoal of fish'), _('Fish'), 1],
                    [_('The penguin colony'), _('Penguin'), 2],
                    [_('The captain'), _('Sailor'), 3],
                ];
                var multiplier = multiplierCards[family - 1];
                return "<div><strong>".concat(multiplier[0], "</strong></div>\n                <div>").concat(_("${points} point(s) per ${card} card.").replace('${points}', multiplier[2]).replace('${card}', multiplier[1]), "</div>\n                <div>").concat(_("This card does not count as a ${card} card.").replace('${card}', multiplier[1]), "</div>");
        }
    };
    return Cards;
}());
var Stacks = /** @class */ (function () {
    function Stacks(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.discardCounters = [];
        this.deckDiv.addEventListener('click', function () { return _this.game.takeCardsFromDeck(); });
        this.deckCounter = new ebg.counter();
        this.deckCounter.create("deck-counter");
        this.deckCounter.setValue(gamedatas.remainingCardsInDeck);
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
        var cards = Array.from(this.pickDiv.getElementsByClassName('card'));
        cards.forEach(function (card) { return card.classList.toggle('selectable', selectable); });
    };
    Stacks.prototype.showPickCards = function (show, cards) {
        var _this = this;
        this.pickDiv.dataset.visible = show.toString();
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            return _this.game.cards.createMoveOrUpdateCard(card, "pick", false, 'deck');
        });
        this.game.updateTableHeight();
    };
    Stacks.prototype.getDiscardCard = function (discardNumber) {
        var currentCardDivs = Array.from(document.getElementById("discard".concat(discardNumber)).getElementsByClassName('card'));
        return currentCardDivs.length > 0 ? currentCardDivs[0] : null;
    };
    return Stacks;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        this.game = game;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\">\n            <div id=\"player-table-").concat(this.playerId, "-hand-cards\" class=\"hand cards\" data-current-player=\"").concat(this.currentPlayer.toString(), "\" data-my-hand=\"").concat(this.currentPlayer.toString(), "\"></div>\n            <div class=\"name-wrapper\">\n                <span id=\"player-table-").concat(this.playerId, "-name\" class=\"name-and-bubble\">\n                    <span class=\"name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</span>\n                    <div id=\"player-table-").concat(this.playerId, "-discussion-bubble\" class=\"discussion_bubble\" data-visible=\"false\"></div>\n                </span>");
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
    }
    Object.defineProperty(PlayerTable.prototype, "handCardsDiv", {
        get: function () {
            return document.getElementById("player-table-".concat(this.playerId, "-hand-cards"));
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlayerTable.prototype, "tableCardsDiv", {
        get: function () {
            return document.getElementById("player-table-".concat(this.playerId, "-table-cards"));
        },
        enumerable: false,
        configurable: true
    });
    PlayerTable.prototype.addCardsToHand = function (cards, from) {
        this.addCards(cards, 'hand', from);
    };
    PlayerTable.prototype.addCardsToTable = function (cards, from) {
        this.addCards(cards, 'table', from);
    };
    PlayerTable.prototype.cleanTable = function () {
        var _this = this;
        var cards = __spreadArray(__spreadArray([], Array.from(this.handCardsDiv.getElementsByClassName('card')), true), Array.from(this.tableCardsDiv.getElementsByClassName('card')), true);
        cards.forEach(function (cardDiv) { return _this.game.cards.createMoveOrUpdateCard({
            id: Number(cardDiv.dataset.id),
        }, "deck"); });
        setTimeout(function () { return cards.forEach(function (cardDiv) { return cardDiv === null || cardDiv === void 0 ? void 0 : cardDiv.parentElement.removeChild(cardDiv); }); }, 500);
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
        bubble.innerHTML += _('I ${result} my bet!').replace('${result}', _(result)) + ' ';
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
        if (!this.game.isCurrentPlayerActive()) {
            return;
        }
        var cards = Array.from(this.handCardsDiv.getElementsByClassName('card'));
        cards.forEach(function (card) {
            var disabled = false;
            if (card.dataset.category != '2') {
                disabled = true;
            }
            else {
                if (playableDuoCardFamilies.includes(Number(card.dataset.family))) {
                    if (selectedCards.length >= 2) {
                        disabled = !selectedCards.includes(Number(card.dataset.id));
                    }
                    else if (selectedCards.length == 1) {
                        var family = Number(document.getElementById("card-".concat(selectedCards[0])).dataset.family);
                        var authorizedFamily = '' + (family >= 4 ? 9 - family : family);
                        disabled = Number(card.dataset.id) != selectedCards[0] && card.dataset.family != authorizedFamily;
                    }
                }
                else {
                    disabled = true;
                }
            }
            card.classList.toggle('disabled', disabled);
        });
    };
    PlayerTable.prototype.addCards = function (cards, to, from) {
        var _this = this;
        cards.forEach(function (card) {
            _this.game.cards.createMoveOrUpdateCard(card, "player-table-".concat(_this.playerId, "-").concat(to, "-cards"), false, from);
            document.getElementById("card-".concat(card.id)).style.order = '' + (card.category * 100 + card.family * 10 + card.color);
        });
        this.game.updateTableHeight();
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var ZOOM_LEVELS = [0.5, 0.625, 0.75, 0.875, 1];
var ZOOM_LEVELS_MARGIN = [-100, -60, -33, -14, 0];
var LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';
var SeaSaltPaper = /** @class */ (function () {
    function SeaSaltPaper() {
        this.zoom = 1;
        this.playersTables = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }
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
        this.cards = new Cards(this);
        this.stacks = new Stacks(this, this.gamedatas);
        //this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        this.setupNotifications();
        this.setupPreferences();
        this.addHelp();
        document.getElementById('zoom-out').addEventListener('click', function () { return _this.zoomOut(); });
        document.getElementById('zoom-in').addEventListener('click', function () { return _this.zoomIn(); });
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        this.onScreenWidthChange = function () {
            _this.updateTableHeight();
            _this.onTableCenterSizeChange();
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
        var _a, _b;
        this.stacks.showPickCards(true, (_b = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards) !== null && _b !== void 0 ? _b : args.cards);
        this.stacks.makePickSelectable(this.isCurrentPlayerActive());
        this.stacks.deckCounter.setValue(args.remainingCardsInDeck);
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
                case 'chooseOpponent':
                    var chooseOpponentArgs = args;
                    chooseOpponentArgs.playersIds.forEach(function (playerId) {
                        var player = _this.getPlayer(playerId);
                        _this.addActionButton("choosePlayer".concat(playerId, "-button"), player.name, function () { return _this.chooseOpponent(playerId); });
                        document.getElementById("choosePlayer".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                    });
                    break;
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
    SeaSaltPaper.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('full-table');
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
        }
        else {
            div.style.transform = "scale(".concat(zoom, ")");
            div.style.marginRight = "".concat(ZOOM_LEVELS_MARGIN[newIndex], "%");
        }
        this.updateTableHeight();
        this.onTableCenterSizeChange();
    };
    SeaSaltPaper.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    SeaSaltPaper.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    SeaSaltPaper.prototype.updateTableHeight = function () {
        setTimeout(function () { return document.getElementById('zoom-wrapper').style.height = "".concat(document.getElementById('full-table').getBoundingClientRect().height, "px"); }, 600);
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
            var match = e.target.id.match(/^preference_control_(\d+)$/);
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
    /*private createPlayerPanels(gamedatas: SeaSaltPaperGamedatas) {

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);
            
            if (playerId == this.getPlayerId()) {
                // cards points counter
                dojo.place(`
                <div class="counter">
                    ${_('Cards points:')}&nbsp;
                    <span id="cards-points-counter"></span>
                </div>
                `, `player_board_${player.id}`);

                this.cardsPointsCounter = new ebg.counter();
                this.cardsPointsCounter.create(`cards-points-counter`);
                this.cardsPointsCounter.setValue(player.cardsPoints);
            }
        });
    }*/
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
        var cardDiv = document.getElementById("card-".concat(card.id));
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
        var duoCards = [1, 2, 3].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-pair-".concat(family, "\"></div>\n            <div>").concat(_this.cards.getTooltip(2, family), "</div>\n        </div>\n        "); }).join('');
        var duoSection = "\n        ".concat(duoCards, "\n        <div class=\"help-section\">\n            <div id=\"help-pair-4\"></div>\n            <div id=\"help-pair-5\"></div>\n            <div>").concat(this.cards.getTooltip(2, 4), "</div>\n        </div>\n        ").concat(_("Note: The points for duo cards count whether the cards have been played or not. However, the effect is only applied when the player places the two cards in front of them."));
        var mermaidSection = "\n        <div class=\"help-section\">\n            <div id=\"help-mermaid\"></div>\n            <div>".concat(this.cards.getTooltip(1), "</div>\n        </div>");
        var collectorSection = [1, 2, 3, 4].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-collector-".concat(family, "\"></div>\n            <div>").concat(_this.cards.getTooltip(3, family), "</div>\n        </div>\n        "); }).join('');
        var multiplierSection = [1, 2, 3, 4].map(function (family) { return "\n        <div class=\"help-section\">\n            <div id=\"help-multiplier-".concat(family, "\"></div>\n            <div>").concat(_this.cards.getTooltip(4, family), "</div>\n        </div>\n        "); }).join('');
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
            if (notif.msg.args.playerId) {
                elem.dataset.playerId = '' + notif.msg.args.playerId;
            }
        }
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromDeck = function (notif) {
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(notif.args.discardId), false, 'deck');
        this.stacks.discardCounters[notif.args.discardId].setValue(1);
        this.stacks.deckCounter.setValue(notif.args.remainingCardsInDeck);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscard = function (notif) {
        var card = notif.args.card;
        var playerId = notif.args.playerId;
        var discardNumber = notif.args.discardId;
        var maskedCard = playerId == this.getPlayerId() ? card : { id: card.id };
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);
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
        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, "discard".concat(discardNumber), true);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
        this.updateTableHeight();
    };
    SeaSaltPaper.prototype.notif_cardInHandFromPick = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card]);
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDeck = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card], 'deck');
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromPick = function (notif) {
        var currentCardDiv = this.stacks.getDiscardCard(notif.args.discardId);
        var discardNumber = notif.args.discardId;
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(discardNumber));
        if (currentCardDiv) {
            setTimeout(function () { return currentCardDiv.parentElement.removeChild(currentCardDiv); }, 500);
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
    };
    SeaSaltPaper.prototype.notif_newRound = function () { };
    SeaSaltPaper.prototype.notif_playCards = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addCardsToTable(notif.args.cards);
    };
    SeaSaltPaper.prototype.notif_revealHand = function (notif) {
        var playerPoints = notif.args.playerPoints;
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.showAnnouncementPoints(playerPoints);
        this.notif_playCards(notif);
    };
    SeaSaltPaper.prototype.notif_stealCard = function (notif) {
        var stealerId = notif.args.playerId;
        var card = notif.args.card;
        this.getPlayerTable(stealerId).addCardsToHand([card]);
    };
    SeaSaltPaper.prototype.notif_announceEndRound = function (notif) {
        this.getPlayerTable(notif.args.playerId).showAnnouncement(notif.args.announcement);
    };
    SeaSaltPaper.prototype.notif_endRound = function () {
        var _this = this;
        var _a;
        this.playersTables.forEach(function (playerTable) { return playerTable.cleanTable(); });
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(0);
        [1, 2].forEach(function (discardNumber) {
            var currentCardDiv = _this.stacks.getDiscardCard(discardNumber);
            currentCardDiv === null || currentCardDiv === void 0 ? void 0 : currentCardDiv.parentElement.removeChild(currentCardDiv); // animate cards to deck?
        });
        [1, 2].forEach(function (discardNumber) { return _this.stacks.discardCounters[discardNumber].setValue(0); });
        this.stacks.deckCounter.setValue(58);
    };
    SeaSaltPaper.prototype.notif_updateCardsPoints = function (notif) {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandPoints(notif.args.cardsPoints);
    };
    SeaSaltPaper.prototype.notif_betResult = function (notif) {
        this.getPlayerTable(notif.args.playerId).showAnnouncementBetResult(notif.args.result);
    };
    SeaSaltPaper.prototype.clearLogs = function (activePlayer) {
        var logDivs = Array.from(document.getElementById('logs').getElementsByClassName('log'));
        var hide = false;
        logDivs.forEach(function (logDiv) {
            if (!hide && logDiv.dataset.playerId == activePlayer) {
                hide = true;
            }
            if (hide) {
                logDiv.style.display = 'none';
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
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus', 'cardName', 'cardName1', 'cardName2', 'cardColor', 'cardColor1', 'cardColor2', 'points', 'result'].forEach(function (field) {
                    if (args[field] && args[field][0] != '<') {
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
