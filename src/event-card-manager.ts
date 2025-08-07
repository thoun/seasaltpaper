class EventCardManager extends CardManager<EventCard> {

    constructor (public game: SeaSaltPaperGame) {
        super(game, {
            getId: (card: EventCard) => `event-card-${card.id}`,
            setupDiv: (card: EventCard, div: HTMLElement) => div.classList.add('event-card'),
            setupFrontDiv: (card: EventCard, div: HTMLElement) => this.setupFrontDiv(card, div),
            cardWidth: 208,
            cardHeight: 149,
            animationManager: game.animationManager,
        });
    }

    private setupFrontDiv(card: EventCard, div: HTMLElement) {
        div.style.setProperty('--index', `${card.type - 1}`);
        this.game.setTooltip(div.id, this.getTooltip(card));
    }

    private getTooltip(card: EventCard): string {
        let html = /*`
        <strong>${_('Points:')}</strong> ${card.points}<br>
        <strong>${_('Number:')}</strong> ${card.number ?? _('Joker')}<br>
        <strong>${_('Color:')}</strong> ${this.getColorName(card.color)}
        `*/`TODO`;

        return html;
    }
   
}
