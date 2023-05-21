class Stacks {
    private deckCounter: Counter;

    private discardStocks: Deck<Card>[] = [];
    private pickStock: LineStock<Card>;

    private get deckDiv() {
        return document.getElementById('deck');
    }

    constructor(private game: SeaSaltPaperGame, gamedatas: SeaSaltPaperGamedatas) {
        this.deckDiv.addEventListener('click', () => this.game.takeCardsFromDeck());
        this.deckCounter = new ebg.counter();
        this.deckCounter.create(`deck-counter`);
        this.setDeckCount(gamedatas.remainingCardsInDeck);

        [1, 2].forEach(number => {
            const discardDiv = document.getElementById(`discard${number}`);
            const cardNumber = gamedatas[`remainingCardsInDiscard${number}`];
            this.discardStocks[number] = new Deck<Card>(this.game.cardsManager, discardDiv, {
                autoUpdateCardNumber: false,
                cardNumber,
                topCard: gamedatas[`discardTopCard${number}`],
                counter: {
                    extraClasses: 'pile-counter',
                }
            });
            discardDiv.addEventListener('click', () => this.game.onDiscardPileClick(number));
            // this.discardStocks[number].onCardClick = () => this.game.onDiscardPileClick(number);
        });
        
        this.pickStock = new LineStock<Card>(this.game.cardsManager, document.getElementById('pick'), {
            gap: '0px',
        });
        this.pickStock.onCardClick = card => this.game.onCardClick(card);
    }
    
    public makeDeckSelectable(selectable: boolean) {
        this.deckDiv.classList.toggle('selectable', selectable);
    }

    public makeDiscardSelectable(selectable: boolean) {
        [1, 2].forEach(number => 
            this.discardStocks[number].getCards().forEach(card => this.discardStocks[number].getCardElement(card).classList.toggle('selectable', selectable))
        );
    }

    public makePickSelectable(selectable: boolean) {
        this.pickStock.getCards().forEach(card => this.pickStock.getCardElement(card).classList.toggle('selectable', selectable));
    }
    
    public showPickCards(show: boolean, cards?: Card[], currentPlayer: boolean = false) {
        document.getElementById('pick').dataset.visible = show.toString();

        cards?.forEach(card => {
            if (document.getElementById(`ssp-card-${card.id}`)?.parentElement?.id !== 'pick') {
                this.pickStock.addCard(card, {
                    fromElement: document.getElementById('deck')
                }, {
                    visible: false, // start hidden
                });
                // set card informations
                if (currentPlayer) {
                    this.pickStock.setCardVisible(card, true, { updateData: true, updateFront: true, updateBack: true, });
                }
            }
        });
        this.game.updateTableHeight();
    }

    public setDeckCount(number: number) {
        this.deckCounter.setValue(number);
        document.getElementById(`deck`).classList.toggle('hidden', number == 0);
    }
    
    public setDiscardCard(discardNumber: number, card: Card | null, newCount: number | null = null, from: HTMLElement = undefined) {
        if (card) {
            this.discardStocks[discardNumber].addCard(card, { fromElement: from });
            this.discardStocks[discardNumber].setCardVisible(card, true);
        }
        if (newCount !== null) {
            this.discardStocks[discardNumber].setCardNumber(newCount);
        }
    }
    
    public cleanDiscards(deckStock: CardStock<Card>) {
        [1, 2].forEach(discardNumber => {
            deckStock.addCards(this.discardStocks[discardNumber].getCards(), undefined, { visible: false });
            this.discardStocks[discardNumber].setCardNumber(0);
        });
    }
}