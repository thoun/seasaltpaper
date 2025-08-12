/**
 * Your game interfaces
 */

interface Card {
    id: number;
    location: string;
    locationArg: number;
    category: number;
    family: number;
    color: number;
    index: number;
    matchFamilies?: number[];
    flipped: boolean;
}

interface EventCard {
    id: number;
    type: number;
    for: 'top' | 'bottom';
}

interface ScoreDetails {
    cardsPoints: number | null;
    colorBonus: number | null;
}

interface SeaSaltPaperPlayer extends Player {
    playerNo: number;
    handCards: Card[];
    tableCards: Card[];
    eventCards?: EventCard[];
    cardsPoints?: number;
    detailledPoints?: number[];
    endCall?: {
        announcement: string;
        cardsPoints: number;
        betResult?: string;
    };
    endRoundPoints?: NotifUpdateCardsPointsArgs;
    scoringDetail?: ScoreDetails;
}

interface SeaSaltPaperGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: SeaSaltPaperPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    deckTopCard?: Card;
    remainingCardsInDeck: number;
    discardTopCard1: Card;
    discardTopCard2: Card;
    remainingCardsInDiscard1: number;
    remainingCardsInDiscard2: number;
    tableEventCard?: EventCard;

    extraSaltExpansion: boolean;
    extraPepperExpansion: boolean;
    doublePoints: boolean;
}

interface SeaSaltPaperGame extends GameGui {
    animationManager: AnimationManager;
    cardsManager: CardsManager;
    eventCardManager: EventCardManager;

    isExtraSaltExpansion(): boolean;
    getPlayerId(): number;
    getPlayerColor(playerId: number): string;

    setTooltip(id: string, html: string): void;
    takeCardsFromDeck(): void;
    onCardClick(card: Card): void;
    onTableCardClick(playerId: number, card: Card): void;
    onDiscardPileClick(discardNumber: number): void;
}

interface EnteringTakeCardsArgs {
    forceTakeOne: boolean;
    canTakeFromDeck: boolean;
    canTakeFromDiscard: number[];
}

interface EnteringChooseCardArgs {
    _private?: {
        cards: Card[];
    }
    cards: Card[];
    discardNumber?: number;
    deckTopCard?: Card;
    remainingCardsInDeck: number;
    opponentId?: number;
}

interface EnteringPlayCardsArgs {
    canDoAction: boolean;
    possiblePairs: number[][];
    hasFourMermaids: boolean;
    mermaidsToEndGame: number;
    canCallEndRound: boolean;
    canStop: boolean;
    canShield: boolean;
}

interface EnteringChooseOpponentArgs {
    playersIds: number[];
}

interface EnteringPlaceShellFaceDownArgs {
    selectableCards: Card[];
}

interface NotifCardInDiscardFromDeckArgs {
    card: Card;
    discardId: number;
    deckTopCard?: Card;
    remainingCardsInDeck: number;
}

interface NotifCardInHandFromDiscardArgs {
    playerId: number;
    card: Card;
    discardId: number;
    newDiscardTopCard: Card | null;
    remainingCardsInDiscard: number;
}

interface NotifCardInHandFromPickArgs {
    playerId: number;
    card?: Card;
    deckTopCard?: Card;
    remainingCardsInDeck: number;
}

interface NotifCardInDiscardFromPickArgs {
    playerId: number;
    card: Card;
    discardId: number;
    remainingCardsInDiscard: number;
}

interface NotifCardsInDeckFromPickArgs {
    playerId: number;
    cards: Card[];
    deckTopCard?: Card;
    remainingCardsInDeck: number;
}

interface NotifScoreArgs {
    playerId: number;
    newScore: number;
    incScore: number;
    details: ScoreDetails;
}

interface NotifPlayCardsArgs {
    playerId: number;
    cards: Card[];
}

interface NotifRevealHandArgs extends NotifPlayCardsArgs {
    playerPoints: number;
}

interface NotifAnnounceEndRoundArgs {
    playerId: number;
    announcement: string;
}

interface NotifEndRoundArgs {
    deckTopCard?: Card;
    remainingCardsInDeck: number;
}

interface NotifBetResultArgs {
    playerId: number;
    result: string;
}

interface NotifUpdateCardsPointsArgs {
    cardsPoints: number;
    detailledPoints: number[];
}

interface NotifStealCardArgs {
    playerId: number;
    opponentId: number;
    card: Card;
}

interface NotifSwapCardArgs {
    playerId: number;
    opponentId: number;
    card: Card;
    card2: Card;
    opponentCards: Card[];
}
interface NotifReshuffleDeckArgs {
    deckTopCard: Card;
}

interface NotifEventCardArgs {
    playerId: number;
    card: EventCard;
}

interface NotifCardArgs {
    playerId: number;
    card: Card;
}

interface EnteringStealPlayedPairArgs {
    opponentIds: number[];
    possiblePairs: { [playerId: number]: Card[][] };
}
