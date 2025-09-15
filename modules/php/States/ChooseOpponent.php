<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class ChooseOpponent extends GameState
{
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_PLAYER_CHOOSE_OPPONENT,
            type: StateType::ACTIVE_PLAYER,
            description: clienttranslate('${actplayer} must choose a card to steal'),
            descriptionMyTurn: clienttranslate('${you} must choose a card to steal'),
        );
    }

    function getArgs(int $activePlayerId): array
    {
        $possibleOpponentsToSteal = $this->game->getPossibleOpponentsToSteal($activePlayerId);

        return [
            'playersIds' => $possibleOpponentsToSteal,
        ];
    }

    #[PossibleAction]
    public function actChooseOpponent(int $id, int $activePlayerId)
    {
        if ($this->game->globals->get(CAN_CHOOSE_CARD_TO_STEAL, false)) {
            $this->game->globals->set(STOLEN_PLAYER, $id);
            return SwapCard::class;
        } else {
            $this->game->applyStealRandomCard($activePlayerId, $id);

            return PlayCards::class;
        }
    }

    function zombie(int $playerId)
    {
        $args = $this->getArgs($playerId);
        $possibleMoves = $args['playersIds'];
        $zombieChoice = $possibleMoves[bga_rand(0, count($possibleMoves) - 1)]; // random choice over possible moves

        return $this->actChooseOpponent($zombieChoice, $playerId);
    }
}
