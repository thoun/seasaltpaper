<?php

namespace Bga\Games\SeaSaltPaper\Objects;

use \Bga\GameFrameworkPrototype\Item\Item;
use \Bga\GameFrameworkPrototype\Item\ItemField;

#[Item('event_card')]
class EventCard {
    #[ItemField(kind: 'id')]
    public int $id;
    #[ItemField(kind: 'location')]
    public string $location;
    #[ItemField(kind: 'location_arg')]
    public ?int $locationArg = 0;
    #[ItemField]
    public int $type;
    #[ItemField(kind: 'order')]
    public ?int $order;

    public string $for;

    public function setup(array $dbCard) {
        $this->for = in_array($this->type, [5, 6, 8, 9]) ? 'top' : 'bottom';
    }
}
?>