class Stacks {

    private get deckDiv() {
        return document.getElementById('deck');
    }
    private get pickDiv() {
        return document.getElementById('pick');
    }

    constructor(private game: SeaSaltPaperGame, gamedatas: SeaSaltPaperGamedatas) {
        [1, 2].filter(number => gamedatas[`discardTopCard${number}`]).forEach(number => 
            game.cards.createMoveOrUpdateCard(gamedatas[`discardTopCard${number}`], `discard${number}`)
        );

        this.deckDiv.addEventListener('click', () => this.game.takeCardsFromDeck());
        [1, 2].forEach(number => 
            document.getElementById(`discard${number}`).addEventListener('click', () => this.game.onDiscardPileClick(number))
        );
        
    }
    
    public makeDeckSelectable(selectable: boolean) {
        this.deckDiv.classList.toggle('selectable', selectable);
    }

    public makeDiscardSelectable(selectable: boolean) {
        [1, 2].forEach(number => 
            document.getElementById(`discard${number}`).firstElementChild?.classList.toggle('selectable', selectable)
        );
    }

    public makePickSelectable(selectable: boolean) {
        const cards = Array.from(this.pickDiv.getElementsByClassName('card')) as HTMLDivElement[];
        cards.forEach(card => card.classList.toggle('selectable', selectable));
    }
    
    public showPickCards(show: boolean, cards?: Card[]) {
        this.pickDiv.dataset.visible = show.toString();

        cards?.forEach(card => 
            this.game.cards.createMoveOrUpdateCard(card, `pick`, false, 'deck')
        );
    }
}