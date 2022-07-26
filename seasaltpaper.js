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
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
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
        setTimeout(function () {
            object.style.transition = "transform 0.5s linear";
            object.style.transform = null;
        });
        setTimeout(function () {
            object.style.zIndex = null;
            object.style.transition = null;
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
                name: _this.getTitle(1, subType)
            };
            _this.createMoveOrUpdateCard(card, "all-cards");
        });
        [2, 3, 4, 5, 6].forEach(function (type) {
            return [1, 2, 3].forEach(function (subType) {
                var card = {
                    id: 10 * type + subType,
                    type: type,
                    subType: subType,
                    name: _this.getTitle(type, subType)
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
            if (existingDiv.parentElement.id == from) {
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
            //this.game.setTooltip(existingDiv.id, this.getTooltip(card.type, card.subType));
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
                var fromCardId = document.getElementById(from) /*.children[0]*/.id;
                slideFromObject(this.game, div, fromCardId);
            }
            if (true /*card.type*/) {
                this.setVisibleInformations(div, card);
            }
            //this.game.setTooltip(div.id, this.getTooltip(card.type, card.subType));
        }
    };
    Cards.prototype.setVisibleInformations = function (div, card) {
        div.dataset.category = '' + card.category;
        div.dataset.family = '' + card.family;
        div.dataset.color = '' + card.color;
        div.dataset.index = '' + card.index;
    };
    Cards.prototype.getTitle = function (type, subType) {
        switch (type) {
            case 1:
                switch (subType) {
                    case 1:
                    case 2: return _('Infirmary');
                    case 3:
                    case 4: return _('Sacred Place');
                    case 5:
                    case 6: return _('Fortress');
                }
            case 2:
                switch (subType) {
                    case 1: return _('Herbalist');
                    case 2: return _('House');
                    case 3: return _('Prison');
                }
            case 3:
                switch (subType) {
                    case 1: return _('Forge');
                    case 2: return _('Terraced Houses');
                    case 3: return _('Outpost');
                }
            case 4:
                switch (subType) {
                    case 1: return _('Windmill');
                    case 2: return _('Sanctuary');
                    case 3: return _('Bunker');
                }
            case 5:
                switch (subType) {
                    case 1: return _('Power Station');
                    case 2: return _('Apartments');
                    case 3: return _('Radio Tower');
                }
            case 6:
                switch (subType) {
                    case 1: return _('Water Reservoir');
                    case 2: return _('Temple');
                    case 3: return _('Air Base');
                }
        }
    };
    Cards.prototype.getTooltip = function (type, subType) {
        if (!type) {
            return _('Common projects deck');
        }
        return "<h3 class=\"title\">".concat(this.getTitle(type, subType), "</h3><div>").concat(this.getTooltipDescription(type), "</div>");
    };
    Cards.prototype.getTooltipDescription = function (type) {
        switch (type) {
            case 1: return _('Construct a building with at least 2 floors on an area adjacent to an unoccupied area, respecting the indicated land types (1 copy each).');
            case 2: return _('Construct a building with at least 2 floors on the indicated land type in one of the 6 outside territories (1 copy each).');
            case 3: return _('Construct 2 buildings with at least 1 floor on 2 adjacent areas of the indicated land type (1 copy each).');
            case 4: return _('Construct 2 buildings, 1 with at least 2 floors and 1 with at least 1 floor, on 2 adjacent areas, respecting the indicated land type (1 copy each).');
            case 5: return _('Construct a building with at least 3 floors on the indicated land type in the central territory (1 copy each).');
            case 6: return _('Construct 3 buildings, 1 with at least 2 floors adjacent to 2 buildings with at least 1 floor respecting the indicated land types (1 copy each).');
        }
    };
    return Cards;
}());
var Stacks = /** @class */ (function () {
    function Stacks(game, gamedatas) {
        var _this = this;
        this.game = game;
        [1, 2].filter(function (number) { return gamedatas["discardTopCard".concat(number)]; }).forEach(function (number) {
            return game.cards.createMoveOrUpdateCard(gamedatas["discardTopCard".concat(number)], "discard".concat(number));
        });
        document.getElementById('deck').addEventListener('click', function () { return _this.game.takeCardsFromDeck(); });
        [1, 2].forEach(function (number) {
            return document.getElementById("discard".concat(number)).addEventListener('click', function () { return _this.game.onDiscardPileClick(number); });
        });
    }
    Stacks.prototype.makeDeckSelectable = function (selectable) {
        // TODO
    };
    Stacks.prototype.makeDiscardSelectable = function (canTakeFromDiscard) {
        // TODO
    };
    Stacks.prototype.showPickCards = function (show, cards) {
        var _this = this;
        var pickDiv = document.getElementById('pick');
        pickDiv.innerHTML = cards ? '' : 'TODO opponent is choosing';
        pickDiv.dataset.visible = show.toString();
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            return _this.game.cards.createMoveOrUpdateCard(card, "pick" /*, false, 'deck' TODO*/);
        });
    };
    return Stacks;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        this.game = game;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\">\n            <div id=\"player-table-").concat(this.playerId, "-hand-cards\" class=\"hand cards\" data-current-player=\"").concat(this.currentPlayer.toString(), "\" data-my-hand=\"").concat(this.currentPlayer.toString(), "\"></div>\n            <div class=\"name\" style=\"color: #").concat(player.color, ";\">").concat(player.name, "</div>\n            <div id=\"player-table-").concat(this.playerId, "-table-cards\" class=\"table cards\">\n            </div>\n        </div>\n        ");
        dojo.place(html, document.getElementById('full-table'));
        this.addCardsToHand(player.handCards);
        this.addCardsToTable(player.tableCards);
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
        // TODO animate cards to deck?
        this.handCardsDiv.innerHTML = '';
        this.tableCardsDiv.innerHTML = '';
    };
    PlayerTable.prototype.addCards = function (cards, to, from) {
        var _this = this;
        cards.forEach(function (card) { return _this.game.cards.createMoveOrUpdateCard(card, "player-table-".concat(_this.playerId, "-").concat(to, "-cards"), false, from); });
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
    PlayerTable.prototype.updateDisabledPlayCards = function (selectedCards) {
        var cards = Array.from(this.handCardsDiv.getElementsByClassName('card'));
        cards.forEach(function (card) {
            var disabled = false;
            if (card.dataset.category != '2') {
                disabled = true;
            }
            else {
                if (selectedCards.length >= 2) {
                    disabled = !selectedCards.includes(Number(card.dataset.id));
                }
                else if (selectedCards.length == 1) {
                    var family = Number(document.getElementById("card-".concat(selectedCards[0])).dataset.family);
                    var authorizedFamily = '' + (family >= 4 ? 9 - family : family);
                    disabled = Number(card.dataset.id) != selectedCards[0] && card.dataset.family != authorizedFamily;
                }
            }
            card.classList.toggle('disabled', disabled);
        });
    };
    return PlayerTable;
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
var ANIMATION_MS = 500;
var ZOOM_LEVELS = [0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
var ZOOM_LEVELS_MARGIN = [-100, -60, -33, -14, 0, 20, 33.34];
var LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';
function formatTextIcons(rawText) {
    if (!rawText) {
        return '';
    }
    return rawText
        .replace(/\[GreenLight\]/ig, '<div class="map-icon" data-element="0"></div>')
        .replace(/\[OldLady\]/ig, '<div class="map-icon" data-element="20"></div>')
        .replace(/\[Student\]/ig, '<div class="map-icon" data-element="30"></div>')
        .replace(/\[School\]/ig, '<div class="map-icon" data-element="32"></div>')
        .replace(/\[Tourist\]/ig, '<div class="map-icon" data-element="40"></div>')
        .replace(/\[MonumentLight\]/ig, '<div class="map-icon" data-element="41"></div>')
        .replace(/\[MonumentDark\]/ig, '<div class="map-icon" data-element="42"></div>')
        .replace(/\[Businessman\]/ig, '<div class="map-icon" data-element="50"></div>')
        .replace(/\[Office\]/ig, '<div class="map-icon" data-element="51"></div>');
}
var SeaSaltPaper = /** @class */ (function () {
    function SeaSaltPaper() {
        this.zoom = 1;
        this.playersTables = [];
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
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        document.getElementById('round-panel').innerHTML = "".concat(_('Round'), "&nbsp;<span id=\"round-number-counter\"></span>&nbsp;/&nbsp;").concat(6 - Object.keys(gamedatas.players).length);
        this.roundNumberCounter = new ebg.counter();
        this.roundNumberCounter.create("round-number-counter");
        this.roundNumberCounter.setValue(gamedatas.roundNumber);
        this.setupNotifications();
        this.setupPreferences();
        document.getElementById('zoom-out').addEventListener('click', function () { return _this.zoomOut(); });
        document.getElementById('zoom-in').addEventListener('click', function () { return _this.zoomIn(); });
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
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
                this.onEnteringTakeCards(args.args);
                break;
            case 'chooseCard':
            case 'putDiscardPile':
                this.onEnteringChooseCard(args.args);
                break;
            case 'playCards':
                this.onEnteringPlayCards();
                break;
            case 'chooseDiscardCard':
                this.onEnteringChooseDiscardCard(args.args);
        }
    };
    SeaSaltPaper.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = "".concat(originalState['description' + property]);
        this.gamedatas.gamestate.descriptionmyturn = "".concat(originalState['descriptionmyturn' + property]);
        this.updatePageTitle();
    };
    SeaSaltPaper.prototype.onEnteringTakeCards = function (args) {
        if (!args.canTakeFromDiscard.length) {
            this.setGamestateDescription('NoDiscard');
        }
        if (this.isCurrentPlayerActive()) {
            this.stacks.makeDeckSelectable(args.canTakeFromDeck);
            this.stacks.makeDiscardSelectable(args.canTakeFromDiscard);
        }
    };
    SeaSaltPaper.prototype.onEnteringChooseCard = function (args) {
        var _a;
        this.stacks.showPickCards(true, (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards);
    };
    SeaSaltPaper.prototype.onEnteringPlayCards = function () {
        var _a;
        this.stacks.showPickCards(false);
        this.selectedCards = [];
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(true);
        this.updateDisabledPlayCards();
    };
    SeaSaltPaper.prototype.onEnteringChooseDiscardCard = function (args) {
        var _this = this;
        var _a;
        //this.stacks.showPickCards(true, args._private?.cards); copy of, TEMP
        var cards = (_a = args._private) === null || _a === void 0 ? void 0 : _a.cards;
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = cards ? '' : 'TODO opponent is choosing';
        pickDiv.dataset.visible = 'true';
        cards === null || cards === void 0 ? void 0 : cards.forEach(function (card) {
            return _this.cards.createMoveOrUpdateCard(card, "discard-pick" /*, false, 'deck' TODO*/);
        });
    };
    SeaSaltPaper.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'takeCards':
                this.onLeavingTakeCards();
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
        this.stacks.makeDiscardSelectable([]);
    };
    SeaSaltPaper.prototype.onLeavingPlayCards = function () {
        var _a;
        this.selectedCards = null;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setSelectable(false);
    };
    SeaSaltPaper.prototype.onLeavingChooseDiscardCard = function () {
        // TEMP TODO
        var pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
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
                    if (playCardsArgs.hasFourSirens) {
                        this.addActionButton("endGameWithSirens_button", _("Play the four sirens"), function () { return _this.endGameWithSirens(); });
                    }
                    this.addActionButton("endTurn_button", _("End turn"), function () { return _this.endTurn(); });
                    this.addActionButton("endRound_button", _('End round ("LAST CHANCE")'), function () { return _this.endRound(); }, null, null, 'red');
                    this.addActionButton("immediateEndRound_button", _('End round ("STOP")'), function () { return _this.immediateEndRound(); }, null, null, 'red');
                    if (!playCardsArgs.canCallEndRound) {
                        dojo.addClass("playCards_button", "disabled");
                        dojo.addClass("endRound_button", "disabled");
                        dojo.addClass("immediateEndRound_button", "disabled");
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
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
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
            div.style.margin = "0 ".concat(ZOOM_LEVELS_MARGIN[newIndex], "% ").concat((1 - zoom) * -100, "% 0");
        }
        document.getElementById('map').classList.toggle('hd', zoom > 1);
        document.getElementById('zoom-wrapper').style.height = "".concat(div.getBoundingClientRect().height, "px");
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
            //this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
        try {
            document.getElementById('preference_control_203').closest(".preference_choice").style.display = 'none';
        }
        catch (e) { }
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
            if (playerId == _this.getPlayerId()) {
                // cards points counter
                dojo.place("\n                <div class=\"counter\">\n                    ".concat(_('Cards points:'), "&nbsp;\n                    <span id=\"cards-points-counter\"></span>\n                </div>\n                "), "player_board_".concat(player.id));
                _this.cardsPointsCounter = new ebg.counter();
                _this.cardsPointsCounter.create("cards-points-counter");
                _this.cardsPointsCounter.setValue(player.cardsPoints);
            }
        });
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
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.updateDisabledPlayCards(this.selectedCards);
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
    SeaSaltPaper.prototype.endGameWithSirens = function () {
        if (!this.checkAction('endGameWithSirens')) {
            return;
        }
        this.takeAction('endGameWithSirens');
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
        var notifs = [
            ['cardInDiscardFromDeck', ANIMATION_MS],
            ['cardInHandFromDiscard', ANIMATION_MS],
            ['cardInHandFromPick', ANIMATION_MS],
            ['cardInDiscardFromPick', ANIMATION_MS],
            ['playCards', ANIMATION_MS],
            ['endRound', ANIMATION_MS],
            ['updateCardsPoints', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_".concat(notif[0]));
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromDeck = function (notif) {
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(notif.args.discardId), true, 'deck');
    };
    SeaSaltPaper.prototype.notif_cardInHandFromDiscard = function (notif) {
        var card = notif.args.card;
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([playerId == this.getPlayerId() ? card : { id: card.id }], "discard".concat(notif.args.discardId));
        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, "discard".concat(notif.args.discardId), true);
        }
    };
    SeaSaltPaper.prototype.notif_cardInHandFromPick = function (notif) {
        if (notif.args.playerId == this.getPlayerId() && notif.args.card) {
            // TODO this.cards.createMoveOrUpdateCard(notif.args.card, `my-hand`);
            this.getCurrentPlayerTable().addCardsToHand([notif.args.card]);
        }
        else {
            // TODO update counter ?
        }
    };
    SeaSaltPaper.prototype.notif_cardInDiscardFromPick = function (notif) {
        var currentCardDiv = document.getElementById("discard".concat(notif.args.discardId)).firstElementChild;
        this.cards.createMoveOrUpdateCard(notif.args.card, "discard".concat(notif.args.discardId));
        if (currentCardDiv) {
            setTimeout(function () { return currentCardDiv.parentElement.removeChild(currentCardDiv); }, 500);
        }
    };
    SeaSaltPaper.prototype.notif_score = function (notif) {
        var _a;
        (_a = this.scoreCtrl[notif.args.playerId]) === null || _a === void 0 ? void 0 : _a.toValue(notif.args.newScore);
    };
    SeaSaltPaper.prototype.notif_playCards = function (notif) {
        this.getPlayerTable(notif.args.playerId).addCardsToTable(notif.args.cards);
    };
    SeaSaltPaper.prototype.notif_endRound = function () {
        var _a;
        this.playersTables.forEach(function (playerTable) { return playerTable.cleanTable(); });
        (_a = this.cardsPointsCounter) === null || _a === void 0 ? void 0 : _a.toValue(0);
        [1, 2].forEach(function (discardNumber) {
            var currentCardDiv = document.getElementById("discard".concat(discardNumber)).firstElementChild;
            currentCardDiv === null || currentCardDiv === void 0 ? void 0 : currentCardDiv.parentElement.removeChild(currentCardDiv); // animate cards to deck?
        });
    };
    SeaSaltPaper.prototype.notif_updateCardsPoints = function (notif) {
        this.cardsPointsCounter.toValue(notif.args.cardsPoints);
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    SeaSaltPaper.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = "<strong style=\"color: darkred;\">".concat(_(args.announcement), "</strong>");
                }
                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus'].forEach(function (field) {
                    if (args[field] && args[field][0] != '<') {
                        args[field] = "<strong>".concat(args[field], "</strong>");
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
