declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;

const ZOOM_LEVELS = [0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
const ZOOM_LEVELS_MARGIN = [-100, -60, -33, -14, 0, 20, 33.34];
const LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';

function formatTextIcons(rawText: string) {
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

class SeaSaltPaper implements SeaSaltPaperGame {
    public zoom: number = 1;
    public cards: Cards;

    private gamedatas: SeaSaltPaperGamedatas;
    private stacks: Stacks;
    private playersTables: PlayerTable[] = [];
    private roundNumberCounter: Counter;
    //private cardsPointsCounter: Counter;
    private selectedCards: number[];

    constructor() {
        const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
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

    public setup(gamedatas: SeaSaltPaperGamedatas) {
        log( "Starting game setup" );
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.cards = new Cards(this);
        this.stacks = new Stacks(this, this.gamedatas);
        //this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);

        document.getElementById('round-panel').innerHTML = `${_('Round')}&nbsp;<span id="round-number-counter"></span>&nbsp;/&nbsp;${6 - Object.keys(gamedatas.players).length}`;
        this.roundNumberCounter = new ebg.counter();
        this.roundNumberCounter.create(`round-number-counter`);
        this.roundNumberCounter.setValue(gamedatas.roundNumber);

        this.setupNotifications();
        this.setupPreferences();

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
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
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`;
        (this as any).updatePageTitle();
    }
    
    private onEnteringTakeCards(args: EnteringTakeCardsArgs) {
        if (!args.canTakeFromDiscard.length) {
            this.setGamestateDescription('NoDiscard');
        }

        if ((this as any).isCurrentPlayerActive()) {
            this.stacks.makeDeckSelectable(args.canTakeFromDeck);
            this.stacks.makeDiscardSelectable(args.canTakeFromDiscard);
        }
    }
    
    private onEnteringChooseCard(args: EnteringChooseCardArgs) {
        this.stacks.showPickCards(true, args._private?.cards);
    }

    private onEnteringPlayCards() {
        this.stacks.showPickCards(false);
        this.selectedCards = [];

        this.getCurrentPlayerTable()?.setSelectable(true);
        this.updateDisabledPlayCards();
    }
    
    private onEnteringChooseDiscardCard(args: EnteringChooseCardArgs) {
        //this.stacks.showPickCards(true, args._private?.cards); copy of, TEMP
        const cards = args._private?.cards;
        const pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = cards ? '' : 'TODO opponent is choosing';
        pickDiv.dataset.visible = 'true';

        cards?.forEach(card => 
            this.cards.createMoveOrUpdateCard(card, `discard-pick`/*, false, 'deck' TODO*/)
        );
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

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
    }

    private onLeavingTakeCards() {
        this.stacks.makeDeckSelectable(false);
        this.stacks.makeDiscardSelectable([]);
    }

    private onLeavingPlayCards() {
        this.selectedCards = null;
        this.getCurrentPlayerTable()?.setSelectable(false);
    }

    private onLeavingChooseDiscardCard() {
        // TEMP TODO
        const pickDiv = document.getElementById('discard-pick');
        pickDiv.dataset.visible = 'false';
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'playCards':
                    const playCardsArgs = args as EnteringPlayCardsArgs;
                    (this as any).addActionButton(`playCards_button`, _("Play selected cards"), () => this.playSelectedCards());
                    if (playCardsArgs.hasFourSirens) {
                        (this as any).addActionButton(`endGameWithSirens_button`, _("Play the four sirens"), () => this.endGameWithSirens());
                    }
                    (this as any).addActionButton(`endTurn_button`, _("End turn"), () => this.endTurn());
                    (this as any).addActionButton(`endRound_button`, _('End round ("LAST CHANCE")'), () => this.endRound(), null, null, 'red');
                    (this as any).addActionButton(`immediateEndRound_button`, _('End round ("STOP")'), () => this.immediateEndRound(), null, null, 'red');
                    if (!playCardsArgs.canCallEndRound) {
                        dojo.addClass(`playCards_button`, `disabled`);
                        dojo.addClass(`endRound_button`, `disabled`);
                        dojo.addClass(`immediateEndRound_button`, `disabled`);
                    }
                    break;
                case 'chooseOpponent':
                    const chooseOpponentArgs = args as EnteringChooseOpponentArgs;
        
                    chooseOpponentArgs.playersIds.forEach(playerId => {
                        const player = this.getPlayer(playerId);
                        (this as any).addActionButton(`choosePlayer${playerId}-button`, player.name, () => this.chooseOpponent(playerId));
                        document.getElementById(`choosePlayer${playerId}-button`).style.border = `3px solid #${player.color}`;
                    });
                    break;
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    private getPlayer(playerId: number): SeaSaltPaperPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }

    private setZoom(zoom: number = 1) {
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, ''+this.zoom);
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);

        const div = document.getElementById('full-table');
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
        } else {
            div.style.transform = `scale(${zoom})`;
            div.style.margin = `0 ${ZOOM_LEVELS_MARGIN[newIndex]}% ${(1-zoom)*-100}% 0`;
        }
        
        document.getElementById('map').classList.toggle('hd', zoom > 1);

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
    }

    public zoomIn() {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public zoomOut() {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_control_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
          //this.onPreferenceChange(prefId, prefValue);
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );

        try {
            (document.getElementById('preference_control_203').closest(".preference_choice") as HTMLDivElement).style.display = 'none';
        } catch (e) {}
    }

    private getOrderedPlayers(gamedatas: SeaSaltPaperGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        return orderedPlayers;
    }

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

    private createPlayerTables(gamedatas: SeaSaltPaperGamedatas) {
        const orderedPlayers = this.getOrderedPlayers(gamedatas);

        orderedPlayers.forEach(player => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
    }

    private createPlayerTable(gamedatas: SeaSaltPaperGamedatas, playerId: number) {
        const table = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(table);
    }

    private updateDisabledPlayCards() {
        this.getCurrentPlayerTable()?.updateDisabledPlayCards(this.selectedCards);        
        document.getElementById(`playCards_button`)?.classList.toggle(`disabled`, this.selectedCards.length != 2);
    }
    
    public onCardClick(card: Card): void {
        const cardDiv = document.getElementById(`card-${card.id}`);
        const parentDiv = cardDiv.parentElement;

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
                if (parentDiv.dataset.myHand == `true`) {
                    if (this.selectedCards.includes(card.id)) {
                        this.selectedCards.splice(this.selectedCards.indexOf(card.id), 1);
                        cardDiv.classList.remove('selected');
                    } else {
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
    }

    public onDiscardPileClick(number: number): void {
        switch (this.gamedatas.gamestate.name) {
            case 'putDiscardPile':
                this.putDiscardPile(number);
                break;
            case 'chooseDiscardPile':
                this.chooseDiscardPile(number);
                break;
        }
    }

    private playSelectedCards() {
        if (this.selectedCards.length == 2) {
            this.playCards(this.selectedCards);
        }
    }

    public takeCardsFromDeck() {
        if(!(this as any).checkAction('takeCardsFromDeck')) {
            return;
        }

        this.takeAction('takeCardsFromDeck');
    }

    public takeCardFromDiscard(discardNumber: number) {
        if(!(this as any).checkAction('takeCardFromDiscard')) {
            return;
        }

        this.takeAction('takeCardFromDiscard', {
            discardNumber
        });
    }

    public chooseCard(id: number) {
        if(!(this as any).checkAction('chooseCard')) {
            return;
        }

        this.takeAction('chooseCard', {
            id
        });
    }

    public putDiscardPile(discardNumber: number) {
        if(!(this as any).checkAction('putDiscardPile')) {
            return;
        }

        this.takeAction('putDiscardPile', {
            discardNumber
        });
    }

    public playCards(ids: number[]) {
        if(!(this as any).checkAction('playCards')) {
            return;
        }

        this.takeAction('playCards', {
            'id1': ids[0],
            'id2': ids[1],
        });
    }

    public chooseDiscardPile(discardNumber: number) {
        if(!(this as any).checkAction('chooseDiscardPile')) {
            return;
        }

        this.takeAction('chooseDiscardPile', {
            discardNumber
        });
    }

    public chooseDiscardCard(id: number) {
        if(!(this as any).checkAction('chooseDiscardCard')) {
            return;
        }

        this.takeAction('chooseDiscardCard', {
            id
        });
    }

    public chooseOpponent(id: number) {
        if(!(this as any).checkAction('chooseOpponent')) {
            return;
        }

        this.takeAction('chooseOpponent', {
            id
        });
    }

    public endTurn() {
        if(!(this as any).checkAction('endTurn')) {
            return;
        }

        this.takeAction('endTurn');
    }

    public endGameWithSirens() {
        if(!(this as any).checkAction('endGameWithSirens')) {
            return;
        }

        this.takeAction('endGameWithSirens');
    }

    public endRound() {
        if(!(this as any).checkAction('endRound')) {
            return;
        }

        this.takeAction('endRound');
    }

    public immediateEndRound() {
        if(!(this as any).checkAction('immediateEndRound')) {
            return;
        }

        this.takeAction('immediateEndRound');
    }

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/seasaltpaper/seasaltpaper/${action}.html`, data, this, () => {});
    }

    private startActionTimer(buttonId: string, time: number) {
        if (Number((this as any).prefs[202]?.value) === 2) {
            return;
        }

        const button = document.getElementById(buttonId);
 
        let actionTimerId = null;
        const _actionTimerLabel = button.innerHTML;
        let _actionTimerSeconds = time;
        const actionTimerFunction = () => {
          const button = document.getElementById(buttonId);
          if (button == null || button.classList.contains('disabled')) {
            window.clearInterval(actionTimerId);
          } else if (_actionTimerSeconds-- > 1) {
            button.innerHTML = _actionTimerLabel + ' (' + _actionTimerSeconds + ')';
          } else {
            window.clearInterval(actionTimerId);
            button.click();
          }
        };
        actionTimerFunction();
        actionTimerId = window.setInterval(() => actionTimerFunction(), 1000);
    }

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
            ['cardInDiscardFromDeck', ANIMATION_MS],
            ['cardInHandFromDiscard', ANIMATION_MS],
            ['cardInHandFromPick', ANIMATION_MS],
            ['cardInDiscardFromPick', ANIMATION_MS],
            ['playCards', ANIMATION_MS],
            ['announceEndRound', ANIMATION_MS],
            ['endRound', ANIMATION_MS],
            ['updateCardsPoints', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_cardInDiscardFromDeck(notif: Notif<NotifCardInHandFromDiscardArgs>) {
        this.cards.createMoveOrUpdateCard(notif.args.card, `discard${notif.args.discardId}`, true, 'deck');
    } 

    notif_cardInHandFromDiscard(notif: Notif<NotifCardInHandFromDiscardArgs>) {
        const card = notif.args.card;
        const playerId = notif.args.playerId;
        const maskedCard = playerId == this.getPlayerId() ? card : { id: card.id } as Card;
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);

        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, `discard${notif.args.discardId}`, true);
        }
    } 

    notif_cardInHandFromPick(notif: Notif<NotifCardInHandFromPickArgs>) {
        const playerId = notif.args.playerId;
        const from = playerId == this.getPlayerId() ? undefined : 'pick';
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card], from);
    }   

    notif_cardInDiscardFromPick(notif: Notif<NotifCardInDiscardFromPickArgs>) {
        const currentCardDiv = document.getElementById(`discard${notif.args.discardId}`).firstElementChild;
        this.cards.createMoveOrUpdateCard(notif.args.card, `discard${notif.args.discardId}`);
        
        if (currentCardDiv) {
            setTimeout(() => currentCardDiv.parentElement.removeChild(currentCardDiv), 500);
        }
    }

    notif_score(notif: Notif<NotifScoreArgs>) {
        (this as any).scoreCtrl[notif.args.playerId]?.toValue(notif.args.newScore);
    }

    notif_playCards(notif: Notif<NotifPlayCardsArgs>) {
        this.getPlayerTable(notif.args.playerId).addCardsToTable(notif.args.cards);
    }

    notif_announceEndRound(notif: Notif<NotifAnnounceEndRoundArgs>) {
        this.getPlayerTable(notif.args.playerId).showAnnouncement(notif.args.announcement);
    }

    notif_endRound() {
        this.playersTables.forEach(playerTable => playerTable.cleanTable());
        
        this.getCurrentPlayerTable()?.setHandPoints(0);
        [1, 2].forEach(discardNumber => {
            const currentCardDiv = document.getElementById(`discard${discardNumber}`).firstElementChild;
            currentCardDiv?.parentElement.removeChild(currentCardDiv); // animate cards to deck?
        });
    }

    notif_updateCardsPoints(notif: Notif<NotifUpdateCardsPointsArgs>) {
        this.getCurrentPlayerTable()?.setHandPoints(notif.args.cardsPoints);
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (args.announcement && args.announcement[0] != '<') {
                    args.announcement = `<strong style="color: darkred;">${_(args.announcement)}</strong>`;
                }

                ['discardNumber', 'roundPoints', 'cardsPoints', 'colorBonus'].forEach(field => {
                    if (args[field] && args[field][0] != '<') {
                        args[field] = `<strong>${args[field]}</strong>`;
                    }
                })

            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}