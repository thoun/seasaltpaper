class CardsManager extends CardManager<Card> {
    constructor (public game: SeaSaltPaperGame) {
        super(game, {
            getId: (card) => `ssp-card-${card.id}`,
            setupDiv: (card: Card, div: HTMLElement) => {
                div.dataset.cardId = ''+card.id;
            },
            setupFrontDiv: (card: Card, div: HTMLElement) => { 
                div.dataset.cardId = `${this.getId(card)}-front`;
                div.dataset.category = ''+card.category;
                div.dataset.family = ''+card.family;
                div.dataset.color = ''+card.color;
                div.dataset.index = ''+card.index;
                game.setTooltip(div.id, this.getTooltip(card.category, card.family));
            },
            animationManager: game.animationManager,
        });
    }

    

    public getTooltip(category: number, family?: number/*, withCount: boolean = false*/) {
        const withCount = true;
        switch(category) {
            case 1:
                return `
                <div><strong>${_("Mermaid")}</strong> ${withCount ? '(x4)' : ''}</div>
                ${_("1 point for each card of the color the player has the most of. If they have more mermaid cards, they must look at which of the other colors they have more of. The same color cannot be counted for more than one mermaid card.")}
                <br><br>
                <strong>${_("Effect: If they place 4 mermaid cards, the player immediately wins the game.")}</strong>`;
            case 2:
                if (family >= 4) {
                    return `<div><strong>${_("Swimmer")}/${_("Shark")}</strong> ${withCount ? '('+_('${number} of each').replace('${number}', 'x5')+')' : ''}</div>
                    <div>${_("1 point for each combination of swimmer and shark cards.")}</div><br>
                    <div>${_("Effect:")} ${_("The player steals a random card from another player and adds it to their hand.")}</div>`;
                }
                const duoCards = [
                    [_('Crab'), _("The player chooses a discard pile, consults it without shuffling it, and chooses a card from it to add to their hand. They do not have to show it to the other players."), 9],
                    [_('Boat'), _("The player immediately takes another turn."), 8],
                    [_('Fish'), _("The player adds the top card from the deck to their hand."), 7]
                ];
                const duo = duoCards[family - 1];
                return `<div><strong>${duo[0]}</strong> ${withCount ? `(x${duo[2]})` : ''}</div>
                <div>${_("1 point for each pair of ${card} cards.").replace('${card}', duo[0])}</div><br>
                <div>${_("Effect:")} ${_(duo[1])}</div>`;
            case 3:
                const collectorCards = [
                    ['0, 2, 4, 6, 8, 10', '1, 2, 3, 4, 5, 6', _('Shell')],
                    ['0, 3, 6, 9, 12', '1, 2, 3, 4, 5', _('Octopus')],
                    ['1, 3, 5', '1, 2, 3', _('Penguin')],
                    ['0, 5', '1,  2', _('Sailor')],
                ];
                const collector = collectorCards[family - 1];
                return `<div><strong>${collector[2]}</strong> ${withCount ? `(x${collector[0].split(',').length})` : ''}</div>
                <div>${_("${points} points depending on whether the player has ${numbers} ${card} cards.").replace('${points}', collector[0]).replace('${numbers}', collector[1]).replace('${card}', collector[2])}</div>`;
            case 4:
                const multiplierCards = [
                    [_('The lighthouse'), _('Boat'), 1],
                    [_('The shoal of fish'), _('Fish'), 1],
                    [_('The penguin colony'), _('Penguin'), 2],
                    [_('The captain'), _('Sailor'), 3],
                ];
                const multiplier = multiplierCards[family - 1];
                return `<div><strong>${multiplier[0]}</strong> (x1)</div>
                <div>${_("${points} point(s) per ${card} card.").replace('${points}', multiplier[2]).replace('${card}', multiplier[1])}</div>
                <div>${_("This card does not count as a ${card} card.").replace('${card}', multiplier[1])}</div>`;
        }
            
    }
}