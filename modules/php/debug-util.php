<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        $this->debugSetMermaids();
        $this->debugSetMermaidOnDeckTop();
    }

    function debugSetMermaids() {
        $playerId = 2343492;
        $number = 4;
        $cards = array_slice($this->getCardsFromDb(array_values($this->cards->getCardsOfType(10))), 0, $number);
        $this->cards->moveCards(array_map(fn($card) => $card->id, $cards), 'hand'.$playerId, 99);
    }

    function debugSetMermaidOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck' LIMIT 1" );
    }

    function debugSetMermaidsOnDeckTop() {
        $this->DbQuery("UPDATE card SET card_location_arg=1000 WHERE card_type = 10 AND card_location = 'deck'" );
    }

    function debugEmptyDeck() {
        $leave = 2;
        $move = intval($this->cards->countCardInLocation('deck')) - $leave;
        $this->cards->pickCardsForLocation($move, 'deck', 'discard');
    }

    function debugFillHands() {
        $number = 20;
        $playersIds = $this->getPlayersIds();
        foreach($playersIds as $playerId) {
            $this->cards->pickCardsForLocation($number, 'deck', 'hand'.$playerId);
        }
    }

    public function debugReplacePlayersIds() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

		// These are the id's from the BGAtable I need to debug.
		$ids = [
            92432695,
            87587865,
            88804802
		];

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );
			$this->DbQuery("UPDATE card SET card_location_arg=$sid WHERE card_location_arg = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE placed_routes SET player_id=$sid WHERE player_id = $id" );
			
			++$sid;
		}
	}

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}
