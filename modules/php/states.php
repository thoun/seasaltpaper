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

        $endScore = false; // TODO $this->getRemainingCardCountOnTable() === 0;

        if (!$endScore) {
            $this->activeNextPlayer();
        }

        $this->gamestate->nextState($endScore ? 'endScore' : 'nextPlayer');
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
