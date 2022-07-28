<?php

function array_find_key(array $array, callable $fn) {
    foreach ($array as $key => $value) {
        if($fn($value)) {
            return $key;
        }
    }
    return null;
}

class CardsPoints {
    public int $visiblePoints;
    public int $totalPoints;
    public int $colorBonus;

    public function __construct(array $tableCards, array $handCards) {
        $this->visiblePoints = $this->getPoints($tableCards); // visible before total, for colorBonus
        $this->totalPoints = 7 + $this->getPoints($tableCards + $handCards);
    }

    private function getPoints(array $cards) {
        $points = 0;

        $mermaidCards = array_values(array_filter($cards, fn($card) => $card->category == MERMAID));
        $pairCards = array_values(array_filter($cards, fn($card) => $card->category == PAIR));
        $collectionCards = array_values(array_filter($cards, fn($card) => $card->category == COLLECTION));
        $multiplierCards = array_values(array_filter($cards, fn($card) => $card->category == MULTIPLIER));

        $numberByColor = [];
        foreach($cards as $card) {
            if ($card->color > 0) {
                if (array_key_exists($card->color, $numberByColor)) {
                    $numberByColor[$card->color]++;
                } else {
                    $numberByColor[$card->color] = 1;
                }
            }
        }
        $this->colorBonus = count($numberByColor) > 0 ? max($numberByColor) : 0;

        // Mermaids
        $mermaidCount = count($mermaidCards);
        while ($mermaidCount > 0) {
            if (count($numberByColor) == 0) {
                break;
            }

            $maxColor = count($numberByColor) > 0 ? max($numberByColor) : 0;
            $points += $maxColor;

            $maxColorIndex = array_find_key($numberByColor, fn($val) => $val == $maxColor);
            unset($numberByColor[$maxColorIndex]);

            $mermaidCount--;
        }

        // Pairs
        for ($family = CRAB; $family <= FISH; $family++) {
            $points += floor(count(array_values(array_filter($pairCards, fn($card) => $card->family == $family))) / 2);
        }
        $points += min(
            count(array_values(array_filter($pairCards, fn($card) => $card->family == SWIMMER))),
            count(array_values(array_filter($pairCards, fn($card) => $card->family == SHARK))),
        );

        // Collections
        for ($family = SHELL; $family <= SAILOR; $family++) {
            $count = count(array_values(array_filter($collectionCards, fn($card) => $card->family == $family)));
            if ($count > 0) {
                $points += COLLECTION_POINTS[$family][$count];
            }
        }
        
        // Multipliers
        for ($family = LIGHTHOUSE; $family <= CAPTAIN; $family++) {
            $multiplierCardsOfFamily = array_values(array_filter($multiplierCards, fn($card) => $card->family == $family));
            if (count($multiplierCardsOfFamily) > 0) {
                $multiplierCard = $multiplierCardsOfFamily[0];
                $points += $multiplierCard->points * count(array_values(array_filter($cards, fn($card) => $card->category == $multiplierCard->matchCategory && $card->family == $multiplierCard->matchFamily)));
            }
        }

        return $points;
    }
}
?>