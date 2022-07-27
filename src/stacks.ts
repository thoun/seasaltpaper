class Stacks {
    public deckCounter: Counter;
    public discardCounters: Counter[] = [];

    private get deckDiv() {
        return document.getElementById('deck');
    }
    private get pickDiv() {
        return document.getElementById('pick');
    }

    constructor(private game: SeaSaltPaperGame, gamedatas: SeaSaltPaperGamedatas) {
        this.deckDiv.addEventListener('click', () => this.game.takeCardsFromDeck());
        this.deckCounter = new ebg.counter();
        this.deckCounter.create(`deck-counter`);
        this.deckCounter.setValue(gamedatas.remainingCardsInDeck);

        [1, 2].forEach(number => {
            if (gamedatas[`discardTopCard${number}`]) {
                game.cards.createMoveOrUpdateCard(gamedatas[`discardTopCard${number}`], `discard${number}`);
            }
            document.getElementById(`discard${number}`).addEventListener('click', () => this.game.onDiscardPileClick(number));
            
            this.discardCounters[number] = new ebg.counter();
            this.discardCounters[number].create(`discard${number}-counter`);
            this.discardCounters[number].setValue(gamedatas[`remainingCardsInDiscard${number}`]);
        });
        
    }
    
    public makeDeckSelectable(selectable: boolean) {
        this.deckDiv.classList.toggle('selectable', selectable);
    }

    public makeDiscardSelectable(selectable: boolean) {
        [1, 2].forEach(number => 
            this.getDiscardCard(number)?.classList.toggle('selectable', selectable)
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

    public getDiscardCard(discardNumber: number): HTMLDivElement | null {
        const currentCardDivs = Array.from(document.getElementById(`discard${discardNumber}`).getElementsByClassName('card')) as HTMLDivElement[];
        return currentCardDivs.length > 0 ? currentCardDivs[0] : null;
    }
}