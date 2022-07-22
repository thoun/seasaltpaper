<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

        //$this->insertRoutes(2343492, [16, 15, 14, 24, 34, 44, 43, 53, 63, 64, 74, 73]);
        //$this->insertRoutes(2343493, [16, 15, 14, 24, 34, 44, 43, 53, 63, 64, 74, 73]);

        // table https://boardgamearena.com/archive/replay/220513-1000/?table=267222414&player=1559197&comments=86175279;#
        //$this->insertRoutes(2343492, [36, 46, 56, 55, 65, 66, 76, 75, 85, 95, 96, 106, 105, 115, 125, 124, 123, 113, 103, 102/*, 101, 91*/]);
        
        //$this->debugSetStart(2343492, 36);
        //$this->debugSetStart(2343493, 23);
        //$this->gamestate->jumpToState(ST_START_GAME);

        $this->debugSetCommonObjective(1, 3);
        //$this->DbQuery("UPDATE common_objectives SET `completed_at_round` = 1");
        //$this->debugSetCommonObjective(2, 5);
    }

    function insertRoutes(int $playerId, array $positions, int $validated = 1) {
        for($i=0; $i < count($positions) - 1; $i++) {
            $from = $positions[$i];
            $to = $positions[$i+1];
            $useTurnZone = 0;
            $this->DbQuery("INSERT INTO placed_routes(`player_id`, `from`, `to`, `round`, `use_turn_zone`, `traffic_jam`, `validated`) VALUES ($playerId, $from, $to, 0, $useTurnZone, 1, $validated)");
        }
    }

    function debugStart() {
        $playersIds = $this->getPlayersIds();

        $MAP_DEPARTURE_POSITIONS = [
            'small' => [
              1 => 23,
              2 => 36,
              3 => 61,
              4 => 65,
              5 => 97,
              6 => 114,
            ],
          
            'big' => [
              1 => 51,
              2 => 71,
              3 => 42,
              4 => 112,
              5 => 34,
              6 => 104,
              7 => 15,
              8 => 106,
              9 => 58,
              10 => 118,
              11 => 29,
              12 => 89,
            ],
          ];

        foreach ($playersIds as $playerId) {
            $tickets = $this->getCardsFromDb($this->tickets->getCardsInLocation('hand', $playerId));
            $ticketNumber = $tickets[0]->type;
            $position = $MAP_DEPARTURE_POSITIONS[$this->getMap()][$ticketNumber]; 
            $this->DbQuery("UPDATE player SET `player_departure_position` = $position WHERE `player_id` = $playerId");
            $this->tickets->moveAllCardsInLocation('hand', 'discard', $playerId);
        }

        $this->gamestate->jumpToState(ST_START_GAME);
    }

    function debugSetStart(int $playerId, int $position) {
        $this->DbQuery("UPDATE player SET `player_departure_position` = $position WHERE `player_id` = $playerId");
        $this->tickets->moveAllCardsInLocation('hand', 'discard', $playerId);
    }

    function debugSetCommonObjective(int $number, int $objective) {
        $this->DbQuery("UPDATE common_objectives SET `id` = $objective WHERE `number` = $number");
    }

    function debugLastRound() {
        $this->DbQuery("update `tickets` set card_location='discard' where card_location='deck'");
    }

    function debugTest() {
        $this->debugStart();
        $this->DbQuery("update `tickets` set card_location='discard' where card_location='deck' AND card_type <> 3");
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
			$this->DbQuery("UPDATE stats SET stats_player_id=$sid WHERE stats_player_id = $id" );

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
