<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class NextPlayer extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_NEXT_PLAYER,
            type: StateType::GAME,
        );
    }

    function onEnteringState(int $activePlayerId) {
        $this->game->giveExtraTime($activePlayerId);

        $this->game->incStat(1, 'turnsNumber');
        $this->game->incStat(1, 'turnsNumber', $activePlayerId);

        $endRound = intval($this->game->getGameStateValue(END_ROUND_TYPE));

        $newPlayerId = $this->game->activeNextPlayer();

        if ($this->game->getGameStateValue(FORCE_TAKE_ONE) == $newPlayerId) {
            $this->game->setGameStateValue(FORCE_TAKE_ONE, 0);
        }

        if ($endRound == LAST_CHANCE) {
            $lastChanceCaller = intval($this->game->getGameStateValue(LAST_CHANCE_CALLER));

            $this->revealHand($activePlayerId);

            if ($lastChanceCaller == $newPlayerId) {
                $this->game->activeNextPlayer();
                return BeforeEndRound::class;
            } else if ($lastChanceCaller == 0) {
                $this->game->setGameStateValue(LAST_CHANCE_CALLER, $activePlayerId);
            }
        }

        $emptyDeck = false;
            if ($endRound == 0) {
            $emptyDeck = $this->game->cards->countItemsInLocation('deck') === 0;

            if ($emptyDeck) {
                $this->game->setGameStateValue(END_ROUND_TYPE, EMPTY_DECK);
            }
        }

        if ($endRound == STOP) {
            $endCaller = intval($this->game->getGameStateValue(STOP_CALLER));
            $this->revealHand($endCaller);
            $pId = intval($this->game->getPlayerAfter($endCaller));
            while ($pId != $endCaller) {
                $this->revealHand($pId);
                $pId = intval($this->game->getPlayerAfter($pId));
            }
        }

        if ($emptyDeck || $endRound == STOP) {
            return BeforeEndRound::class;
        } else {
            return TakeCards::class;
        }
    }

    function revealHand(int $playerId) {
        $handCards = $this->game->getPlayerCards($playerId, 'hand', false);

        if (count($handCards) > 0) {
            $this->game->cards->moveAllItemsInLocation('hand'.$playerId, 'tablehand'.$playerId);

            $playerPoints = $this->game->getCardsPoints($playerId)->totalPoints;
            $this->notify->all('revealHand', clienttranslate('${player_name} reveals a hand worth ${points} points'), [
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
                'cards' => $this->game->getPlayerCards($playerId, 'table', true),
                'points' => $playerPoints,
                'playerPoints' => $playerPoints,
            ]);
        }
    }
}