/**
 * Your game interfaces
 */

interface Card {
    id: number;
    category: number;
    family: number;
    color: number;
    index: number;
}

interface ScoreDetails {
    cardsPoints: number | null;
    colorBonus: number | null;
}

interface SeaSaltPaperPlayer extends Player {
    playerNo: number;
    handCards: Card[];
    tableCards: Card[];
    cardsPoints?: number;
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
    remainingCardsInDeck: number;
    discardTopCard1: Card;
    discardTopCard2: Card;
    remainingCardsInDiscard1: number;
    remainingCardsInDiscard2: number;
}

interface SeaSaltPaperGame extends Game {
    animationManager: AnimationManager;
    cardsManager: CardsManager;

    getPlayerId(): number;
    getPlayerColor(playerId: number): string;

    updateTableHeight(): void;
    setTooltip(id: string, html: string): void;
    takeCardsFromDeck(): void;
    onCardClick(card: Card): void;
    onDiscardPileClick(discardNumber: number): void;
}

interface EnteringTakeCardsArgs {
    canTakeFromDeck: boolean;
    canTakeFromDiscard: number[];
}

interface EnteringChooseCardArgs {
    _private?: {
        cards: Card[];
    }
    cards: Card[];
    discardNumber?: number;
    remainingCardsInDeck: number;
}

interface EnteringPlayCardsArgs {
    canDoAction: boolean;
    playableDuoCards: number[];
    hasFourMermaids: boolean;
    canCallEndRound: boolean;
}

interface EnteringChooseOpponentArgs {
    playersIds: number[];
}

interface NotifCardInDiscardFromDeckArgs {
    card: Card;
    discardId: number;
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
}

interface NotifCardInDiscardFromPickArgs {
    playerId: number;
    card: Card;
    discardId: number;
    remainingCardsInDiscard: number;
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

interface NotifBetResultArgs {
    playerId: number;
    result: string;
}

interface NotifUpdateCardsPointsArgs {
    cardsPoints: number;
}

interface NotifStealCardArgs {
    playerId: number;
    opponentId: number;
    card: Card;
}
