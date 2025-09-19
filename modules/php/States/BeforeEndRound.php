<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class BeforeEndRound extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_MULTIPLAYER_BEFORE_END_ROUND,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'beforeEndRound',
            description: clienttranslate('Some players are seeing end round result'),
            descriptionMyTurn: clienttranslate('End round result'),
        );
    }

    function onEnteringState() {
        $endRound = intval($this->game->getGameStateValue(END_ROUND_TYPE));
        $this->updateScores($endRound);

        if ($this->game->isLastRound()) {
            return EndScore::class;
        } else {
            $this->game->setGameStateValue(FORCE_TAKE_ONE, 0);
            $this->gamestate->setAllPlayersMultiactive();
        }
    }

    #[PossibleAction]
    public function actSeen(int $currentPlayerId) {
        $this->gamestate->setPlayerNonMultiactive($currentPlayerId, EndRound::class);
    }

    function zombie(int $playerId) {
    	return $this->actSeen($playerId);
    }

    function updateScores(int $endRound) {
        $playersIds = $this->game->getPlayersIds();
        $cardsPoints = [];
        foreach($playersIds as $playerId) {
            $cardsPoints[$playerId] = $this->game->getCardsPoints($playerId);
        }

        $playerPoints = array_map(fn($cardsPoint) => $cardsPoint->totalPoints, $cardsPoints);

        if ($endRound == LAST_CHANCE) {
            $lastChanceCaller = intval($this->game->getGameStateValue(LAST_CHANCE_CALLER));
            $betWon = $playerPoints[$lastChanceCaller] >= max($playerPoints);
            $this->game->setGameStateValue(BET_RESULT, $betWon ? 2 : 1);
            
            $this->notify->all('betResult', clienttranslate('${player_name} announced ${announcement}, and the bet is ${result}!'), [
                'playerId' => $lastChanceCaller,
                'player_name' => $this->game->getPlayerNameById($lastChanceCaller),
                'announcement' => $this->game->ANNOUNCEMENTS[LAST_CHANCE],
                'result' => $betWon ? clienttranslate('won') : clienttranslate('lost'),
                'i18n' => ['announcement', 'result'],
            ]);

            foreach($playersIds as $playerId) {
                $isBetCaller = $playerId == $lastChanceCaller;

                $messageOnlyColorBonus = clienttranslate('${player_name} only scores the color bonus of ${colorBonus} (${cardsPoints} cards points are ignored)');
                if ($betWon) {
                    $roundPoints = $isBetCaller ? 
                        $playerPoints[$playerId] + $cardsPoints[$playerId]->colorBonus : 
                        $cardsPoints[$playerId]->colorBonus;
                    $message = $isBetCaller ? 
                        clienttranslate('${player_name} won the bet and scores ${cardsPoints} for cards points, and the color bonus of ${colorBonus}') : 
                        $messageOnlyColorBonus;

                    $this->incPlayerScore($playerId, $roundPoints, $message, [
                        'roundPoints' => $roundPoints,
                        'cardsPoints' => $playerPoints[$playerId],
                        'colorBonus' => $cardsPoints[$playerId]->colorBonus,
                        'details' => $isBetCaller ? [
                            'cardsPoints' => $playerPoints[$playerId],
                            'colorBonus' => $cardsPoints[$playerId]->colorBonus,
                        ] : [
                            'cardsPoints' => null,
                            'colorBonus' => $cardsPoints[$playerId]->colorBonus,
                        ],
                    ]);

                    if ($isBetCaller) {
                        $this->game->incStat(1, 'lastChanceBetWon');
                        $this->game->incStat(1, 'lastChanceBetWon', $playerId);
                    }
                } else {

                    $roundPoints = $isBetCaller ? 
                        $cardsPoints[$playerId]->colorBonus : 
                        $playerPoints[$playerId];
                    $message = $isBetCaller ? 
                        $messageOnlyColorBonus : 
                        clienttranslate('${player_name} scores ${roundPoints} points in this round for cards points');

                    $this->incPlayerScore($playerId, $roundPoints, $message, [
                        'roundPoints' => $roundPoints,
                        'cardsPoints' => $playerPoints[$playerId],
                        'colorBonus' => $cardsPoints[$playerId]->colorBonus,
                        'details' => $isBetCaller ? [
                            'cardsPoints' => null,
                            'colorBonus' => $cardsPoints[$playerId]->colorBonus,
                        ] : [
                            'cardsPoints' =>  $roundPoints,
                            'colorBonus' => null,
                        ],
                    ]);

                    if ($isBetCaller) {
                        $this->game->incStat(1, 'lastChanceBetLost');
                        $this->game->incStat(1, 'lastChanceBetLost', $playerId);
                    }
                }
            }

        } else if ($endRound == STOP) {
            $endCaller = intval($this->game->getGameStateValue(STOP_CALLER));
            
            $this->notify->all('log', clienttranslate('${player_name} announced ${announcement}, every player score the points for their cards'), [
                'playerId' => $endCaller,
                'player_name' => $this->game->getPlayerNameById($endCaller),
                'announcement' => $this->game->ANNOUNCEMENTS[STOP],
                'i18n' => ['announcement'],
            ]);

            foreach($playersIds as $playerId) {
                $roundPoints = $playerPoints[$playerId];                

                $this->incPlayerScore($playerId, $roundPoints, clienttranslate('${player_name} scores ${roundPoints} points in this round for cards points'), [
                    'roundPoints' => $roundPoints,
                    'details' => [
                        'cardsPoints' => $roundPoints,
                        'colorBonus' => null,
                    ],
                ]);
            }
        } else if ($endRound == EMPTY_DECK) {
            $this->notify->all('emptyDeck', clienttranslate('The round ends immediately without scoring because the deck is empty'), []);
        }
    }

    function getPlayerScore(int $playerId) {
        return intval($this->game->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $roundScore, $message = '', $args = []) {
        $this->game->DbQuery("UPDATE player SET `player_score` = `player_score` + $roundScore,  `player_score_aux` = $roundScore WHERE player_id = $playerId");
            
        $this->notify->all('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->game->getPlayerNameById($playerId),
            'newScore' => $this->getPlayerScore($playerId),
            'incScore' => $roundScore,
        ] + $args);
    }
}