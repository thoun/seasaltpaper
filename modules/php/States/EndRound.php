<?php

namespace Bga\Games\SeaSaltPaper\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\SeaSaltPaper\Game;

class EndRound extends GameState {
    public function __construct(protected Game $game)
    {
        parent::__construct($game,
            id: ST_END_ROUND,
            type: StateType::GAME,
        );
    }

    function onEnteringState() {
        $lastRound = $this->game->isLastRound();
        if (!$lastRound) {
            $this->game->cards->moveAllItemsInLocation(null, 'deck');
            $this->game->cards->shuffle('deck');
            $this->game->cards->updateAllItems('flipped', false); // so protective sheels get back to normal
        }

        $this->notify->all('endRound', '', [
            'deckTopCard' => $this->game->cards->getDeckTopCard(),
            'remainingCardsInDeck' => $this->game->getRemainingCardsInDeck(),
        ]);

        if ($lastRound) {
            return EndScore::class;
        } else {
            $eventCardPlayerId = null;
            if ($this->game->isExtraPepperExpansion()) {
                $eventCardPlayerId = $this->game->eventCards->endRoundGiveEventCard();
            }

            if ($eventCardPlayerId !== null && count($this->game->eventCards->getPlayer($eventCardPlayerId)) > 1) {
                $this->globals->set(DISCARD_EVENT_CARD_PLAYER_ID, $eventCardPlayerId);
                return ChooseKeptEventCard::class;
            } else {
                return NewRound::class;
            }
        }
    }
}