const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;;
const log = isDebug ? console.log.bind(window.console) : function () { };

class PlayerTable {
    public playerId: number;

    private currentPlayer: boolean;

    private get handCardsDiv() {
        return document.getElementById(`player-table-${this.playerId}-hand-cards`);
    }
    private get tableCardsDiv() {
        return document.getElementById(`player-table-${this.playerId}-table-cards`);
    }

    constructor(private game: SeaSaltPaperGame, player: SeaSaltPaperPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let html = `
        <div id="player-table-${this.playerId}" class="player-table">
            <div id="player-table-${this.playerId}-hand-cards" class="hand cards" data-current-player="${this.currentPlayer.toString()}" data-my-hand="${this.currentPlayer.toString()}"></div>
            <div class="name" style="color: #${player.color};">${player.name}</div>
            <div id="player-table-${this.playerId}-table-cards" class="table cards">
            </div>
        </div>
        `;
        dojo.place(html, document.getElementById('full-table'));

        this.addCardsToHand(player.handCards);
        this.addCardsToTable(player.tableCards);
    }
    
    public addCardsToHand(cards: Card[], from?: string) {
        this.addCards(cards, 'hand', from);
    }
    public addCardsToTable(cards: Card[], from?: string) {
        this.addCards(cards, 'table', from);
    }

    public cleanTable(): void {
        // TODO animate cards to deck?
        this.handCardsDiv.innerHTML = '';
        this.tableCardsDiv.innerHTML = '';
    }
    
    public addCards(cards: Card[], to: 'hand' | 'table', from?: string) {
        cards.forEach(card => this.game.cards.createMoveOrUpdateCard(card, `player-table-${this.playerId}-${to}-cards`, false, from));
    }
    
    public setSelectable(selectable: boolean) {
        const cards = Array.from(this.handCardsDiv.getElementsByClassName('card')) as HTMLDivElement[];
        if (selectable) {
            cards.forEach(card => card.classList.add('selectable'));
        } else {
            cards.forEach(card => card.classList.remove('selectable', 'selected', 'disabled'));
        }
    }

    public updateDisabledPlayCards(selectedCards: number[]) {
        const cards = Array.from(this.handCardsDiv.getElementsByClassName('card')) as HTMLDivElement[];
        cards.forEach(card => {
            let disabled = false;
            if (card.dataset.category != '2') {
                disabled = true;
            } else {
                if (selectedCards.length >= 2) {
                    disabled = !selectedCards.includes(Number(card.dataset.id));
                } else if (selectedCards.length == 1) {
                    const family = Number(document.getElementById(`card-${selectedCards[0]}`).dataset.family);
                    const authorizedFamily = ''+(family >= 4 ? 9 - family : family);
                    disabled = Number(card.dataset.id) != selectedCards[0] && card.dataset.family != authorizedFamily;
                }
            }
            card.classList.toggle('disabled', disabled);
        });
    }
}