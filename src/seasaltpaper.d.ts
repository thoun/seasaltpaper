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
    sheetType: number;
    departurePosition: number;
    personalObjective?: number;
    personalObjectiveLetters?: number[];
    personalObjectivePositions?: number[];
    scoreSheets: ScoreSheets;
    markers: PlacedRoute[];
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
    placeDeparturePawn(position: number): void;
    placeRoute(from: number, to: number): void;
    isVisibleScoring(): boolean;
    getTooltip(element: number): string;
}

interface EnteringPlaceDeparturePawnArgs {
    _private?: {
        tickets: number[];
        positions: number[];
    };
}

interface EnteringPlaceRouteArgs {
    playerId: number;
    canConfirm: boolean;
    canCancel: boolean;
    currentPosition: number;
    possibleRoutes: PossibleRoute[];
}

interface NotifNewRoundArgs {
    round: number;
    validatedTickets: number[];
    currentTicket: number | null;
}

interface NotifNewFirstPlayerArgs {
    playerId: number;
}

interface NotifUpdateScoreSheetArgs {
    playerId: number;
    scoreSheets: ScoreSheets;
}

interface NotifPlacedDeparturePawnArgs {
    playerId: number;
    position: number;
} 

interface NotifPlacedRouteArgs {
    playerId: number;
    marker: PlacedRoute;
    zones: number[];
    position: number;
} 

interface NotifConfirmTurnArgs {
    playerId: number;
    markers: PlacedRoute[];
}

interface NotifFlipObjectiveArgs {
    objective: CommonObjective;
}

interface NotifRevealPersonalObjectiveArgs {
    playerId: number;
    personalObjective: number;
    personalObjectiveLetters: number[];
    personalObjectivePositions: number[];
}
