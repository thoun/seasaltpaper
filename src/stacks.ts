class Stacks {
    constructor(private game: SeaSaltPaperGame, gamedatas: SeaSaltPaperGamedatas) {
        [1, 2].filter(number => gamedatas[`discardTopCard${number}`]).forEach(number => 
            game.cards.createMoveOrUpdateCard(gamedatas[`discardTopCard${number}`], `discard${number}`)
        );

        document.getElementById('deck').addEventListener('click', () => this.game.takeCardsFromDeck());
        
    }
}