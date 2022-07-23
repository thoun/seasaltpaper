<?php

class CardType {
    public int $category;
    public int $family;
    public int $color;
    public int $number;
  
    public function __construct(int $category, int $family, int $color, int $number) {
        $this->category = $category;
        $this->family = $family;
        $this->color = $color;
        $this->number = $number;
    } 
}

class SirenCard extends CardType {  
    public function __construct() {
        parent::__construct(SIREN, 0, 0, 4);
    } 
}

class PairCard extends CardType {
    public int $matchType;

    public function __construct(int $family, int $matchType,  int $color, int $number) {
        parent::__construct(PAIR, $family, $color, $number);
        $this->matchType = $matchType;
    } 
}
class CrabPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(CRAB, CRAB, $color, $number);
    } 
}
class BoatPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(BOAT, BOAT, $color, $number);
    } 
}
class FishPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(FISH, FISH, $color, $number);
    } 
}
class SwimmerPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(SWIMMER, SHARK, $color, $number);
    } 
}
class SharkPairCard extends PairCard {
    public function __construct(int $color, int $number = 1) {
        parent::__construct(SHARK, SWIMMER, $color, $number);
    } 
}

class CollectionCard extends CardType {
    public function __construct(int $family, int $color) {
        parent::__construct(COLLECTION, $family, $color, 1);
    } 
}
class MultiplierCard extends CardType {
    public int $matchType;

    public function __construct(int $family, int $matchType,  int $color) {
        parent::__construct(MULTIPLIER, $family, $color, 1);
        $this->matchType = $matchType;
    } 
}

class Card extends CardType {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $index;
    public /*int|null*/ $matchType;

    public function __construct($dbCard, $CARDS_TYPE) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->locationArg = intval($dbCard['location_arg']);
        $type = intval($dbCard['type']);
        $typeArg = intval($dbCard['type_arg']);

        $this->category = floor($type / 10);
        $this->family = $type % 10;
        $this->color = floor($typeArg / 10);
        $this->index = $typeArg % 10;

        foreach ($CARDS_TYPE as $cardType) {
            if ($cardType->category == $this->category && $cardType->family == $this->family) {
                if (property_exists($cardType, 'matchType')) {
                    $this->matchType = $cardType->matchType;
                }
                break;
            }
        }
    } 
}
?>