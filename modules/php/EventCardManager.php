<?php
declare(strict_types=1);

namespace Bga\Games\SeaSaltPaper;

require_once(__DIR__.'/framework-prototype/item/item.php');
require_once(__DIR__.'/framework-prototype/item/item-field.php');
require_once(__DIR__.'/framework-prototype/item/item-location.php');
require_once(__DIR__.'/framework-prototype/item/item-manager.php');

use \Bga\GameFrameworkPrototype\Item\ItemManager;
use Bga\Games\SeaSaltPaper\Objects\EventCard;

class EventCardManager extends ItemManager {
    function __construct(
        protected $game,
    ) {
        parent::__construct(
            EventCard::class,
            [],
        );
    }

    function setup() {
        $cards = [];
        for ($type = 1; $type < 12; $type++) {
            $cards[] = [ 'location' => 'deck', 'type' => $type, 'nbr' => 1 ];
        }
        $this->createItems($cards);
        $this->shuffle('deck');
        $this->pickItemForLocation('deck', null, 'table');
    }

    public function getTable(): ?EventCard {
        $table = $this->getItemsInLocation('table');
        return count($table) > 0 ? $table[0] : null;
    }

    public function getPlayer(int $playerId): array {
        return $this->getItemsInLocation('player', $playerId);
    }

    function endRoundGiveEventCard(): ?int {
        $card = $this->getTable();
        
        $playerId = null;
        $scores = $this->game->score->getAll();

        $valuesCount = array_count_values($scores);

        if ($card->for === 'top') {
            $max = max($scores);
            if ($valuesCount[$max] === 1) {
                $playerId = array_search($max, $scores);
            }
        } else if ($card->for === 'bottom') {
            $min = min($scores);
            if ($valuesCount[$min] === 1) {
                $playerId = array_search($min, $scores);
            }
        }

        if ($playerId !== null) {
            $this->moveItem($card, 'player', $playerId);
            
            $message = $card->for === 'top' ?
                clienttranslate('${player_name} takes the event card (player with the most points)') :
                clienttranslate('${player_name} takes the event card (player with the fewest points)');
            $this->game->notify->all('takeEventCard', $message, [ // TODO handle
                'playerId' => $playerId,
                'player_name' => $this->game->getPlayerNameById($playerId),
                'card' => $card,
            ]);
        }

        return $playerId;
    }

}
