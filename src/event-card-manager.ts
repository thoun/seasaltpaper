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
        this.game.setTooltip(div.id, this.getTooltip(card.type));

        if (!div.lastElementChild) {
            div.innerHTML = `
            <div class="event-trophy-wrapper">
                <div class="event-trophy" data-for="${card.for}"></div>
            </div>
            `;
        }
    }

    public getTooltip(type: number) {
        const forText = [5, 6, 8, 9].includes(type) ? 
            _('The player with the most points places the card in front of them.') :
            _('The player with the fewest points places the card in front of them.');

        return this.getPowerTooltip(type) + `
        <br><br>
        <i>${_('At the end of the round:')} ${forText}</i>`;
    }

    public getPowerTooltip(type: number) {
        switch(type) {
            case 1:
                return `
                <div><strong>${_("The Hermit crab")}</strong></div>
                ${_("When a pair of <strong>crabs</strong> is played, the player takes one card from each discard pile.")}`;
            case 2:
                return `
                <div><strong>${_("The Sunfish")}</strong></div>
                ${_("When a pair of <strong>fish</strong> is played, the player adds the first two cards from the deck to their hand.")}`;
            case 3:
                return `
                <div><strong>${_("The Water Rodeo")}</strong></div>
                ${_("Adds new effects. Each duo scores 1 point.")}
                <br><br>
                ${_("When a pair of <strong>swimmers</strong> is placed, the player can look at an opponent’s hand. They can then swap one of their cards with one of their opponent’s.")}
                <br><br>
                ${_("When a pair of <strong>sharks</strong> is played, the player steals a pair placed in front of an opponent. They place it in front of themselves without triggering its effect.")}
                <br><br>
                ${_("Note: The usual combinations of a <strong>swimmer card + shark card</strong> and a <strong>swimmer card + jellyfish card</strong> (with <i>Extra Salt</i> cards) are still valid.")}
                `;
            case 4:
                return `
                <div><strong>${_("The Dance of the Shells")}</strong></div>
                ${_("Each <strong>shell card</strong> scores 2 points.")}`;
            case 5:
                return `
                <div><strong>${_("The Kraken")}</strong></div>
                ${_("Each <strong>octopus card</strong> scores 1 point.")}`;
            case 6:
                return `
                <div><strong>${_("The Tornado")}</strong></div>
                ${_("<strong>Mermaid cards</strong> do not score points, but a player still wins immediately if they have all 4 mermaid cards.")}`;
            case 7:
                return `
                <div><strong>${_("The Dance of the Mermaids")}</strong></div>
                ${_("If 3 <strong>mermaids</strong> are played (instead of 4), the player immediately wins the game.")}`;
            case 8:
                return `
                <div><strong>${_("The Treasure Chest")}</strong></div>
                ${_("A player must reach 10 points (instead of 7) to end the round.")}`;
            case 9:
                return `
                <div><strong>${_("The Diodon Fish")}</strong></div>
                ${_("A player cannot end the round by saying <strong>STOP</strong>; they have to say <strong>LAST CHANCE</strong>.")}`;
            case 10:
                return `
                <div><strong>${_("The Angelfish")}</strong></div>
                ${_("At the end of a player’s turn, if the two visible cards on the discard piles are the same color, the player chooses one of them to add to their hand.")}`;
            case 11:
                return `
                <div><strong>${_("The Dolphins")}</strong></div>
                ${_("When a player discards a collection card (shell, octopus, penguin, sailor, or seahorse), the top card from the draw pile is added to their hand.")}`;
            case 12:
                return `
                <div><strong>${_("The Coral Reef")}</strong></div>
                ${_("A player may place a shell face down in front of them. If they do, they are immune to all attacks. But, that shell is worth no points.")}`;
        }
    }
    
    public setForHelp(card: EventCard, divId: string): void {
        const div = document.getElementById(divId);
        div.classList.add('card', 'event-card');
        div.dataset.side = 'front';
        div.innerHTML = `
        <div class="card-sides">
            <div class="card-side front">
            </div>
            <div class="card-side back">
            </div>
        </div>`
        this.setupFrontDiv(card, div.querySelector('.front'));
    }   
}
