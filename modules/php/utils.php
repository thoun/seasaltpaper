<?php

require_once(__DIR__.'/objects/shape.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_find_key(array $array, callable $fn) {
        foreach ($array as $key => $value) {
            if($fn($value)) {
                return $key;
            }
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
    
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function array_identical(array $a1, array $a2) {
        if (count($a1) != count($a2)) {
            return false;
        }
        for ($i=0;$i<count($a1);$i++) {
            if ($a1[$i] != $a2[$i]) {
                return false;
            }
        }
        return true;
    }

    function getFirstPlayerId() {
        return intval(self::getGameStateValue(FIRST_PLAYER));
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = $playerId");
    }
    
    function isEliminated(int $playerId) {
        return boolval(self::getUniqueValueFromDB("SELECT player_eliminated FROM player WHERE player_id = $playerId"));
    }

    function getCardFromDb(array $dbCard) {
        if (!$dbCard || !array_key_exists('id', $dbCard)) {
            throw new \Error('card doesn\'t exists '.json_encode($dbCard));
        }
        if (!$dbCard || !array_key_exists('location', $dbCard)) {
            throw new \Error('location doesn\'t exists '.json_encode($dbCard));
        }
        return new Shape($dbCard);
    }

    function getCardsFromDb(array $dbCards) {
        return array_map(fn($dbCard) => $this->getCardFromDb($dbCard), array_values($dbCards));
    }

    function setupShapes() {
        $shapes = [];
        for ($i = 1; $i <= 18; $i++) {
            $shapes[] = [ 'type' => $i, 'type_arg' => null, 'nbr' => 1 ];
        }
        $this->shapes->createCards($shapes, 'deck');
        $this->shapes->shuffle('deck');
    }

    function setupCommonObjectives() {
        $commonObjectives = [1, 2, 3, 4, 5, 6];

        for ($i = 1; $i <= 2; $i++) {
            $commonObjectiveIndex = bga_rand(0, count($commonObjectives) - 1);
            $commonObjective = array_splice($commonObjectives, $commonObjectiveIndex, 1)[0];
            $commonObjectives = array_values($commonObjectives);

            $this->DbQuery("INSERT INTO common_objectives(`id`, `number`) VALUES ($commonObjective, $i)");
        }
    }

    function getPlacedRoutes(/*int | null*/ $playerId = null) {
        $sql = "SELECT * FROM `placed_routes` ";
        if ($playerId != null) {
            $sql .= "WHERE `player_id` = $playerId ";
        }
        $sql .= "ORDER by `id` ASC";
        $dbResult = self::getCollectionFromDb($sql);

        return array_map(fn($dbCard) => new PlacedRoute($dbCard), array_values($dbResult));
    }

    function getCurrentPosition(int $playerId, array $placedRoutes) {
        if (count($placedRoutes) > 0) {
            return end($placedRoutes)->to;
        } else {
            return intval($this->getUniqueValueFromDB("SELECT player_departure_position FROM `player` where `player_id` = $playerId"));
        }
    }
    
    function getDestinations(string $mapSize, int $position) {
        $routes = [];

        foreach($this->MAP_ROUTES[$mapSize] as $from => $tos) {
            if ($from === $position) {
                $routes = array_merge($routes, $tos);
            } else {
                $routeToSpot = $this->array_find($tos, fn($to) => $to == $position);
                if ($routeToSpot !== null) {
                    $routes[] = $from;
                }
            }
        } 

        return $routes;
    }

    function isSameRoute(object $route, int $from, int $to) {
        return ($route->from === $from && $route->to === $to) || ($route->to === $from && $route->from === $to);
    }

    function isBusyRoute(array $busyRoutes, int $position, int $destination) {
        return 
            (array_key_exists($position, $busyRoutes) && in_array($destination, $busyRoutes[$position])) ||
            (array_key_exists($destination, $busyRoutes) && in_array($position, $busyRoutes[$destination]));
    }

    function createPossibleRoute(int $position, int $destination, array $allPlacedRoutes, array $playerPlacedRoutes, array $unvalidatedRoutes, array $turnShape, array $busyRoutes) {
        $trafficJam = count(array_filter(
            $allPlacedRoutes, 
            fn($route) => $this->isSameRoute($route, $position, $destination)
        ));

        if ($this->isBusyRoute($busyRoutes, $position, $destination)) {
            $trafficJam++;
        }

        $useTurnZone = false;
        $angle = $turnShape[count($unvalidatedRoutes)]; // 0 means any shape, 1 straight, 2 turn.
        if ($angle > 0) {
            $lastRoute = end($playerPlacedRoutes);
            $lastDirection = abs($lastRoute->from - $lastRoute->to) <= 1;
            $nextDirection = abs($position - $destination) <= 1;

            if ($angle === 1) {
                $useTurnZone = $lastDirection !== $nextDirection;
            } else if ($angle === 2) {
                $useTurnZone = $lastDirection === $nextDirection;
            }
        }

        $isElimination = $this->array_some($playerPlacedRoutes, fn($route) => $route->from === $destination || $route->to === $destination);

        return new PossibleRoute($position, $destination, $trafficJam, $useTurnZone, $isElimination);
    }

    function getPlayerTurnShape(int $playerId) {
        $sheetTypeIndex = intval(self::getUniqueValueFromDB("SELECT player_sheet_type FROM player WHERE player_id = $playerId")) - 1;
        $currentTicket = $this->getCurrentTicketForRound();
        $currentTicketIndex = ($currentTicket - 1) % 6;
        $playerShapes = array_merge(
            array_slice($this->SCORE_SHEETS_SHAPES, 6 - $sheetTypeIndex),
            array_slice($this->SCORE_SHEETS_SHAPES, 0, 6 - $sheetTypeIndex),
        );

        return $playerShapes[$currentTicketIndex];
    }

    function getPossibleRoutes(int $playerId, string $mapSize, array $turnShape, int $position, array $allPlacedRoutes) {
        $busyRoutes = $this->BUSY_ROUTES[$mapSize];

        $playerPlacedRoutes = array_filter($allPlacedRoutes, fn($placedRoute) => $placedRoute->playerId === $playerId);
        $unvalidatedRoutes = array_filter($playerPlacedRoutes, fn($placedRoute) => !$placedRoute->validated);

        $possibleDestinations = array_values(array_filter(
            $this->getDestinations($mapSize, $position), 
            fn($destination) => !$this->array_some($playerPlacedRoutes, fn($placedRoute) => $this->isSameRoute($placedRoute, $position, $destination))
        ));

        if (count($unvalidatedRoutes) >= count($turnShape)) {
            $isGreenLight = in_array(GREEN_LIGHT, $this->MAP_POSITIONS[$mapSize][$position]);

            if ($isGreenLight) {
                $turnShape = [...$turnShape, 0, 0, 0, 0, 0];
            } else {
                return [];
            }
        }

        return array_map(fn($destination) => $this->createPossibleRoute($position, $destination, $allPlacedRoutes, $playerPlacedRoutes, $unvalidatedRoutes, $turnShape, $busyRoutes), $possibleDestinations);
    }

    function getRoundNumber() {
        $stateId = intval($this->gamestate->state_id());
        if ($stateId < ST_START_GAME) {
            return 0;
        }

        return min(12, intval($this->tickets->countCardInLocation('discard')) + 1);
    }

    function getValidatedTicketsForRound() {
        $stateId = intval($this->gamestate->state_id());
        if ($stateId < ST_START_GAME) {
            return [];
        }

        $tickets = $this->getCardsFromDb($this->tickets->getCardsInLocation('discard'));
        return array_map(fn($ticket) => $ticket->type, $tickets);
    }

    function getCurrentShape() {
        $shape = $this->getCardsFromDb($this->shapes->getCardsInLocation('current'))[0];
        return $shape;
    }

    function getPersonalObjectiveType(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_personal_objective FROM `player` where `player_id` = $playerId"));
    }

    function getPersonalObjectiveLetters(int $playerId) {
        return $this->PERSONAL_OBJECTIVES[$this->getMap()][$this->getPersonalObjectiveType($playerId)];
    }

    function getCommonObjectives() {
        $sql = "SELECT * FROM `common_objectives`";
        $dbResult = self::getCollectionFromDb($sql);

        return array_map(fn($dbCard) => new CommonObjective($dbCard), array_values($dbResult));
    }
    
    function notifCurrentRound() {
        $validatedTickets = $this->getValidatedTicketsForRound();
        $currentTicket = $this->getCurrentTicketForRound();
        
        $message = $currentTicket == null ? '' : clienttranslate('Round ${round}/12 starts!');

        $this->notifyAllPlayers('newRound', $message, [
            'round' => min(12, count($validatedTickets) + 1),
            'validatedTickets' => $validatedTickets,
            'currentTicket' => $currentTicket,
        ]);
    }

    function notifUpdateScoreSheet(int $playerId, bool $endScoring = false) {
        $scoreSheets = $this->getScoreSheets($playerId, $this->getPlacedRoutes($playerId), $this->getCommonObjectives(), $endScoring);
        
        $this->notifyAllPlayers('updateScoreSheet', '', [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'scoreSheets' => $scoreSheets,
        ]);

        return $scoreSheets;
    }
    
    function markCompletedCommonObjectives() {
        $objectives = $this->getCommonObjectives();
        if (count(array_filter($objectives, fn($objective) => !$objective->completed)) === 0) {
            return;
        }

        $playersIds = $this->getPlayersIds();
        $allPlacedRoutes = $this->getPlacedRoutes();
        $scoreSheets = array_map(fn($playerId) => $this->getScoreSheets(
            $playerId, 
            array_filter($allPlacedRoutes, fn($placedRoute) => $placedRoute->playerId === $playerId), 
            $objectives
        ), $playersIds);

        foreach ($objectives as $objective) {
            if (!$objective->completed && $this->array_some($scoreSheets, fn($scoreSheet) => $scoreSheet->validated->commonObjectives->subTotals[$objective->number - 1] != null)) {
                $round = $this->getRoundNumber();
                $this->DbQuery("UPDATE common_objectives SET `completed_at_round` = $round WHERE `id` = $objective->id");

                $this->notifyAllPlayers('flipObjective', clienttranslate('A common objective have been completed'), [
                    'objective' => $objective,
                ]);
            }
        }
    }

    function getPersonalObjectivePositions(int $personalObjective, string $map) {
        $letters = $this->PERSONAL_OBJECTIVES[$map][$personalObjective];
        return array_map(
            fn($letter) => $this->array_find_key($this->MAP_POSITIONS[$map], fn($positionElements) => in_array($letter, $positionElements)),
            $letters
        );
    }
}
