<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    

    function stNextPlayer() {
        $playerId = $this->getActivePlayerId();

        $this->giveExtraTime($playerId);

        //self::incStat(1, 'turnNumber');
        //self::incStat(1, 'turnNumber', $playerId);

        $lastChanceCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));

        if ($lastChanceCaller > 0) {
            $this->revealHand($playerId);
        }

        $newPlayerId = $this->activeNextPlayer();
        if ($lastChanceCaller == $newPlayerId) {
            $this->activeNextPlayer();
            $this->gamestate->nextState('endRound');
            return;
        } else if ($lastChanceCaller == 1) {
            $this->setGameStateValue(LAST_CHANCE_CALLER, $playerId);
        }
        $this->gamestate->nextState('nextPlayer');

        $emptyDeck = intval($this->cards->countCardInLocation('deck')) === 0;

        if (!$emptyDeck) {
            $this->setGameStateValue(LAST_CHANCE_CALLER, -1);
        }

        $this->gamestate->nextState($emptyDeck ? 'endRound' : 'nextPlayer');
    }

    function stEndRound() {
        $lastChanceCaller = intval($this->getGameStateValue(LAST_CHANCE_CALLER));
        if ($lastChanceCaller >= 0) { // we didn't reach the end of the deck pile, so we count scores

            $lastChanceBet = $lastChanceCaller > 0;
            

        } else {
            self::notifyAllPlayers('log', clienttranslate('The round ends immediately without scoring because the deck is empty'), []);
        }

        $this->setGameStateValue(LAST_CHANCE_CALLER, 0);

        $roundNumber = intval($this->getGameStateValue(ROUND_NUMBER));
        $totalRoundNumber = $this->getTotalRoundNumber();
        $lastRound = $roundNumber >= $totalRoundNumber;

        if (!$lastRound) {
            $this->cards->moveAllCardsInLocation(null, 'deck');
            $this->cards->shuffle('deck');

            $this->initRoundDiscard();

            // TODO notif
        }

        $this->gamestate->nextState($lastRound ? 'endScore' : 'newRound');
    }

    function computeStats(int $playerId) {
        $scoreSheets = $this->getScoreSheets($playerId, $this->getPlacedRoutes($playerId), $this->getCommonObjectives(), true);
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
        }
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();
        $map = $this->getMap();
        foreach ($playersIds as $playerId) {
            if (!$this->isEliminated($playerId)) {
                $scoreSheets = $this->notifUpdateScoreSheet($playerId, true);
                $score = $scoreSheets->validated->total;
                $this->DbQuery("UPDATE player SET `player_score` = $score WHERE `player_id` = $playerId");
            }

            $personalObjective = intval($this->getUniqueValueFromDB("SELECT player_personal_objective FROM `player` where `player_id` = $playerId"));

            $personalObjectiveLetters = array_map(fn($code) => chr($code), $this->getPersonalObjectiveLetters($playerId));
            self::notifyAllPlayers('revealPersonalObjective', clienttranslate('${player_name} personal objective was ${objectiveLetters}'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'objectiveLetters' => implode(' ', $personalObjectiveLetters),
                'personalObjective' => $personalObjective,
                'personalObjectiveLetters' => $personalObjectiveLetters,
                'personalObjectivePositions' => $this->getPersonalObjectivePositions($personalObjective, $map),
            ]);

            $this->computeStats($playerId);
        }

        $this->gamestate->nextState('endGame');
    }
}
