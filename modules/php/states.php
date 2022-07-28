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

        // set round number
        $roundNumber = intval($this->getGameStateValue(ROUND_NUMBER));
        $this->setGameStateValue(ROUND_NUMBER, ++$roundNumber);
        $totalRoundNumber = $this->getTotalRoundNumber();

        // init round discard
        foreach([1, 2] as $discardNumber) {
            $card = $this->getCardFromDb($this->cards->pickCardForLocation('deck', 'discard'.$discardNumber));

            self::notifyAllPlayers('cardInDiscardFromDeck', '', [
                'card' => $card,
                'discardId' => $discardNumber,
                'remainingCardsInDeck' => $this->getRemainingCardsInDeck(),
                'roundNumber' => $roundNumber,
            ]);
        }

        self::notifyAllPlayers('log', clienttranslate('Round ${roundNumber}/${totalRoundNumber} begins!'), [
            'roundNumber' => $roundNumber,
            'totalRoundNumber' => $totalRoundNumber,
        ]);

        $this->gamestate->nextState('start');
    }    

    function stNextPlayer() {
        $playerId = intval($this->getActivePlayerId());

        $this->giveExtraTime($playerId);

        //self::incStat(1, 'turnNumber');
        //self::incStat(1, 'turnNumber', $playerId);

        $endRound = intval($this->getGameStateValue(END_ROUND_TYPE));
        $lastChanceCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));

        $newPlayerId = $this->activeNextPlayer();
        if ($endRound == LAST_CHANCE) {
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
            $playersIds = $this->getPlayersIds();
            foreach($playersIds as $pId) {
                $this->revealHand($pId);
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
            
            self::notifyAllPlayers('log', clienttranslate('${player_name} announced ${announcement}, and the bet is ${result}!'), [
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
                }
            }

        } else if ($endRound == STOP) {
            $playerId = intval($this->getActivePlayerId());
            self::notifyAllPlayers('log', clienttranslate('${player_name} announced ${announcement}, every player score the points for their cards'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
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

        $roundNumber = intval($this->getGameStateValue(ROUND_NUMBER));
        $totalRoundNumber = $this->getTotalRoundNumber();
        $lastRound = $roundNumber >= $totalRoundNumber;

        if (!$lastRound) {
            $this->cards->moveAllCardsInLocation(null, 'deck');
            $this->cards->shuffle('deck');
        }

        self::notifyAllPlayers('endRound', '', []);

        $this->gamestate->nextState($lastRound ? 'endScore' : 'newRound');
    }

    function computeStats(int $playerId) {
        /*$scoreSheets = $this->getScoreSheets($playerId, $this->getPlacedRoutes($playerId), $this->getCommonObjectives(), true);
        $scoreSheet = $scoreSheets->validated;
        
        $this->setStat(count(array_filter($scoreSheet->commonObjectives->subTotals, fn($subTotal) => $subTotal == 10)), 'commonObjectivesFirst', $playerId);
        $this->setStat(count(array_filter($scoreSheet->commonObjectives->subTotals, fn($subTotal) => $subTotal == 6)), 'commonObjectivesSecond', $playerId);
        $this->setStat($scoreSheet->personalObjective->total > 0 ? 1 : 0, 'personalObjectives', $playerId);
        $this->setStat($scoreSheet->oldLadies->total, 'finalScoreOldLadies', $playerId);
        $this->setStat($scoreSheet->students->total, 'finalScoreStudents', $playerId);
        $this->setStat($scoreSheet->tourists->total, 'finalScoreTourists', $playerId);
        $this->setStat($scoreSheet->businessmen->total, 'finalScoreBusinessmen', $playerId);
        if ($scoreSheet->oldLadies->checked > 0) {
            $this->setStat((float)$scoreSheet->oldLadies->total / (float)$scoreSheet->oldLadies->checked, 'averagePointsByCheckedOldLadies', $playerId);
        }
        $checkedStudents = $scoreSheet->students->checkedStudents + $scoreSheet->students->checkedInternships;
        if ($checkedStudents > 0) {
            $this->setStat((float)$scoreSheet->students->total / (float)$checkedStudents, 'averagePointsByCheckedStudents', $playerId);
        }
        $checkedTourists = 0;
        foreach ($scoreSheet->tourists->checkedTourists as $checkedTourist) {
            $checkedTourists += $checkedTourist;
        }
        if ($checkedTourists > 0) {
            $this->setStat((float)$scoreSheet->tourists->total / (float)$checkedTourists, 'averagePointsByCheckedTourists', $playerId);
        }
        $checkedBusinessmen = 0;
        foreach ($scoreSheet->businessmen->checkedBusinessmen as $checkedBusinessman) {
            $checkedBusinessmen += $checkedBusinessman;
        }
        if ($checkedBusinessmen > 0) {
            $this->setStat((float)$scoreSheet->businessmen->total / (float)$checkedBusinessmen, 'averagePointsByCheckedBusinessmen', $playerId);
        }*/
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

            $this->computeStats($playerId);
        }

        $this->gamestate->nextState('endGame');
    }
}
