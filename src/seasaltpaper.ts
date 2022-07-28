declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

const ANIMATION_MS = 500;
const ACTION_TIMER_DURATION = 5;

const ZOOM_LEVELS = [0.5, 0.625, 0.75, 0.875, 1];
const ZOOM_LEVELS_MARGIN = [-100, -60, -33, -14, 0];
const LOCAL_STORAGE_ZOOM_KEY = 'SeaSaltPaper-zoom';

class SeaSaltPaper implements SeaSaltPaperGame {
    public zoom: number = 1;
    public cards: Cards;

    private gamedatas: SeaSaltPaperGamedatas;
    private stacks: Stacks;
    private playersTables: PlayerTable[] = [];
    private roundNumberCounter: Counter;
    //private cardsPointsCounter: Counter;
    private selectedCards: number[];
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

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
        this.addHelp();

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
            this.stacks.makeDiscardSelectable(true);
        }
    }
    
    private onEnteringChooseCard(args: EnteringChooseCardArgs) {
        this.stacks.showPickCards(true, args._private?.cards);
        this.stacks.makePickSelectable((this as any).isCurrentPlayerActive());        
        this.stacks.deckCounter.setValue(args.remainingCardsInDeck);
    }
    
    private onEnteringPutDiscardPile(args: EnteringChooseCardArgs) {
        this.stacks.showPickCards(true, args._private?.cards);
        this.stacks.makeDiscardSelectable((this as any).isCurrentPlayerActive());
    }

    private onEnteringPlayCards() {
        this.stacks.showPickCards(false);
        this.selectedCards = [];

        this.getCurrentPlayerTable()?.setSelectable(true);
        this.updateDisabledPlayCards();
    }
    
    private onEnteringChooseDiscardPile() {
        this.stacks.makeDiscardSelectable((this as any).isCurrentPlayerActive());
    }
    
    private onEnteringChooseDiscardCard(args: EnteringChooseCardArgs) {
        const cards = args._private?.cards;
        const pickDiv = document.getElementById('discard-pick');
        pickDiv.innerHTML = '';
        pickDiv.dataset.visible = 'true';

        console.log(args);
        cards?.forEach(card => {
            this.cards.createMoveOrUpdateCard(card, `discard-pick`, false, 'discard'+args.discardNumber)
            document.getElementById(`card-${card.id}`).classList.add('selectable');
        });
    }

    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

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
    }

    private onLeavingTakeCards() {
        this.stacks.makeDeckSelectable(false);
        this.stacks.makeDiscardSelectable(false);
    }
    
    private onLeavingChooseCard() {
        this.stacks.makePickSelectable(false);
    }

    private onLeavingPutDiscardPile() {
        this.stacks.makeDiscardSelectable(false);
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
                        (this as any).addActionButton(`endGameWithSirens_button`, _("Play the four Mermaids"), () => this.endGameWithSirens(), null, true, 'red');
                    }
                    (this as any).addActionButton(`endTurn_button`, _("End turn"), () => this.endTurn());
                    if (playCardsArgs.canCallEndRound) {
                        (this as any).addActionButton(`endRound_button`, _('End round ("LAST CHANCE")'), () => this.endRound(), null, null, 'red');
                        (this as any).addActionButton(`immediateEndRound_button`, _('End round ("STOP")'), () => this.immediateEndRound(), null, null, 'red');

                        this.setTooltip(`endRound_button`, `${_("Say <strong>LAST CHANCE</strong> if you are willing to take the bet of having the most points at the end of the round. The other players each take a final turn (take a card + play cards) which they complete by revealing their hand, which is now protected from attacks. Then, all players count the points on their cards (in their hand and in front of them).")}<br><br>
                        ${_("If your hand is higher or equal to that of your opponents, bet won! You score the points for your cards + the color bonus (1 point per card of the color they have the most of). Your opponents only score their color bonus.")}<br><br>
                        ${_("If your score is less than that of at least one opponent, bet lost! You score only the color bonus. Your opponents score points for their cards.")}`);
                        this.setTooltip(`immediateEndRound_button`, _("Say <strong>STOP</strong> if you do not want to take a risk. All players reveal their hands and immediately score the points on their cards (in their hand and in front of them)."));
                    }
                    dojo.addClass(`playCards_button`, `disabled`);
                    /*if (!playCardsArgs.canCallEndRound) {
                        dojo.addClass(`endRound_button`, `disabled`);
                        dojo.addClass(`immediateEndRound_button`, `disabled`);
                    }*/
                    
                    if (!playCardsArgs.canDoAction) {
                        this.startActionTimer('endTurn_button', ACTION_TIMER_DURATION);
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

    public setTooltip(id: string, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }

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
          this.onPreferenceChange(prefId, prefValue);
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
      
    private onPreferenceChange(prefId: number, prefValue: number) {
        switch (prefId) {
            case 201: 
                document.getElementsByTagName('html')[0].dataset.origamiFont = (prefValue == 2).toString();
                break;
        }
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

    private addHelp() {
        let labels = [
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
        ].map((label, index) => `<span class="label" data-row="${Math.floor(index / 2)}"  data-column="${Math.floor(index % 2)}">${label}</span>`).join('');
        dojo.place(`
            <button id="seasaltpaper-help-button">?</button>
            <button id="color-help-button" data-folded="true">${labels}</button>
        `, 'left-side');
        document.getElementById('seasaltpaper-help-button').addEventListener('click', () => this.showHelp());
        const helpButton = document.getElementById('color-help-button');
        helpButton.addEventListener('click', () => helpButton.dataset.folded = helpButton.dataset.folded == 'true' ? 'false' : 'true');
    }

    private showHelp() {
        const helpDialog = new ebg.popindialog();
        helpDialog.create('seasaltpaperHelpDialog');
        helpDialog.setTitle(_("Card details").toUpperCase());

        const duoCards = [
            [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players.")],
            [_('Boat'), _("The player immediately takes another turn.")],
            [_('Fish'), _("The player adds the top card from the deck to their hand.")],
        ].map((array, index) => `
        <div class="help-section">
            <div id="help-pair-${index+1}">
            </div>
            <div>
                <div><strong>${array[0]}</strong></div>
                <div>${_("1 point for each pair of ${card} cards.").replace('${card}', array[0])}</div>
                <div>${_("Effect:")} ${_(array[1])}</div>
            </div>
        </div>
        `).join('');

        const duoSection = `
        ${duoCards}
        <div class="help-section">
            <div id="help-pair-4">
            </div>
            <div id="help-pair-5">
            </div>
            <div>
                <div><strong>${_("Swimmer")}/${_("Shark")}</strong></div>
                <div>${_("1 point for each combination of swimmer and shark cards.")}</div>
                <div>${_("Effect:")} ${_("The player steals a random card from another player and adds it to their hand.")}</div>
            </div>
        </div>
        ${_("Note: The points for duo cards count whether the cards have been played or not. However, the effect is only applied when the player places the two cards in front of them.")}`;

        const mermaidSection = `
        <div class="help-section">
            <div id="help-mermaid">
            </div>
            <div>
                ${_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card.")}
                <br><br>
                <strong>${_("Effect: If they place 4 mermaid cards, the player immediately wins the game.")}</strong>
            </div>
        </div>`;

        const collectorCards = [
            ['0, 2, 4, 6, 8, 10', '1, 2, 3, 4, 5, 6', _('Shell')],
            ['0, 3, 6, 9, 12', '1, 2, 3, 4, 5', _('Octopus')],
            ['1, 3, 5', '1, 2, 3', _('Penguin')],
            ['0, 5', '1,  2', _('Sailor')],
        ].map((array, index) => `
        <div class="help-section">
            <div id="help-collector-${index+1}">
            </div>
            <div>
                <div><strong>${array[2]}</strong></div>
                <div>${_("${points} points depending on whether the player has ${numbers} ${card} cards.").replace('${points}', array[0]).replace('${numbers}', array[1]).replace('${card}', array[2])}</div>
            </div>
        </div>
        `).join('');

        const multiplierCards = [
            [_('The lighthouse'), _('Boat')],
            [_('The shoal of fish'), _('Fish')],
            [_('The penguin colony'), _('Penguin')],
            [_('The captain'), _('Sailor')],
        ].map((array, index) => `
        <div class="help-section">
            <div id="help-multiplier-${index+1}">
            </div>
            <div>
                <div><strong>${array[0]}</strong></div>
                <div>${_("1 point per ${card} card.").replace('${card}', array[1])}</div>
                <div>${_("This card does not count as a ${card} card.").replace('${card}', array[1])}</div>
            </div>
        </div>
        `).join('');
        
        let html = `
        <div id="help-popin">
            ${_("<strong>Important:</strong> When it is said that the player counts or scores the points on their cards, it means both those in their hand and those in front of them.")}

            <h1>${_("Duo cards")}</h1>
            ${duoSection}
            <h1>${_("Mermaid cards")}</h1>
            ${mermaidSection}
            <h1>${_("Collector cards")}</h1>
            ${collectorCards}
            <h1>${_("Point Multiplier cards")}</h1>
            ${multiplierCards}
        </div>
        `;
        
        // Show the dialog
        helpDialog.setContent(html);

        helpDialog.show();

        // pair
        [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]].forEach(([family, color]) => this.cards.createMoveOrUpdateCard({id: 1020 + family, category: 2, family, color, index: 0 } as any, `help-pair-${family}`));
        // mermaid
        this.cards.createMoveOrUpdateCard({id: 1010, category: 1 } as any, `help-mermaid`);
        // collector
        [[1, 1], [2, 2], [3, 6], [4, 9]].forEach(([family, color]) => this.cards.createMoveOrUpdateCard({id: 1030 + family, category: 3, family, color, index: 0 } as any, `help-collector-${family}`));
        // multiplier
        [1, 2, 3, 4].forEach(family => this.cards.createMoveOrUpdateCard({id: 1040 + family, category: 4, family } as any, `help-multiplier-${family}`));
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
            ['stealCard', ANIMATION_MS],
            ['announceEndRound', ANIMATION_MS],
            ['endRound', ANIMATION_MS],
            ['score', ANIMATION_MS * 3], // TODO animate ?
            ['newRound', 1],
            ['updateCardsPoints', 1],
        ];
    
        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });

        (this as any).notifqueue.setIgnoreNotificationCheck('cardInHandFromPick', (notif: Notif<NotifCardInHandFromPickArgs>) => 
            notif.args.playerId == this.getPlayerId() && !notif.args.card.category
        );
        (this as any).notifqueue.setIgnoreNotificationCheck('stealCard', (notif: Notif<NotifStealCardArgs>) => 
            [notif.args.playerId, notif.args.opponentId].includes(this.getPlayerId()) && !(notif.args as any).cardName
        );
    }

    notif_cardInDiscardFromDeck(notif: Notif<NotifCardInDiscardFromDeckArgs>) {
        this.cards.createMoveOrUpdateCard(notif.args.card, `discard${notif.args.discardId}`, true, 'deck');
        this.stacks.deckCounter.setValue(notif.args.remainingCardsInDeck);
        this.roundNumberCounter.toValue(notif.args.roundNumber);
    } 

    notif_cardInHandFromDiscard(notif: Notif<NotifCardInHandFromDiscardArgs>) {
        const card = notif.args.card;
        const playerId = notif.args.playerId;
        const discardNumber = notif.args.discardId;
        const maskedCard = playerId == this.getPlayerId() ? card : { id: card.id } as Card;
        this.getPlayerTable(playerId).addCardsToHand([maskedCard]);

        if (notif.args.newDiscardTopCard) {
            this.cards.createMoveOrUpdateCard(notif.args.newDiscardTopCard, `discard${discardNumber}`, true);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
    } 

    notif_cardInHandFromPick(notif: Notif<NotifCardInHandFromPickArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addCardsToHand([notif.args.card]);
    }   

    notif_cardInDiscardFromPick(notif: Notif<NotifCardInDiscardFromPickArgs>) {
        const currentCardDiv = this.stacks.getDiscardCard(notif.args.discardId);
        const discardNumber = notif.args.discardId;
        this.cards.createMoveOrUpdateCard(notif.args.card, `discard${discardNumber}`);
        
        if (currentCardDiv) {
            setTimeout(() => currentCardDiv.parentElement.removeChild(currentCardDiv), 500);
        }
        this.stacks.discardCounters[discardNumber].setValue(notif.args.remainingCardsInDiscard);
    }

    notif_score(notif: Notif<NotifScoreArgs>) {
        (this as any).scoreCtrl[notif.args.playerId]?.toValue(notif.args.newScore);
    }
    notif_newRound() {}

    notif_playCards(notif: Notif<NotifPlayCardsArgs>) {
        this.getPlayerTable(notif.args.playerId).addCardsToTable(notif.args.cards);
    }

    notif_stealCard(notif: Notif<NotifStealCardArgs>) {
        const stealerId = notif.args.playerId;
        const card = notif.args.card;
        this.getPlayerTable(stealerId).addCardsToHand([card]);
    }

    notif_announceEndRound(notif: Notif<NotifAnnounceEndRoundArgs>) {
        this.getPlayerTable(notif.args.playerId).showAnnouncement(notif.args.announcement);
    }

    notif_endRound() {
        this.playersTables.forEach(playerTable => playerTable.cleanTable());
        
        this.getCurrentPlayerTable()?.setHandPoints(0);
        [1, 2].forEach(discardNumber => {
            const currentCardDiv = this.stacks.getDiscardCard(discardNumber);
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