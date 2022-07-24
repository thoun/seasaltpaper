class Stacks {
    constructor(private game: SeaSaltPaperGame, gamedatas: SeaSaltPaperGamedatas) {
        [1, 2].filter(number => gamedatas[`discardTopCard${number}`]).forEach(number => 
            game.cards.createMoveOrUpdateCard(gamedatas[`discardTopCard${number}`], `discard${number}`)
        );

        document.getElementById('deck').addEventListener('click', () => this.game.takeCardsFromDeck());
        [1, 2].forEach(number => 
            document.getElementById(`discard${number}`).addEventListener('click', () => {
                if (gamedatas.gamestate.name === 'putDiscardPile') {
                    this.game.putDiscardPile(number);
                }
            })
        );
        
    }
    
    public makeDeckSelectable(selectable: boolean) {
        // TODO
    }

    public makeDiscardSelectable(canTakeFromDiscard: number[]) {
        // TODO
    }
    
    public showPickCards(show: boolean, cards?: Card[]) {
        const pickDiv = document.getElementById('pick');
        pickDiv.innerHTML = cards ? '' : 'TODO opponent is choosing';
        pickDiv.dataset.visible = show.toString();

        cards?.forEach(card => 
            this.game.cards.createMoveOrUpdateCard(card, `pick`/*, false, 'deck' TODO*/)
        );
    }
}