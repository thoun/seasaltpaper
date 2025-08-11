<?php

namespace Bga\Games\SeaSaltPaper;

use Bga\GameFrameworkPrototype\Helpers\Arrays;
use Bga\Games\SeaSaltPaper\Objects\Card;

trait UtilTrait {

    //public CardManager $cards;

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

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function isExtraSaltExpansion(): bool {
        return $this->tableOptions->get(EXTRA_SALT_EXPANSION) == 2;
    }

    function isExtraPepperExpansion(): bool {
        return $this->tableOptions->get(EXTRA_PEPPER_EXPANSION) == 2;
    }

    function isDoublePoints() {
        return $this->tableOptions->get(DOUBLE_POINTS) == 2;
    }

    function pointsToEndRound(int $playerId): int {
        return $this->eventCards->playerHasEffect($playerId, THE_TREASURE_CHEST) ? 10 : 7;
    }

    function mermaidsToEndGame(int $playerId): int {
        return $this->eventCards->playerHasEffect($playerId, THE_DANCE_OF_THE_MERMAIDS) ? 3 : 4;
    }

    function getMaxScore() {
        $END_GAME_POINTS = [
            2 => 40,
            3 => 35,
            4 => 30,
        ];

        $maxScore = $END_GAME_POINTS[count($this->getPlayersIds())];

        if ($this->isDoublePoints()) {
            $maxScore *= 2;
        }

        return $maxScore;
    }
    
    function getTotalRoundNumber() {
        return 6 - count($this->getPlayersIds());
    }

    // includeTableHandCards are cards from the hand that have been revealed on table, but never played
    function getPlayerCards(int $playerId, string $from /*'hand' | 'table'*/, bool $includeTableHandCards) {
        $cards = $this->cards->getItemsInLocation($from.$playerId);
        if ($from === 'table') {
            usort($cards, fn($a, $b) => $a->locationArg <=> $b->locationArg);
        }

        if ($includeTableHandCards) {
            $cards = array_merge($cards, $this->cards->getItemsInLocation('tablehand'.$playerId));
        }

        return $cards;
    }

    function getCardsPoints(int $playerId) {
        $tableCards = $this->getPlayerCards($playerId, 'table', false);
        $handCards = $this->getPlayerCards($playerId, 'hand', true);

        $cardsScore = new Objects\CardsPoints($tableCards, $handCards, $this->eventCards->getPlayerEffects($playerId));
        return $cardsScore;
    }

    function updateCardsPoints(int $playerId) {
        $cardsPointsObj = $this->getCardsPoints($playerId);
        $this->notifyPlayer($playerId, 'updateCardsPoints', '', [
            'cardsPoints' => $cardsPointsObj->totalPoints,
            'detailledPoints' => $cardsPointsObj->detailledPoints,
        ]);
    }

    function getPlayerMermaids(int $playerId) {
        $tableCards = $this->getPlayerCards($playerId, 'table', false);
        $handCards = $this->getPlayerCards($playerId, 'hand', true);
        $playerCards = array_merge($tableCards, $handCards);
        $mermaidCards = array_values(array_filter($playerCards, fn($card) => $card->category == MERMAID));

        return $mermaidCards;
    }

    function revealHand(int $playerId) {
        $handCards = $this->getPlayerCards($playerId, 'hand', false);

        if (count($handCards) > 0) {
            $this->cards->moveAllItemsInLocation('hand'.$playerId, 'tablehand'.$playerId);

            $playerPoints = $this->getCardsPoints($playerId)->totalPoints;
            $this->notify->all('revealHand', clienttranslate('${player_name} reveals a hand worth ${points} points'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerNameById($playerId),
                'cards' => $this->getPlayerCards($playerId, 'table', true),
                'points' => $playerPoints,
                'playerPoints' => $playerPoints,
            ]);
        }
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $roundScore, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = `player_score` + $roundScore,  `player_score_aux` = $roundScore WHERE player_id = $playerId");
            
        $this->notify->all('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'newScore' => $this->getPlayerScore($playerId),
            'incScore' => $roundScore,
        ] + $args);
    }

    function setPlayerScore(int $playerId, int $amount, $message = '', $args = []) {
        $this->DbQuery("UPDATE player SET `player_score` = $amount WHERE player_id = $playerId");
            
        $this->notify->all('score', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerNameById($playerId),
            'newScore' => $amount,
            'preserve' => ['playerId'],
        ] + $args);
    }

    function isProtected(int $playerId): bool {
        return Arrays::some($this->getPlayerCards($playerId, 'table', true), fn($card) => $card->flipped);
    }

    function getPossibleOpponentsToSteal(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return Arrays::filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && 
            $this->cards->countItemsInLocation('hand'.$playerId) > 0 &&
            !$this->isProtected($playerId),
        );
    }

    function getPlayedPairs(int $playerId): array {
        $playedCards = $this->getPlayerCards($playerId, 'table', false); // do not include card from call
        $playedPairs = [];

        foreach ($playedCards as $index => $card) {
            $previousCard = $index > 0 ? $playedCards[$index - 1] : null;
            $nextCard = $index < (count($playedCards) - 1) ? $playedCards[$index + 1] : null;
            if (
                $previousCard !== null 
                && !Arrays::some($playedPairs, fn($playedPair) => Arrays::some($playedPair, fn($pc) => $previousCard->id == $pc->id))
                && ($nextCard === null || $nextCard->category === PAIR)
                && $previousCard->category === PAIR
                && $card->category === PAIR
            ) {
                $playedPairs[] = [$previousCard, $card];
            }
        }

        return $playedPairs;
    }

    function getPossibleOpponentsToStealFromTable(int $stealerId) {
        $playersIds = $this->getPlayersIds();

        return Arrays::filter($playersIds, fn($playerId) => 
            $playerId != $stealerId && 
            $this->cards->countItemsInLocation('tablehand'.$playerId) === 0 && // to make sure the player didn't made a call, you can't steal player who laid all their cards
            count($this->getPlayedPairs($playerId)) > 0 &&
            !$this->isProtected($playerId),
        );
    }

    function applyStealRandomCard(int $stealerId, int $robbedPlayerId) {
        $cardsInHand = $this->getPlayerCards($robbedPlayerId, 'hand', false);
        $cardsNumber = count($cardsInHand);
        if ($cardsNumber > 0) {
            $randomCard = $cardsInHand[bga_rand(0, $cardsNumber - 1)];
            $this->applyStealSpecificCard($stealerId, $robbedPlayerId, $randomCard);
        }
    }

    function applyStealSpecificCard(int $stealerId, int $robbedPlayerId, Card $card) {
        $this->cards->moveItem($card, 'hand'.$stealerId);
        $this->cardCollected($stealerId, $card);

        $args = [
            'playerId' => $stealerId,
            'opponentId' => $robbedPlayerId,
            'player_name' => $this->getPlayerNameById($stealerId),
            'player_name2' => $this->getPlayerNameById($robbedPlayerId),
            'preserve' => ['actionPlayerId'],
            'actionPlayerId' => $stealerId,
        ];
        $argCardName = [
            'cardName' => $this->getCardName($card),
            'cardColor' => $this->COLORS[$card->color],
            'i18n' => ['cardName', 'cardColor'],
        ];
        $argCard = [
            'card' => $card,
        ];
        $argMaskedCard = [
            'card' => Card::onlyId($card),
        ];

        $this->notify->all('stealCard', clienttranslate('${player_name} steals a card from ${player_name2} hand'), $args + $argMaskedCard);
        $this->notifyPlayer($robbedPlayerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was stolen from your hand'), $args + $argCardName + $argMaskedCard);
        $this->notifyPlayer($stealerId, 'stealCard', clienttranslate('Card ${cardColor} ${cardName} was picked from ${player_name2} hand'), $args + $argCardName + $argCard);

        $this->updateCardsPoints($stealerId);
        $this->updateCardsPoints($robbedPlayerId);
    }

    function playableDuoCards(int $playerId) {
        $familyPairs = [];
        $pairSwimmerAndSharks = $this->eventCards->playerHasEffect($playerId, THE_WATER_RODEO);
        $handCards = $this->getPlayerCards($playerId, 'hand', false);
        $pairCards = array_values(array_filter($handCards, fn($card) => $card->category == PAIR));
        for ($family = CRAB; $family <= LOBSTER; $family++) {
            $familyCards = array_values(array_filter($pairCards, fn($card) => $card->family == $family));
            if (count($familyCards) > 0) {
                $matchFamilies = $familyCards[0]->matchFamilies;
                if ($pairSwimmerAndSharks && in_array($family, [SWIMMER, SHARK])) {
                    $matchFamilies[] = $family;
                }

                if ($this->array_some($matchFamilies, fn($matchFamily) => 
                    count(array_filter($pairCards, fn($card) => $card->family == $matchFamily)) >= ($matchFamily == $family ? 2 : 1)
                )) {
                    $familyPairs[] = $family;
                }
            }
        }

        return $familyPairs;
    }

    function getPossiblePairs(int $playerId) {
        $possiblePairs = [
            [CRAB, CRAB],
            [CRAB, LOBSTER],
            [BOAT, BOAT],
            [FISH, FISH],
            [SWIMMER, SHARK],
            [SWIMMER, JELLYFISH],
            [BOAT, BOAT],
        ];
        if ($this->eventCards->playerHasEffect($playerId, THE_WATER_RODEO)) {
            $possiblePairs[] = [SWIMMER, SWIMMER];
            $possiblePairs[] = [SHARK, SHARK];
        }
        
        $pairCards = Arrays::filter(
            $this->getPlayerCards($playerId, 'hand', false), 
            fn($card) => $card->category == PAIR
        );

        $possiblePairs = Arrays::filter($possiblePairs, 
            function($possiblePair) use ($pairCards) {
                if ($possiblePair[0] === $possiblePair[1]) {
                    return Arrays::count($pairCards, fn($card) => $card->family == $possiblePair[0]) >= 2;
                } else {
                    return Arrays::count($pairCards, fn($card) => $card->family == $possiblePair[0]) >= 1
                        && Arrays::count($pairCards, fn($card) => $card->family == $possiblePair[1]) >= 1;
                }
            }
        );
        return $possiblePairs;
    }

    function getCardName(Card $card) {
        switch ($card->category) {
            case MERMAID: return clienttranslate('Mermaid');
            case PAIR:
                switch ($card->family) {
                    case CRAB: return clienttranslate('Crab');
                    case BOAT: return clienttranslate('Boat');
                    case FISH: return clienttranslate('Fish');
                    case SWIMMER: return clienttranslate('Swimmer');
                    case SHARK: return clienttranslate('Shark');
                    case JELLYFISH: return clienttranslate('Jellyfish');
                    case LOBSTER: return clienttranslate('Lobster');
                }
                break;
            case COLLECTION:
                switch ($card->family) {
                    case SHELL: return clienttranslate('Shell');
                    case OCTOPUS: return clienttranslate('Octopus');
                    case PENGUIN: return clienttranslate('Penguin');
                    case SAILOR: return clienttranslate('Sailor');
                }
                break;
            case MULTIPLIER:
                switch ($card->family) {
                    case LIGHTHOUSE: return clienttranslate('The lighthouse');
                    case SHOAL_FISH: return clienttranslate('The shoal of fish');
                    case PENGUIN_COLONY: return clienttranslate('The penguin colony');
                    case CAPTAIN: return clienttranslate('The captain');
                    case CAST_CRAB: return clienttranslate('The cast of crabs');
                }
                break;
            case SPECIAL:
                switch ($card->family) {
                    case STARFISH: return clienttranslate('Starfish');
                    case SEAHORSE: return clienttranslate('Seahorse');
                }
                break;
        }

        return '';
    }

    function getRemainingCardsInDeck() {
        return $this->cards->countItemsInLocation('deck');
    }

    function getRemainingCardsInDiscard(int $number) {
        return $this->cards->countItemsInLocation('discard'.$number);
    }

    function cardCollected(int $playerId, Card $card) {
        $number = $card->category;
        if ($number <= 4) {
            $this->incStat(1, 'cardsCollected'.$number);
            $this->incStat(1, 'cardsCollected'.$number, $playerId);
        }
    }
}
