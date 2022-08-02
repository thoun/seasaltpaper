<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stNewRound() {
        // init round discard
        foreach([1, 2] as $discardNumber) {
            $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'discard'.$discardNumber));

            self::notifyAllPlayers('cardInDiscardFromDeck', '', [
                'card' => $card,
                'discardId' => $discardNumber,
                'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
            ]);
        }

        $this->incStat(1, 'roundNumber');

        self::notifyAllPlayers('log', clienttranslate('A new round begins!'), []);

        $this->gamestate->nextState('start');
    }    

    function stNextPlayer() {
        $playerId = intval($this->getActivePlayerId());

        $this->giveExtraTime($playerId);

        $this->incStat(1, 'turnsNumber');
        $this->incStat(1, 'turnsNumber', $playerId);

        $endRound = intval($this->getGameStateValue(END_ROUND_TYPE));

        $newPlayerId = $this->activeNextPlayer();
        if ($endRound == LAST_CHANCE) {
            $lastChanceCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));

            $this->revealHand($playerId);

            if ($lastChanceCaller == $newPlayerId) {
                $this->activeNextPlayer();
                $this->gamestate->nextState('endRound');
                return;
            } else if ($lastChanceCaller == 0) {
                $this->setGameStateValue(LAST_CHANCE_CALLER, $playerId);
            }
        }

        $emptyDeck = false;
            if ($endRound == 0) {
            $emptyDeck = intval($this->cards->countCardInLocation('deck')) === 0;

            if ($emptyDeck) {
                $this->setGameStateValue(END_ROUND_TYPE, EMPTY_DECK);
            }
        }

        $immediateEndRound = $emptyDeck || $endRound == STOP;
        if ($immediateEndRound) {
            $endCaller = intval($this->getGameStateValue(STOP_CALLER));
            $this->revealHand($endCaller);
            $pId = intval($this->getPlayerAfter($endCaller));
            while ($pId != $endCaller) {
                $this->revealHand($pId);
                $pId = intval($this->getPlayerAfter($pId));
            }
        }

        $this->gamestate->nextState($immediateEndRound ? 'endRound' : 'newTurn');
    }

    function updateScores(int $endRound) {
        $playersIds = $this->getPlayersIds();
        $cardsPoints = [];
        foreach($playersIds as $playerId) {
            $cardsPoints[$playerId] = $this->getCardsPoints($playerId);
        }

        $playerPoints = array_map(fn($cardsPoint) => $cardsPoint->totalPoints, $cardsPoints);

        if ($endRound == LAST_CHANCE) {
            $lastChanceCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));
            $betWon = $playerPoints[$lastChanceCaller] >= max($playerPoints);
            
            self::notifyAllPlayers('betResult', clienttranslate('${player_name} announced ${announcement}, and the bet is ${result}!'), [
                'playerId' => $lastChanceCaller,
                'player_name' => $this->getPlayerName($lastChanceCaller),
                'announcement' => _('LAST CHANCE'),
                'result' => $betWon ? _('won') : _('lost'),
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
                    ]);

                    if ($isBetCaller) {
                        $this->incStat(1, 'lastChanceBetWon');
                        $this->incStat(1, 'lastChanceBetWon', $playerId);
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
                    ]);

                    if ($isBetCaller) {
                        $this->incStat(1, 'lastChanceBetLost');
                        $this->incStat(1, 'lastChanceBetLost', $playerId);
                    }
                }
            }

        } else if ($endRound == STOP) {
            $endCaller = intval($this->getGameStateValue(STOP_CALLER));
            self::notifyAllPlayers('log', clienttranslate('${player_name} announced ${announcement}, every player score the points for their cards'), [
                'playerId' => $endCaller,
                'player_name' => $this->getPlayerName($endCaller),
                'announcement' => _('STOP'),
                'i18n' => ['announcement'],
            ]);

            foreach($playersIds as $playerId) {
                $roundPoints = $playerPoints[$playerId];
                $this->incPlayerScore($playerId, $roundPoints, clienttranslate('${player_name} scores ${roundPoints} points in this round for cards points'), [
                    'roundPoints' => $roundPoints,
                ]);
            }
        } else if ($endRound == EMPTY_DECK) {
            self::notifyAllPlayers('log', clienttranslate('The round ends immediately without scoring because the deck is empty'), []);
        }
    }

    function stEndRound() {
        $endRound = intval($this->getGameStateValue(END_ROUND_TYPE));
        $this->updateScores($endRound);

        $this->setGameStateValue(END_ROUND_TYPE, 0);
        $this->setGameStateValue(LAST_CHANCE_CALLER, 0);
        $this->setGameStateValue(STOP_CALLER, 0);

        $maxScore = $this->END_GAME_POINTS[count($this->getPlayersIds())];
        $topScore = $this->getPlayerTopScore();

        $lastRound = $topScore >= $maxScore;
        if (!$lastRound) {
            $this->cards->moveAllCardsInLocation(null, 'deck');
            $this->cards->shuffle('deck');
        }

        self::notifyAllPlayers('endRound', '', []);

        $this->gamestate->nextState($lastRound ? 'endScore' : 'newRound');
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();

        // update player_score_aux
        $playerId = intval($this->getPlayerBefore($this->getActivePlayerId()));
        $scoreAux = count($playersIds);
        while ($scoreAux >= 1) {
            $this->DbQuery("UPDATE `player` SET `player_score_aux` = $scoreAux WHERE `player_id` = $playerId"); 
            $playerId = intval($this->getPlayerBefore($playerId));
            $scoreAux--;
        }

        foreach ($playersIds as $playerId) {
            $mermaids = $this->getPlayerMermaids($playerId);
            if (count($mermaids) == 4) {
                $this->setPlayerScore($playerId, 100, clienttranslate('${player_name} placed 4 mermaid cards and immediately wins the game!'), []);
            }
        }

        $this->gamestate->nextState('endGame');
    }
}
