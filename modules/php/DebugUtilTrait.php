<?php

namespace Bga\Games\SeaSaltPaper;

use Exception;

function debug(...$debugData) {
    if (Game::getBgaEnvironment() != 'studio') { 
        return;
    }die('debug data : <pre>'.substr(json_encode($debugData, JSON_PRETTY_PRINT), 1, -1).'</pre>');
}

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debug_SetMermaids() {
        $playerId = 2343492;
        $number = $this->mermaidsToEndGame($playerId);
        $cards = array_slice(array_values($this->cards->getCardsOfType(10)), 0, $number);
        $this->cards->moveCards(array_map(fn($card) => $card->id, $cards), 'hand'.$playerId, 99);
    }

    function debug_SetMermaidOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck' LIMIT 1" );
    }

    function debug_SetMermaidsOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck'" );
    }

    private function debug_GetCardByTypes($category, $family, $color, $index = 0) {
        return $this->cards->getCardsOfType($category * 10 + $family, $color * 10 + $index)[0];
    }

    private function debug_SetCardInHand($playerId, $category, $family, $color, $index = 0) {
        $card = $this->debug_GetCardByTypes($category, $family, $color, $index);
        $this->cards->moveCard($card->id, 'hand'.$playerId);
    }

    function debug_EmptyDeck() {
        $leave = 2;
        $move = intval($this->cards->countCardInLocation('deck')) - $leave;
        $this->cards->pickCardsForLocation($move, 'deck', 'discard');
    }

    function debug_fillHand(int $playerId, int $number = 12) {
        $this->cards->pickItemsForLocation($number, 'deck', null, 'hand'.$playerId);
    }

    function debug_fillHands(int $number = 12) {
        $playerIds = $this->getPlayersIds();
        foreach ($playerIds as $playerId) {
            $this->debug_fillHand($playerId, $number);
        }
    }

    function debug_FillTable() {
        $number = 10;
        $playersIds = $this->getPlayersIds();
        foreach($playersIds as $playerId) {
            $this->cards->pickCardsForLocation($number, 'deck', 'table'.$playerId);
        }
    }

    function debug_FillDiscards() {
        $number = 10;
        foreach([1, 2] as $pile) {
            $this->cards->pickCardsForLocation($number, 'deck', 'discard'.$pile);
        }
    }

    function debug_SetPlayerScore(int $playerId, int $score = 30) {
        $this->DbQuery("UPDATE `player` SET player_score = $score WHERE player_id = $playerId" );
    }

    function debug_SetTableEventCard(int $type) {
        $this->DbQuery("UPDATE event_card SET `type` = $type WHERE `location` = 'table'" );
    }
    
    function debug_goToState(int $stateId = 3) {
        $this->gamestate->jumpToState($stateId);
    }
   
    function debug_playToEndGame() {
        $count = 0;
        while ($this->gamestate->getCurrentMainStateId() < ST_END_GAME && $count < 100) {
            $count++;
            foreach($this->gamestate->getActivePlayerList() as $playerId) {
                $playerId = (int)$playerId;
                try {
                    $this->gamestate->runStateClassZombie($this->gamestate->getCurrentState($playerId), $playerId);
                } catch (\Throwable $e) {
                    $count = 999;
                }
            }
        }
    }
}
