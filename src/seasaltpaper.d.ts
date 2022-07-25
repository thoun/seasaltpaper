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

interface SeaSaltPaperPlayer extends Player {
    playerNo: number;
    handCount: number;
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
    handCards: Card[];
    roundNumber: number;
    remainingCardsInDeck: number;
    discardTopCard1: Card;
    discardTopCard2: Card;
}

interface SeaSaltPaperGame extends Game {
    cards: Cards;

    getPlayerId(): number;
    getPlayerColor(playerId: number): string;

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
}

interface EnteringPlayCardsArgs {
    canCallEndRound: boolean;
}

interface NotifCardInHandFromDiscardArgs {
    playerId: number;
    card: Card;
    discardId: number;
    newDiscardTopCard: Card | null;
}

interface NotifCardInHandFromPickArgs {
    playerId: number;
    card?: Card;
}

interface NotifCardInDiscardFromPickArgs {
    playerId: number;
    card: Card;
    discardId: number;
}

interface NotifScoreArgs {
    playerId: number;
    newScore: number;
}

interface NotifPlayCardsArgs {
    playerId: number;
    cards: Card[];
}
