<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class EndScore extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_END_SCORE,
            type: StateType::GAME,
        );
    }

    function onEnteringState() {
        $playersIds = $this->game->getPlayersIds();

        foreach ($playersIds as $playerId) {
            $mermaids = $this->game->getPlayerMermaids($playerId);
            if (count($mermaids) == $this->game->mermaidsToEndGame($playerId)) {
                $this->setPlayerScore($playerId, 100, clienttranslate('${player_name} placed ${number} mermaid cards and immediately wins the game!'), [
                    'number' => count($mermaids),
                ]);

                $this->game->setStat(1, 'winWithMermaids');
                $this->game->setStat(1, 'winWithMermaids', $playerId);
            }
        }

        return ST_END_GAME;
    }

    function setPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->game->DbQuery("UPDATE player SET `player_score` = $amount WHERE player_id = $playerId");
            
        $this->notify->all('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerNameById($playerId),
            'newScore' => $amount,
            'preserve' => ['playerId'],
        ] + $args);
    }
}