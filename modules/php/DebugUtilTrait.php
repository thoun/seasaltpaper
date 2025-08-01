<?php

namespace Bga\Games\SeaSaltPaper;

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        $this->debug_FillHands();
        //$this->debug_FillTable();
        //$this->debug_SetMermaids();
        //$this->debug_SetMermaidOnDeckTop();
        //$this->debug_SetCardInHand(2343492, COLLECTION, SAILOR, ORANGE);
        //$this->debug_SetCardInHand(2343492, COLLECTION, SAILOR, PINK);
        //$this->debug_SetCardInHand(2343492, MULTIPLIER, CAPTAIN, LIGHT_ORANGE);

        //$this->debug_SetCardInHand(2343492, COLLECTION, OCTOPUS, YELLOW);
        //$this->debug_SetCardInHand(2343492, COLLECTION, OCTOPUS, PURPLE);
        //$this->debug_SetCardInHand(2343492, COLLECTION, PENGUIN, PURPLE);
        //$this->debug_SetCardInHand(2343492, COLLECTION, PENGUIN, PINK);
        //$this->debug_SetCardInHand(2343492, MULTIPLIER, PENGUIN_COLONY, GREEN);
        //$this->debug_SetCardInHand(2343492, SPECIAL, SEAHORSE, WHITE);
        //$this->debug_SetCardInHand(2343492, MERMAID, 0, WHITE);

        /*$this->debug_SetCardInHand(2343492, PAIR, SHARK, DARK_BLUE);
        $this->debug_SetCardInHand(2343492, PAIR, SHARK, PURPLE);
        $this->debug_SetCardInHand(2343492, PAIR, SWIMMER, LIGHT_BLUE);
        $this->debug_SetCardInHand(2343492, PAIR, JELLYFISH, PURPLE);*/
        //$this->debug_SetCardInHand(2343492, PAIR, CRAB, DARK_BLUE);
        //$this->debug_SetCardInHand(2343492, PAIR, CRAB, LIGHT_BLUE);
        /*$this->debug_SetCardInHand(2343492, PAIR, LOBSTER, BLACK);
        $this->debug_SetCardInHand(2343492, SPECIAL, STARFISH, YELLOW);*/
        //$this->debug_SetCardInHand(2343492, PAIR, CRAB, BLACK);
        //$this->debug_SetCardInHand(2343492, PAIR, LOBSTER, BLACK);
        /*$this->debug_SetCardInHand(2343492, COLLECTION, OCTOPUS, YELLOW);
        $this->debug_SetCardInHand(2343492, COLLECTION, OCTOPUS, PURPLE);
        $this->debug_SetCardInHand(2343492, SPECIAL, SEAHORSE, WHITE);
        $this->debug_SetCardInHand(2343492, COLLECTION, SAILOR, PINK);
        $this->debug_SetCardInHand(2343492, MULTIPLIER, CAPTAIN, LIGHT_ORANGE);*/

        $this->gamestate->changeActivePlayer(2343492);
    }

    function debug_SetMermaids() {
        $playerId = 2343492;
        $number = 4;
        $cards = array_slice($this->getCardsFromDb(array_values($this->cards->getCardsOfType(10))), 0, $number);
        $this->cards->moveCards(array_map(fn($card) => $card->id, $cards), 'hand'.$playerId, 99);
    }

    function debug_SetMermaidOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck' LIMIT 1" );
    }

    function debug_SetMermaidsOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck'" );
    }

    private function debug_GetCardByTypes($category, $family, $color, $index = 0) {
        return $this->getCardsFromDb($this->cards->getCardsOfType($category * 10 + $family, $color * 10 + $index))[0];
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

    function debug_FillHands() {
        $number = 15;
        $playersIds = $this->getPlayersIds();
        foreach($playersIds as $playerId) {
            $playerId == 2343492 && $this->cards->pickCardsForLocation($number, 'deck', 'hand'.$playerId);
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
}
